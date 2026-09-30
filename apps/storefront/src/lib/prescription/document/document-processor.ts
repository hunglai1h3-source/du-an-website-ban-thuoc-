import { ProcessedDocument } from "./document-types";
import { imageProcessor } from "./image-processor";
import { pdfProcessor } from "./pdf-processor";
import { ValidationError } from "../errors";

/**
 * DocumentProcessor (Master Router)
 * Điều phối tài liệu y tế sang bộ tiền xử lý tương ứng (Image hoặc PDF).
 */
export class DocumentProcessor {
  public async processDocument(
    buffer: Buffer,
    mimeType: string,
    fileExtension: string
  ): Promise<ProcessedDocument> {
    const normMime = (mimeType || "").toLowerCase();
    const normExt = (fileExtension || "").toLowerCase();

    // 1. Xử lý tài liệu PDF
    if (normMime === "application/pdf" || normExt === ".pdf") {
      return await pdfProcessor.processPdf(buffer);
    }

    // 2. Xử lý hình ảnh đơn thuốc (JPEG, JPG, PNG)
    if (
      normMime === "image/jpeg" ||
      normMime === "image/png" ||
      normExt === ".jpg" ||
      normExt === ".jpeg" ||
      normExt === ".png"
    ) {
      return await imageProcessor.processImage(buffer, normMime || "image/jpeg");
    }

    throw new ValidationError(
      `Định dạng tài liệu "${mimeType}" không được hỗ trợ bởi quy trình OCR.`,
      415,
      "UNSUPPORTED_TYPE"
    );
  }
}

export const documentProcessor = new DocumentProcessor();
