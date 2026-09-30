import { OcrProvider } from "./ocr-provider";
import { OcrProviderError, OcrTimeoutError } from "./ocr-errors";

/**
 * MockOcrProvider
 * Dùng cho kiểm thử đơn vị, CI/CD và kiểm chứng các kịch bản biên (Edge Cases):
 * - Giả lập OCR thành công nhanh
 * - Giả lập Timeout
 * - Giả lập Lỗi Provider
 * - Giả lập ảnh mờ / độ tin cậy thấp
 */
export class MockOcrProvider implements OcrProvider {
  public readonly name = "mock";
  private mockScenario: "success" | "timeout" | "error" | "low_confidence" | "empty";
  private customText?: string;
  private customConfidence?: number;

  constructor(
    scenario: "success" | "timeout" | "error" | "low_confidence" | "empty" = "success",
    customText?: string,
    customConfidence?: number
  ) {
    this.mockScenario = scenario;
    this.customText = customText;
    this.customConfidence = customConfidence;
  }

  public setScenario(
    scenario: "success" | "timeout" | "error" | "low_confidence" | "empty",
    customText?: string,
    customConfidence?: number
  ) {
    this.mockScenario = scenario;
    this.customText = customText;
    this.customConfidence = customConfidence;
  }

  public async recognize(
    _pageBuffer: Buffer,
    _mimeType: string,
    options?: {
      timeoutMs?: number;
    }
  ): Promise<{ text: string; confidence: number | null }> {
    if (this.mockScenario === "error") {
      throw new OcrProviderError("Giả lập lỗi từ OCR engine (Mock provider failure).");
    }

    if (this.mockScenario === "timeout") {
      throw new OcrTimeoutError("Giả lập quá thời gian xử lý OCR (Mock timeout).");
    }

    if (this.mockScenario === "empty") {
      return {
        text: "",
        confidence: null,
      };
    }

    if (this.mockScenario === "low_confidence") {
      return {
        text: this.customText || "Amox... 500mg - uống 2 l.../ngày",
        confidence: this.customConfidence !== undefined ? this.customConfidence : 0.45,
      };
    }

    return {
      text:
        this.customText ||
        "BỆNH VIỆN BẠCH MAI\nĐƠN THUỐC\nBệnh nhân: Nguyễn Văn An - 35 tuổi\nChẩn đoán: Viêm họng cấp\n1. Paracetamol 500mg: 10 viên, uống 1 viên/lần khi sốt\n2. Cefuroxim 500mg: 14 viên, uống 1 viên x 2 lần/ngày sau ăn\nBác sĩ điều trị: BS. Lê Hoàng (Đã ký)",
      confidence: this.customConfidence !== undefined ? this.customConfidence : 0.94,
    };
  }
}

export const mockOcrProvider = new MockOcrProvider();
