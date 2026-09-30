import { PRODUCTS_DATA } from "@/data/products";
import {
  DrugCandidate,
  DrugMatchResult,
  DRUG_MATCH_HIGH_CONFIDENCE_THRESHOLD,
  DRUG_MATCH_MIN_CANDIDATE_THRESHOLD,
} from "./extraction-types";
import { DrugNormalizer } from "./drug-normalizer";

export interface DrugReferenceItem {
  id: string;
  brandName: string;
  genericName: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  isPrescription: boolean;
}

export interface DrugRepository {
  findExact(name: string): Promise<DrugReferenceItem | null>;
  findCandidates(
    name: string,
    strength?: string | null,
    limit?: number
  ): Promise<DrugMatchResult>;
  getById(id: string): Promise<DrugReferenceItem | null>;
}

/**
 * CONTROLLED_TEST_DATASET
 * Bộ dữ liệu thuốc chuẩn đối chiếu kiểm thử (DEVELOPMENT / TEST DATA ONLY).
 * Lưu ý: Đây là bộ dữ liệu kiểm thử phục vụ kiến trúc, không phải cơ sở dữ liệu Dược thư quốc gia chính thức.
 */
const CONTROLLED_TEST_DATASET: DrugReferenceItem[] = [
  {
    id: "ref-para-500",
    brandName: "Paracetamol 500mg",
    genericName: "Paracetamol",
    activeIngredient: "Paracetamol",
    strength: "500mg",
    dosageForm: "Viên nén",
    manufacturer: "Dược Hậu Giang (DHG)",
    isPrescription: false,
  },
  {
    id: "ref-panadol-extra",
    brandName: "Panadol Extra",
    genericName: "Paracetamol + Caffeine",
    activeIngredient: "Paracetamol 500mg, Caffeine 65mg",
    strength: "500mg",
    dosageForm: "Viên nén bao phim",
    manufacturer: "GSK",
    isPrescription: false,
  },
  {
    id: "ref-amox-500",
    brandName: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    activeIngredient: "Amoxicillin trihydrate",
    strength: "500mg",
    dosageForm: "Viên nang cứng",
    manufacturer: "Dược Phẩm Imexpharm",
    isPrescription: true,
  },
  {
    id: "ref-augmentin-625",
    brandName: "Augmentin 625mg",
    genericName: "Amoxicillin + Clavulanate",
    activeIngredient: "Amoxicillin 500mg, Acid Clavulanic 125mg",
    strength: "625mg",
    dosageForm: "Viên nén bao phim",
    manufacturer: "GSK",
    isPrescription: true,
  },
  {
    id: "ref-cefu-500",
    brandName: "Zinnat 500mg",
    genericName: "Cefuroxim axetil",
    activeIngredient: "Cefuroxim 500mg",
    strength: "500mg",
    dosageForm: "Viên nén bao phim",
    manufacturer: "GSK",
    isPrescription: true,
  },
  {
    id: "ref-ibu-400",
    brandName: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    activeIngredient: "Ibuprofen",
    strength: "400mg",
    dosageForm: "Viên nén bao phim",
    manufacturer: "Dược Hậu Giang (DHG)",
    isPrescription: false,
  },
  {
    id: "ref-azithro-500",
    brandName: "Zithromax 500mg",
    genericName: "Azithromycin",
    activeIngredient: "Azithromycin monohydrate",
    strength: "500mg",
    dosageForm: "Viên nén bao phim",
    manufacturer: "Pfizer",
    isPrescription: true,
  },
  {
    id: "ref-omepra-20",
    brandName: "Omeprazol 20mg",
    genericName: "Omeprazol",
    activeIngredient: "Omeprazol",
    strength: "20mg",
    dosageForm: "Viên nang kháng dịch dạ dày",
    manufacturer: "Hasan-Dermapharm",
    isPrescription: true,
  },
  {
    id: "ref-vitc-500",
    brandName: "Vitamin C 500mg",
    genericName: "Acid Ascorbic",
    activeIngredient: "Acid ascorbic 500mg",
    strength: "500mg",
    dosageForm: "Viên nén",
    manufacturer: "Dược phẩm OPC",
    isPrescription: false,
  },
];

export class LocalDrugRepository implements DrugRepository {
  public static readonly DATASET_NOTICE = "DEVELOPMENT / TEST DATA ONLY";

  private items: DrugReferenceItem[] = [];

  constructor() {
    this.initializeDataset();
  }

  private initializeDataset() {
    // 1. Nạp danh mục thuốc kiểm thử chuẩn
    this.items = [...CONTROLLED_TEST_DATASET];

    // 2. Tích hợp từ kho sản phẩm hiện hữu (PRODUCTS_DATA)
    const existingIds = new Set(this.items.map((i) => i.id));
    for (const p of PRODUCTS_DATA) {
      if (!existingIds.has(p.id)) {
        const strength = DrugNormalizer.extractStrength(p.activeIngredient || p.name);
        this.items.push({
          id: p.id,
          brandName: p.name,
          genericName: p.activeIngredient || p.name,
          activeIngredient: p.activeIngredient || null,
          strength,
          dosageForm: p.dosageForm || null,
          manufacturer: p.manufacturer || null,
          isPrescription: Boolean(p.isPrescription),
        });
        existingIds.add(p.id);
      }
    }
  }

  public async getById(id: string): Promise<DrugReferenceItem | null> {
    const found = this.items.find((item) => item.id === id);
    return found || null;
  }

  public async findExact(name: string): Promise<DrugReferenceItem | null> {
    const searchKey = DrugNormalizer.getSearchKey(name);
    if (!searchKey) return null;

    const found = this.items.find((item) => {
      const bKey = DrugNormalizer.getSearchKey(item.brandName);
      const gKey = DrugNormalizer.getSearchKey(item.genericName);
      return bKey === searchKey || gKey === searchKey;
    });

    return found || null;
  }

  public async findCandidates(
    name: string,
    extractedStrength?: string | null,
    limit: number = 3
  ): Promise<DrugMatchResult> {
    const rawKey = DrugNormalizer.getSearchKey(name);
    if (!rawKey || rawKey.length < 2) {
      return {
        matchStatus: "UNMATCHED",
        bestMatch: null,
        candidates: [],
      };
    }

    const normStrength = extractedStrength
      ? DrugNormalizer.normalizeStrengthSpacing(extractedStrength)
      : null;

    const scoredCandidates: DrugCandidate[] = [];

    for (const item of this.items) {
      const brandKey = DrugNormalizer.getSearchKey(item.brandName);
      const genericKey = DrugNormalizer.getSearchKey(item.genericName);

      // Điểm tương đồng tên thương mại và hoạt chất
      const brandScore = DrugNormalizer.calculateSimilarity(rawKey, brandKey);
      const genericScore = DrugNormalizer.calculateSimilarity(rawKey, genericKey);
      let baseScore = Math.max(brandScore, genericScore);

      // Thưởng điểm nếu hàm lượng khớp chính xác
      let strengthBonus = 0;
      if (normStrength && item.strength) {
        const itemNormStrength = DrugNormalizer.normalizeStrengthSpacing(item.strength);
        if (normStrength === itemNormStrength) {
          strengthBonus = 0.08;
        } else if (normStrength.length > 0 && itemNormStrength.includes(normStrength)) {
          strengthBonus = 0.04;
        }
      }

      const totalScore = Math.min(1.0, parseFloat((baseScore + strengthBonus).toFixed(4)));

      if (totalScore >= DRUG_MATCH_MIN_CANDIDATE_THRESHOLD) {
        scoredCandidates.push({
          drugId: item.id,
          brandName: item.brandName,
          genericName: item.genericName,
          activeIngredient: item.activeIngredient,
          strength: item.strength,
          dosageForm: item.dosageForm,
          score: totalScore,
          isExact: totalScore >= 0.98,
        });
      }
    }

    // Sắp xếp điểm giảm dần
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topCandidates = scoredCandidates.slice(0, limit);

    if (topCandidates.length === 0) {
      return {
        matchStatus: "UNMATCHED",
        bestMatch: null,
        candidates: [],
      };
    }

    const top = topCandidates[0];

    // Ngưỡng MATCHED vs NEEDS_REVIEW
    if (top.score >= DRUG_MATCH_HIGH_CONFIDENCE_THRESHOLD) {
      return {
        matchStatus: "MATCHED",
        bestMatch: top,
        candidates: topCandidates,
      };
    }

    return {
      matchStatus: "NEEDS_REVIEW",
      bestMatch: top,
      candidates: topCandidates,
    };
  }
}

export const drugRepository = new LocalDrugRepository();
