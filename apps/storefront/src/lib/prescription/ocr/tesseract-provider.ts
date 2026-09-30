import { createWorker } from "tesseract.js";
import { OcrProvider } from "./ocr-provider";
import { OcrProviderError } from "./ocr-errors";

/**
 * TesseractOcrProvider
 * Triển khai OCR mã nguồn mở dựa trên Tesseract.js (WebAssembly)
 * Hỗ trợ nhận diện chữ tiếng Việt (vie) và tiếng Anh y khoa (eng).
 */
export class TesseractOcrProvider implements OcrProvider {
  public readonly name = "tesseract";

  public async recognize(
    pageBuffer: Buffer,
    _mimeType: string,
    options?: {
      language?: string;
      timeoutMs?: number;
    }
  ): Promise<{ text: string; confidence: number | null }> {
    const lang = options?.language || "vie+eng";
    let worker: any = null;

    try {
      worker = await createWorker(lang);

      const ret = await worker.recognize(pageBuffer);
      const rawText = ret.data.text || "";

      // Tesseract trả confidence thang điểm 0-100, chuẩn hóa về 0.0 - 1.0
      let normalizedConfidence: number | null = null;
      if (typeof ret.data.confidence === "number" && !isNaN(ret.data.confidence)) {
        normalizedConfidence = Math.max(0, Math.min(1, parseFloat((ret.data.confidence / 100).toFixed(4))));
      }

      return {
        text: rawText.trim(),
        confidence: normalizedConfidence,
      };
    } catch (error: any) {
      console.error("[TesseractOcrProvider Error] Quá trình OCR thất bại:", error);
      throw new OcrProviderError(
        `Bộ máy OCR Tesseract gặp sự cố trong quá trình nhận dạng: ${error?.message || "Lỗi không xác định"}`
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          // Bỏ qua lỗi terminate
        }
      }
    }
  }
}

export const tesseractOcrProvider = new TesseractOcrProvider();
