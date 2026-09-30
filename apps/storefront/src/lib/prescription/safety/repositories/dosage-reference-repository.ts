import { DEV_TEST_DATA_NOTICE } from "../safety-types";
import { SafetyProviderUnavailableError } from "../safety-errors";

/**
 * H4CARE Pharmacy - Controlled Dosage Reference Repository
 * Phase 5: Deterministic Safety Engine
 * 
 * LƯU Ý KỸ THUẬT:
 * Bộ dữ liệu tham chiếu kiểm thử (DEVELOPMENT / TEST DATA ONLY).
 * Tuyệt đối không tự suy luận ngưỡng giới hạn liều khi chưa có dữ liệu chính thức.
 */

export interface DosageReferenceItem {
  drugKey: string;
  genericName: string;
  maxSingleDoseMg: number;
  maxDailyDoseMg: number;
  unit: string;
  sourceId: string;
  sourceName: string;
  sourceVersion: string;
  clinicalNote: string;
}

const CONTROLLED_DOSAGE_FIXTURES: DosageReferenceItem[] = [
  {
    drugKey: "paracetamol",
    genericName: "Paracetamol",
    maxSingleDoseMg: 1000,
    maxDailyDoseMg: 4000,
    unit: "mg",
    sourceId: "DOSAGE_REF_PARA_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
    clinicalNote: "Liều tối đa người lớn: 1000mg/lần và không quá 4000mg/24 giờ để phòng ngừa độc tính trên gan cấp tính.",
  },
  {
    drugKey: "ibuprofen",
    genericName: "Ibuprofen",
    maxSingleDoseMg: 800,
    maxDailyDoseMg: 2400,
    unit: "mg",
    sourceId: "DOSAGE_REF_IBU_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
    clinicalNote: "Liều tối đa người lớn: 800mg/lần và không quá 2400mg/ngày để hạn chế loét dạ dày và suy giảm chức năng thận.",
  },
  {
    drugKey: "amoxicillin",
    genericName: "Amoxicillin",
    maxSingleDoseMg: 1000,
    maxDailyDoseMg: 3000,
    unit: "mg",
    sourceId: "DOSAGE_REF_AMOX_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
    clinicalNote: "Liều dùng tối đa thông thường: 1000mg/lần và 3000mg/ngày đối với nhiễm khuẩn hô hấp nặng ở người lớn.",
  },
];

export class DosageReferenceRepository {
  private static simulateFailureFlag: boolean = false;

  public static setSimulateFailure(fail: boolean) {
    this.simulateFailureFlag = fail;
  }

  public async findDosageReference(genericOrBrand: string): Promise<DosageReferenceItem | null> {
    if (DosageReferenceRepository.simulateFailureFlag) {
      throw new SafetyProviderUnavailableError("Dịch vụ tra cứu ngưỡng liều tham chiếu tạm thời gián đoạn (Simulated failure).");
    }

    const norm = (genericOrBrand || "").toLowerCase().trim();
    for (const fixture of CONTROLLED_DOSAGE_FIXTURES) {
      if (norm.includes(fixture.drugKey) || fixture.drugKey.includes(norm)) {
        return fixture;
      }
    }

    return null;
  }
}

export const dosageReferenceRepository = new DosageReferenceRepository();
