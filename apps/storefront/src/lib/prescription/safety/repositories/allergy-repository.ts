import { SafetySeverity, DEV_TEST_DATA_NOTICE } from "../safety-types";
import { SafetyProviderUnavailableError } from "../safety-errors";

/**
 * H4CARE Pharmacy - Controlled Allergy Mapping Repository
 * Phase 5: Deterministic Safety Engine
 * 
 * LƯU Ý KỸ THUẬT:
 * Bộ dữ liệu tham chiếu kiểm thử (DEVELOPMENT / TEST DATA ONLY).
 * Tuyệt đối không dùng cho điều trị lâm sàng thực tế khi chưa có chứng thực từ Bộ Y Tế.
 */

export interface AllergenRelationship {
  allergenKey: string;
  allergenName: string;
  drugClass: string;
  relatedGenerics: string[];
  severity: SafetySeverity;
  crossReactivityRisk: "HIGH" | "MODERATE" | "LOW";
  clinicalNote: string;
  sourceId: string;
  sourceName: string;
  sourceVersion: string;
}

const CONTROLLED_ALLERGY_FIXTURES: AllergenRelationship[] = [
  {
    allergenKey: "penicillin",
    allergenName: "Nhóm kháng sinh Penicillin / Beta-lactam",
    drugClass: "Beta-lactam",
    relatedGenerics: ["amoxicillin", "ampicillin", "augmentin", "penicillin", "piperacillin", "amoxicilline"],
    severity: "CRITICAL",
    crossReactivityRisk: "HIGH",
    clinicalNote: "Bệnh nhân có tiền sử dị ứng Penicillin có nguy cơ cao sốc phản vệ hoặc phát ban nặng với Amoxicillin và các kháng sinh nhóm Aminopenicillin.",
    sourceId: "ALLERGY_REF_PENICILLIN_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    allergenKey: "aspirin",
    allergenName: "Aspirin & NSAIDs",
    drugClass: "NSAID",
    relatedGenerics: ["aspirin", "acetylsalicylic acid", "ibuprofen", "diclofenac", "naproxen", "meloxicam"],
    severity: "HIGH",
    crossReactivityRisk: "HIGH",
    clinicalNote: "Nguy cơ phản ứng co thắt phế quản, hen suyễn kịch phát hoặc nổi mề đay dị ứng chéo giữa Aspirin và các thuốc chống viêm không steroid (NSAID).",
    sourceId: "ALLERGY_REF_NSAID_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    allergenKey: "macrolide",
    allergenName: "Nhóm kháng sinh Macrolide",
    drugClass: "Macrolide",
    relatedGenerics: ["azithromycin", "clarithromycin", "erythromycin", "roxithromycin"],
    severity: "HIGH",
    crossReactivityRisk: "HIGH",
    clinicalNote: "Bệnh nhân dị ứng kháng sinh nhóm Macrolide cần tránh dùng Azithromycin do nguy cơ phản ứng dị ứng toàn thân.",
    sourceId: "ALLERGY_REF_MACROLIDE_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    allergenKey: "paracetamol",
    allergenName: "Paracetamol / Acetaminophen",
    drugClass: "Analgesic",
    relatedGenerics: ["paracetamol", "acetaminophen", "panadol", "efferalgan"],
    severity: "CRITICAL",
    crossReactivityRisk: "HIGH",
    clinicalNote: "Tiền sử dị ứng Paracetamol gây phát ban đỏ da, hoại tử biểu bì hoặc quá mẫn nghiêm trọng.",
    sourceId: "ALLERGY_REF_PARA_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
];

export interface AllergyMatchFinding {
  allergenName: string;
  matchedDrugName: string;
  severity: SafetySeverity;
  clinicalNote: string;
  sourceId: string;
  sourceName: string;
  sourceVersion: string;
}

export class AllergyRepository {
  private static simulateFailureFlag: boolean = false;

  public static setSimulateFailure(fail: boolean) {
    this.simulateFailureFlag = fail;
  }

  /**
   * Tìm kiếm mối liên hệ giữa dị ứng khai báo và thuốc trong đơn
   */
  public async findMatches(
    userAllergens: string[],
    drugGenericOrBrand: string,
    activeIngredient?: string | null
  ): Promise<AllergyMatchFinding[]> {
    if (AllergyRepository.simulateFailureFlag) {
      throw new SafetyProviderUnavailableError("Dịch vụ tra cứu cơ sở dữ liệu dị ứng tạm thời gián đoạn (Simulated failure).");
    }

    if (!userAllergens || userAllergens.length === 0) {
      return [];
    }

    const normalizedTargetDrug = (drugGenericOrBrand || "").toLowerCase().trim();
    const normalizedIngredient = (activeIngredient || "").toLowerCase().trim();
    const results: AllergyMatchFinding[] = [];

    for (const declaredAllergy of userAllergens) {
      const normalizedAllergy = declaredAllergy.toLowerCase().trim();

      for (const fixture of CONTROLLED_ALLERGY_FIXTURES) {
        // Kiểm tra xem dị ứng người dùng có khớp với fixture không
        const isAllergenMatch =
          normalizedAllergy.includes(fixture.allergenKey) ||
          fixture.allergenKey.includes(normalizedAllergy) ||
          fixture.relatedGenerics.some((g) => normalizedAllergy.includes(g));

        if (!isAllergenMatch) {
          continue;
        }

        // Kiểm tra xem thuốc trong đơn có chứa thành phần thuộc nhóm dị ứng này không
        const isDrugAffected =
          fixture.relatedGenerics.some((gen) =>
            normalizedTargetDrug.includes(gen) || normalizedIngredient.includes(gen)
          ) ||
          normalizedTargetDrug.includes(fixture.allergenKey) ||
          normalizedIngredient.includes(fixture.allergenKey);

        if (isDrugAffected) {
          results.push({
            allergenName: declaredAllergy,
            matchedDrugName: drugGenericOrBrand,
            severity: fixture.severity,
            clinicalNote: fixture.clinicalNote,
            sourceId: fixture.sourceId,
            sourceName: fixture.sourceName,
            sourceVersion: fixture.sourceVersion,
          });
        }
      }
    }

    return results;
  }
}

export const allergyRepository = new AllergyRepository();
