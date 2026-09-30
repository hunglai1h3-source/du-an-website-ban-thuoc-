import prisma from "@/lib/prisma";
import {
  PrescriptionStorageService,
  prescriptionStorage,
} from "../storage";
import { documentProcessor, DocumentProcessor } from "../document/document-processor";
import { OcrProvider } from "./ocr-provider";
import { tesseractOcrProvider } from "./tesseract-provider";
import {
  OcrApiResponseData,
  OcrPageResult,
  OCR_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
  OCR_LOW_CONFIDENCE_THRESHOLD,
} from "./ocr-types";
import {
  OcrAlreadyProcessingError,
  OcrNotFoundError,
  OcrTimeoutError,
  OcrError,
} from "./ocr-errors";
import { NotFoundError, ValidationError } from "../errors";

export class OcrService {
  private storage: PrescriptionStorageService;
  private processor: DocumentProcessor;
  private provider: OcrProvider;
  private db: typeof prisma;

  constructor(
    storageService: PrescriptionStorageService = prescriptionStorage,
    docProcessor: DocumentProcessor = documentProcessor,
    ocrProvider: OcrProvider = tesseractOcrProvider,
    dbClient: typeof prisma = prisma
  ) {
    this.storage = storageService;
    this.processor = docProcessor;
    this.provider = ocrProvider;
    this.db = dbClient;
  }

  /**
   * Khởi chạy hoặc thử lại tiến trình bóc tách OCR cho đơn thuốc
   */
  public async runOcr(
    prescriptionId: string,
    options?: {
      forceRetry?: boolean;
    }
  ): Promise<OcrApiResponseData> {
    if (!prescriptionId || typeof prescriptionId !== "string") {
      throw new ValidationError("Mã định danh đơn thuốc không hợp lệ.", 400, "INVALID_ID");
    }

    const startTime = Date.now();

    // 1. Kiểm tra sự tồn tại của đơn thuốc trong CSDL
    const prescription = await this.db.prescription.findUnique({
      where: { id: prescriptionId },
      include: { ocrResult: { include: { pages: true } } },
    });

    if (!prescription) {
      throw new NotFoundError(`Không tìm thấy đơn thuốc với mã ID: ${prescriptionId}`);
    }

    // 2. Kiểm tra tệp tin thực tế trong Private Storage
    const fileBuffer = await this.storage.getFile(prescription.storageKey);
    if (!fileBuffer) {
      throw new NotFoundError("Tệp đơn thuốc không tồn tại trên hệ thống lưu trữ an toàn.");
    }

    // 3. Kiểm soát trạng thái & Chống lặp tác vụ (Idempotency)
    const existingOcr = prescription.ocrResult;

    if (existingOcr) {
      if (existingOcr.status === "PROCESSING") {
        throw new OcrAlreadyProcessingError(
          "Tiến trình bóc tách OCR đang được thực hiện. Vui lòng chờ hoàn tất."
        );
      }

      if (existingOcr.status === "COMPLETED" && !options?.forceRetry) {
        // Đã hoàn thành trước đó -> trả về ngay kết quả hiện có
        return this.formatOcrData(prescriptionId, existingOcr);
      }

      if (existingOcr.status === "FAILED" && !options?.forceRetry) {
        if (existingOcr.attemptCount >= MAX_RETRY_ATTEMPTS) {
          throw new OcrError(
            `Đơn thuốc đã thử bóc tách tối đa ${MAX_RETRY_ATTEMPTS} lần nhưng không thành công. Vui lòng kiểm tra lại chất lượng hình ảnh.`,
            422,
            "MAX_RETRY_EXCEEDED"
          );
        }
      }
    }

    const currentAttempt = (existingOcr?.attemptCount || 0) + 1;

    // 4. Cập nhật trạng thái sang PROCESSING
    await this.db.$transaction([
      this.db.prescription.update({
        where: { id: prescriptionId },
        data: { status: "OCR_PROCESSING" },
      }),
      this.db.prescriptionOcrResult.upsert({
        where: { prescriptionId },
        create: {
          prescriptionId,
          provider: this.provider.name,
          status: "PROCESSING",
          fullText: "",
          pageCount: 1,
          attemptCount: currentAttempt,
        },
        update: {
          provider: this.provider.name,
          status: "PROCESSING",
          attemptCount: currentAttempt,
          errorMessage: null,
          errorCode: null,
        },
      }),
    ]);

    try {
      // 5. Tiền xử lý tài liệu (Document Processing: Ảnh / PDF)
      const processedDoc = await this.processor.processDocument(
        fileBuffer,
        prescription.mimeType,
        prescription.fileExtension
      );

      // 6. Thực thi OCR với cơ chế Timeout an toàn
      const pagesResult: OcrPageResult[] = [];

      for (const page of processedDoc.pages) {
        let pageText = "";
        let pageConfidence: number | null = null;

        // Nếu là tài liệu PDF đã có text layer chuẩn từ bệnh viện
        if (page.isTextLayer && page.extractedText) {
          pageText = page.extractedText;
          pageConfidence = 1.0; // Văn bản số trực tiếp có độ tin cậy tuyệt đối
        } else {
          // Chạy OCR qua Provider với timeout kiểm soát
          const ocrPromise = this.provider.recognize(page.buffer, page.mimeType, {
            timeoutMs: OCR_TIMEOUT_MS,
          });

          const timeoutPromise = new Promise<{ text: string; confidence: number | null }>(
            (_, reject) =>
              setTimeout(
                () => reject(new OcrTimeoutError("Quá thời gian xử lý OCR cho trang tài liệu.")),
                OCR_TIMEOUT_MS
              )
          );

          const result = await Promise.race([ocrPromise, timeoutPromise]);
          pageText = result.text;
          pageConfidence = result.confidence;
        }

        pagesResult.push({
          pageNumber: page.pageNumber,
          text: pageText,
          confidence: pageConfidence,
        });
      }

      // 7. Tổng hợp kết quả và tính Confidence trung bình thực tế
      const fullText = pagesResult.map((p) => p.text).join("\n\n").trim();
      const validConfidences = pagesResult
        .map((p) => p.confidence)
        .filter((c): c is number => typeof c === "number" && !isNaN(c));

      let averageConfidence: number | null = null;
      if (validConfidences.length > 0) {
        const sum = validConfidences.reduce((a, b) => a + b, 0);
        averageConfidence = parseFloat((sum / validConfidences.length).toFixed(4));
      }

      const processingDuration = Date.now() - startTime;

      let savedOcrId = "";
      // 8. Lưu kết quả vào CSDL và cập nhật trạng thái COMPLETED
      await this.db.$transaction(async (tx) => {
        // Cập nhật kết quả tổng quan
        const savedOcr = await tx.prescriptionOcrResult.update({
          where: { prescriptionId },
          data: {
            status: "COMPLETED",
            fullText,
            pageCount: processedDoc.pageCount,
            averageConfidence,
            processingTimeMs: processingDuration,
            errorMessage: null,
            errorCode: null,
          },
        });
        savedOcrId = savedOcr.id;

        // Xóa các trang cũ nếu là lượt retry
        await tx.prescriptionOcrPage.deleteMany({
          where: { ocrResultId: savedOcr.id },
        });

        // Tạo các trang mới
        if (pagesResult.length > 0) {
          await tx.prescriptionOcrPage.createMany({
            data: pagesResult.map((p) => ({
              ocrResultId: savedOcr.id,
              pageNumber: p.pageNumber,
              text: p.text,
              confidence: p.confidence,
            })),
          });
        }

        // Cập nhật trạng thái Prescription
        await tx.prescription.update({
          where: { id: prescriptionId },
          data: { status: "OCR_COMPLETED" },
        });
      });

      console.info(
        `[OCR Completed] Đơn thuốc ${prescriptionId} đã hoàn tất OCR (${processedDoc.pageCount} trang, thời gian: ${processingDuration}ms).`
      );

      return {
        id: savedOcrId,
        prescriptionId,
        status: "COMPLETED",
        provider: this.provider.name,
        pageCount: processedDoc.pageCount,
        averageConfidence,
        pages: pagesResult,
        fullText,
        attemptCount: currentAttempt,
        processingTimeMs: processingDuration,
        isLowConfidence:
          averageConfidence !== null && averageConfidence < OCR_LOW_CONFIDENCE_THRESHOLD,
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`[OCR Failed] Đơn thuốc ${prescriptionId} xử lý thất bại:`, error);

      const errMessage = error?.message || "Quá trình OCR thất bại.";
      const errCode = error?.code || "OCR_FAILED";

      // Cập nhật trạng thái FAILED trong CSDL để lưu vết
      try {
        await this.db.$transaction([
          this.db.prescription.update({
            where: { id: prescriptionId },
            data: { status: "OCR_FAILED" },
          }),
          this.db.prescriptionOcrResult.update({
            where: { prescriptionId },
            data: {
              status: "FAILED",
              errorMessage: errMessage,
              errorCode: errCode,
              processingTimeMs: Date.now() - startTime,
            },
          }),
        ]);
      } catch (dbErr) {
        console.error("Không thể cập nhật trạng thái lỗi OCR vào DB:", dbErr);
      }

      throw error;
    }
  }

  /**
   * Lấy kết quả OCR an toàn theo ID đơn thuốc
   */
  public async getOcrResult(prescriptionId: string): Promise<OcrApiResponseData> {
    if (!prescriptionId) {
      throw new ValidationError("Mã định danh đơn thuốc không hợp lệ.", 400, "INVALID_ID");
    }

    const prescription = await this.db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        ocrResult: {
          include: {
            pages: {
              orderBy: { pageNumber: "asc" },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundError(`Không tìm thấy đơn thuốc với mã ID: ${prescriptionId}`);
    }

    if (!prescription.ocrResult) {
      return {
        prescriptionId,
        status: "PENDING",
        pageCount: 0,
        fullText: "",
      };
    }

    return this.formatOcrData(prescriptionId, prescription.ocrResult);
  }

  /**
   * Format dữ liệu OCR chuẩn hóa cho API phản hồi
   */
  private formatOcrData(prescriptionId: string, ocr: any): OcrApiResponseData {
    const pages: OcrPageResult[] = (ocr.pages || []).map((p: any) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      confidence: p.confidence,
    }));

    return {
      id: ocr.id,
      prescriptionId,
      status: ocr.status,
      provider: ocr.provider,
      pageCount: ocr.pageCount,
      averageConfidence: ocr.averageConfidence,
      pages,
      fullText: ocr.fullText,
      attemptCount: ocr.attemptCount,
      processingTimeMs: ocr.processingTimeMs || undefined,
      isLowConfidence:
        ocr.averageConfidence !== null &&
        ocr.averageConfidence < OCR_LOW_CONFIDENCE_THRESHOLD,
      errorMessage: ocr.errorMessage || undefined,
      errorCode: ocr.errorCode || undefined,
      completedAt: ocr.updatedAt ? ocr.updatedAt.toISOString() : undefined,
    };
  }
}

export const ocrService = new OcrService();
