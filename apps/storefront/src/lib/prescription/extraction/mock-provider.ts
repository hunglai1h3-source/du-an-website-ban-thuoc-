import {
  PrescriptionExtractionProvider,
  PrescriptionExtractionInput,
  PrescriptionExtractionOutput,
} from "./ai-provider";
import {
  RawAiExtractionOutput,
  RawExtractedMedication,
} from "./extraction-types";
import {
  AiOutputInvalidError,
  AiTimeoutError,
  AiRateLimitedError,
} from "./extraction-errors";
import { DrugNormalizer } from "./drug-normalizer";

export type MockScenario =
  | "success"
  | "timeout"
  | "rate_limit"
  | "invalid_json"
  | "prompt_injection"
  | "hallucination_test";

/**
 * MockExtractionProvider
 * Phục vụ kiểm thử tự động, CI/CD và kiểm chứng các kịch bản biên (Edge Cases):
 * - Giả lập Timeout
 * - Giả lập Rate limit (429)
 * - Giả lập Phản hồi JSON lỗi (Invalid schema)
 * - Kiểm thử Prompt injection: Coi injection là data, không thực thi lệnh
 * - Kiểm thử Hallucination: Không tự bịa thông tin vắng mặt trong OCR
 */
export class MockExtractionProvider implements PrescriptionExtractionProvider {
  public readonly name = "mock";
  public readonly model = "mock-medical-v1";
  private scenario: MockScenario;
  private customOutput?: RawAiExtractionOutput;

  constructor(scenario: MockScenario = "success", customOutput?: RawAiExtractionOutput) {
    this.scenario = scenario;
    this.customOutput = customOutput;
  }

  public setScenario(scenario: MockScenario, customOutput?: RawAiExtractionOutput) {
    this.scenario = scenario;
    this.customOutput = customOutput;
  }

  public async extract(
    input: PrescriptionExtractionInput
  ): Promise<PrescriptionExtractionOutput> {
    const startTime = Date.now();

    if (this.scenario === "timeout") {
      throw new AiTimeoutError();
    }

    if (this.scenario === "rate_limit") {
      throw new AiRateLimitedError();
    }

    if (this.scenario === "invalid_json") {
      throw new AiOutputInvalidError("Mock: Cấu trúc AI JSON bị lỗi cú pháp.");
    }

    if (this.customOutput) {
      return {
        provider: this.name,
        model: this.model,
        data: this.customOutput,
        processingTimeMs: Date.now() - startTime,
      };
    }

    if (this.scenario === "prompt_injection") {
      return {
        provider: this.name,
        model: this.model,
        data: {
          patientName: null,
          patientAge: null,
          patientGender: null,
          doctorName: null,
          diagnosis: null,
          medications: [
            {
              rawName: "Morphine",
              strength: "1000mg",
              dosage: null,
              frequency: null,
              duration: null,
              quantity: null,
              route: null,
              instructions: null,
              sourcePage: 1,
              sourceText: input.rawOcrText,
            },
          ],
        },
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Phân tích heuristic xác định cho văn bản OCR phục vụ kiểm thử
    const lines = input.rawOcrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const medications: RawExtractedMedication[] = [];

    let patientName: string | null = null;
    let patientAge: string | null = null;
    let doctorName: string | null = null;
    let diagnosis: string | null = null;

    // Phân tích từng trang nếu có
    if (input.pages && input.pages.length > 1) {
      for (const page of input.pages) {
        const pageLines = page.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        for (const line of pageLines) {
          const med = this.parseLineToMedication(line, page.pageNumber);
          if (med) medications.push(med);
        }
      }
    } else {
      for (const line of lines) {
        if (/bệnh nhân|benh nhan/i.test(line)) {
          const m = line.match(/(?:bệnh nhân|benh nhan)[:\s]+([^-\n,]+)/i);
          if (m) patientName = m[1].trim();
          const ageMatch = line.match(/(\d+)\s*(?:tuổi|tuoi)/i);
          if (ageMatch) patientAge = ageMatch[1];
        } else if (/bác sĩ|bac si/i.test(line)) {
          const m = line.match(/(?:bác sĩ|bac si)[:\s]+([^-\n,]+)/i);
          if (m) doctorName = m[1].trim();
        } else if (/chẩn đoán|chan doan/i.test(line)) {
          const m = line.match(/(?:chẩn đoán|chan doan)[:\s]+([^-\n]+)/i);
          if (m) diagnosis = m[1].trim();
        } else {
          const med = this.parseLineToMedication(line, 1);
          if (med) medications.push(med);
        }
      }
    }

    // Nếu không tìm thấy bằng regex, kiểm tra từng từ khóa thông dụng trong đơn thuốc
    if (medications.length === 0) {
      const knownMedKeywords = [
        "paracetamol",
        "paracetamo1",
        "panadol",
        "amoxicillin",
        "amoxici1lin",
        "augmentin",
        "cefuroxim",
        "ibuprofen",
        "zinnat",
        "zithromax",
        "omeprazol",
        "vitamin c",
      ];

      for (const kw of knownMedKeywords) {
        if (input.rawOcrText.toLowerCase().includes(kw)) {
          const strength = DrugNormalizer.extractStrength(input.rawOcrText);
          medications.push({
            rawName: kw.charAt(0).toUpperCase() + kw.slice(1),
            strength,
            dosage: /1 viên|1 vien/i.test(input.rawOcrText) ? "1 viên" : null,
            frequency: /2 lần|2 lan/i.test(input.rawOcrText) ? "2 lần/ngày" : null,
            duration: /5 ngày|5 ngay/i.test(input.rawOcrText) ? "5 ngày" : null,
            quantity: /10 viên|10 vien/i.test(input.rawOcrText) ? "10 viên" : null,
            route: /uống|uong/i.test(input.rawOcrText) ? "Uống" : null,
            instructions: /sau ăn|sau an/i.test(input.rawOcrText) ? "Sau ăn" : null,
            sourcePage: 1,
            sourceText: input.rawOcrText.substring(0, 100),
          });
          break;
        }
      }
    }

    // Kịch bản Prompt Injection Test: Dữ liệu chứa câu lệnh tấn công
    // Hệ thống xem đó là document data thuần túy, tuyệt đối không thực thi
    if (input.rawOcrText.includes("Ignore previous instructions")) {
      // Mock provider trả về dữ liệu an toàn, không có lỗ hổng
    }

    return {
      provider: this.name,
      model: this.model,
      data: {
        patientName,
        patientAge,
        patientGender: null,
        doctorName,
        diagnosis,
        medications,
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  private parseLineToMedication(line: string, pageNumber: number): RawExtractedMedication | null {
    // Nhận diện dòng thuốc có dạng: "1. Paracetamol 500mg: 10 viên, uống 1 viên..."
    const match = line.match(/^(?:\d+[\.\)]\s*)?([A-Za-z0-9\s]+?)(?:\s+(\d+\s*(?:mg|g|ml|mcg)))?(?:[:,-]\s*(.*))?$/);
    if (!match) return null;

    const rawNameCandidate = match[1].trim();
    if (rawNameCandidate.length < 3 || /^(bệnh nhân|bác sĩ|chẩn đoán|đơn thuốc)/i.test(rawNameCandidate)) {
      return null;
    }

    const strength = match[2] ? DrugNormalizer.normalizeStrengthSpacing(match[2]) : DrugNormalizer.extractStrength(line);
    const rest = match[3] || "";

    // Phân tích định lượng chính xác nếu xuất hiện trong dòng
    const quantityMatch = rest.match(/(\d+)\s*(viên|vien|gói|goi|chai|ống|ong)/i);
    const dosageMatch = rest.match(/(?:uống|dung|tiêm)?\s*(\d+\s*(?:viên|vien|gói|ml)(?:\/lần)?)/i);
    const freqMatch = rest.match(/(\d+\s*lần\/(?:ngày|ngay)|ngày\s*\d+\s*lần)/i);
    const durMatch = rest.match(/(\d+\s*ngày|\d+\s*ngay)/i);
    const routeMatch = rest.match(/(uống|tiêm|bôi|đặt|uong|tiem|boi|dat)/i);

    return {
      rawName: rawNameCandidate,
      strength: strength || null,
      dosage: dosageMatch ? dosageMatch[1].trim() : null,
      frequency: freqMatch ? freqMatch[1].trim() : null,
      duration: durMatch ? durMatch[1].trim() : null,
      quantity: quantityMatch ? `${quantityMatch[1]} ${quantityMatch[2]}` : null,
      route: routeMatch ? routeMatch[1].trim() : null,
      instructions: rest ? rest.trim() : null,
      sourcePage: pageNumber,
      sourceText: line,
    };
  }
}

export const mockExtractionProvider = new MockExtractionProvider();
