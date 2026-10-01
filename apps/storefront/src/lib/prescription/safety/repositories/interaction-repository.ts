import { SafetySeverity, DEV_TEST_DATA_NOTICE } from "../safety-types";
import { SafetyProviderUnavailableError } from "../safety-errors";

/**
 * H4CARE Pharmacy - Controlled Drug-Drug Interaction Repository
 * Phase 5: Deterministic Safety Engine
 * 
 * LƯU Ý KỸ THUẬT:
 * Bộ dữ liệu tham chiếu kiểm thử (DEVELOPMENT / TEST DATA ONLY).
 * Tuyệt đối không tự suy luận lâm sàng ngoài danh mục tham chiếu xác định này.
 */

export interface DrugInteractionRecord {
  pairKey: string;
  drugA: string;
  drugB: string;
  severity: SafetySeverity;
  title: string;
  clinicalExplanation: string;
  recommendation: string;
  sourceId: string;
  sourceName: string;
  sourceVersion: string;
}

export function buildPairKey(a: string, b: string): string {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();
  return [normA, normB].sort().join(":::");
}

const CONTROLLED_INTERACTION_FIXTURES: DrugInteractionRecord[] = [
  {
    pairKey: buildPairKey("ibuprofen", "aspirin"),
    drugA: "Ibuprofen",
    drugB: "Aspirin",
    severity: "HIGH",
    title: "Tương tác hiệp đồng tăng nguy cơ xuất huyết tiêu hóa (NSAID + Aspirin)",
    clinicalExplanation:
      "Dùng đồng thời Ibuprofen và Aspirin làm tăng mạnh nguy cơ viêm loét dạ dày, chảy máu đường tiêu hóa do cùng ức chế enzym cyclooxygenase (COX). Đồng thời Ibuprofen có thể làm giảm tác dụng bảo vệ tim mạch chống kết tập tiểu cầu của Aspirin liều thấp.",
    recommendation: "Cần được dược sĩ/bác sĩ đánh giá chỉ định; cân nhắc dùng kèm thuốc bảo vệ niêm mạc dạ dày (PPI) hoặc đổi nhóm giảm đau thay thế.",
    sourceId: "INTERACTION_REF_IBU_ASP_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    pairKey: buildPairKey("paracetamol", "warfarin"),
    drugA: "Paracetamol",
    drugB: "Warfarin",
    severity: "WARNING",
    title: "Tương tác làm tăng chỉ số INR và nguy cơ chảy máu (Paracetamol liều cao + Warfarin)",
    clinicalExplanation:
      "Sử dụng Paracetamol liều cao kéo dài (trên 2g/ngày trong nhiều ngày) có thể làm tăng tác dụng chống đông của Warfarin, dẫn đến tăng chỉ số INR.",
    recommendation: "Cần theo dõi chặt chẽ chỉ số đông máu INR nếu dùng Paracetamol thường xuyên khi đang điều trị chống đông.",
    sourceId: "INTERACTION_REF_PARA_WARF_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    pairKey: buildPairKey("amoxicillin", "methotrexate"),
    drugA: "Amoxicillin",
    drugB: "Methotrexate",
    severity: "CRITICAL",
    title: "Tương tác giảm thải trừ tăng độc tính Methotrexate (Penicillin + Methotrexate)",
    clinicalExplanation:
      "Amoxicillin và các kháng sinh nhóm Penicillin cạnh tranh bài tiết qua ống thận, làm giảm thải trừ Methotrexate dẫn đến tăng nồng độ trong huyết thanh và độc tính nghiêm trọng trên tủy xương.",
    recommendation: "Tuyệt đối cần có sự hội chẩn của bác sĩ chuyên khoa; theo dõi nồng độ Methotrexate trong máu.",
    sourceId: "INTERACTION_REF_AMOX_MTX_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    pairKey: buildPairKey("omeprazol", "clopidogrel"),
    drugA: "Omeprazol",
    drugB: "Clopidogrel",
    severity: "HIGH",
    title: "Tương tác giảm tác dụng chống kết tập tiểu cầu (Omeprazol + Clopidogrel)",
    clinicalExplanation:
      "Omeprazol ức chế enzym CYP2C19 chuyển hóa Clopidogrel thành dạng hoạt động, làm giảm hiệu quả chống đông và tăng nguy cơ biến cố tim mạch tái phát.",
    recommendation: "Cân nhắc chuyển sang thuốc kháng thụ thể H2 hoặc PPI ít ức chế CYP2C19 hơn (như Pantoprazol) theo hướng dẫn điều trị.",
    sourceId: "INTERACTION_REF_OMEP_CLOP_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
  {
    pairKey: buildPairKey("azithromycin", "amiodarone"),
    drugA: "Azithromycin",
    drugB: "Amiodarone",
    severity: "CRITICAL",
    title: "Tương tác kéo dài khoảng QT và nguy cơ xoắn đỉnh (Macrolide + Amiodarone)",
    clinicalExplanation:
      "Phối hợp hai thuốc cùng có tác dụng kéo dài khoảng QT trên điện tâm đồ làm tăng vọt nguy cơ loạn nhịp thất đe dọa tính mạng (Torsades de Pointes).",
    recommendation: "Chống chỉ định phối hợp hoặc cần theo dõi điện tâm đồ liên tục trong bệnh viện.",
    sourceId: "INTERACTION_REF_AZITH_AMIO_V1",
    sourceName: DEV_TEST_DATA_NOTICE,
    sourceVersion: "1.0.0-dev",
  },
];

export class InteractionRepository {
  private static simulateFailureFlag: boolean = false;

  public static setSimulateFailure(fail: boolean) {
    this.simulateFailureFlag = fail;
  }

  /**
   * Kiểm tra tương tác giữa 2 thuốc theo cặp chuẩn hóa
   */
  public async findInteraction(
    drugName1: string,
    drugName2: string,
    activeIngredient1?: string | null,
    activeIngredient2?: string | null
  ): Promise<DrugInteractionRecord | null> {
    if (InteractionRepository.simulateFailureFlag) {
      throw new SafetyProviderUnavailableError("Dịch vụ tra cứu tương tác thuốc tạm thời gián đoạn (Simulated failure).");
    }

    const n1 = drugName1.toLowerCase().trim();
    const n2 = drugName2.toLowerCase().trim();
    const ing1 = (activeIngredient1 || "").toLowerCase().trim();
    const ing2 = (activeIngredient2 || "").toLowerCase().trim();

    for (const item of CONTROLLED_INTERACTION_FIXTURES) {
      const targetA = item.drugA.toLowerCase();
      const targetB = item.drugB.toLowerCase();

      // Kiểm tra cả 2 chiều theo tên hoặc hoạt chất
      const matchAB =
        (n1.includes(targetA) || ing1.includes(targetA)) &&
        (n2.includes(targetB) || ing2.includes(targetB));

      const matchBA =
        (n1.includes(targetB) || ing1.includes(targetB)) &&
        (n2.includes(targetA) || ing2.includes(targetA));

      if (matchAB || matchBA) {
        return item;
      }
    }

    return null;
  }
}

export const interactionRepository = new InteractionRepository();
