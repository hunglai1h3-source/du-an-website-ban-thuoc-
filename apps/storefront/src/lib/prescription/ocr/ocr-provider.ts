/**
 * OCR Provider Abstraction Interface
 * Cho phép dễ dàng hoán đổi giữa Tesseract.js, Google Cloud Vision, Azure OCR, AWS Textract
 */
export interface OcrProvider {
  readonly name: string;
  recognize(
    pageBuffer: Buffer,
    mimeType: string,
    options?: {
      language?: string;
      timeoutMs?: number;
    }
  ): Promise<{
    text: string;
    confidence: number | null; // 0.0 - 1.0 (hoặc null nếu provider không hỗ trợ)
  }>;
}
