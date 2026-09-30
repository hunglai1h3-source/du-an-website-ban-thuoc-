/**
 * apps/storefront/src/services/administrativeService.ts
 *
 * Service quản lý danh mục địa giới hành chính Việt Nam theo mô hình 2 cấp hiện hành sau 2025.
 * - CẤP 1: 34 Tỉnh / Thành phố trực thuộc Trung ương (28 tỉnh, 6 TP trực thuộc TW).
 * - CẤP 2: 3.321 Xã / Phường / Đặc khu (Hỗ trợ: Xã, Phường, Đặc khu như Phú Quốc, Vân Đồn, Côn Đảo...).
 * - LEGACY COMPATIBILITY LAYER: Tra cứu alias quận/huyện cũ mà không bắt buộc chọn quận/huyện.
 * - KHÔNG HARD-CODE DANH SÁCH TỈNH TRONG JSX / COMPONENT.
 */

import rawDataset from "@/data/vietnam-administrative-units.json";

export interface ProvinceUnit {
  code: string;
  name: string;
  fullName: string;
  type: "province" | "municipality";
  aliases?: string[];
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface CommuneUnit {
  code: string;
  name: string;
  fullName: string;
  type: "ward" | "commune" | "special_zone";
  provinceCode: string;
  legacyDistrictName?: string;
  aliases?: string[];
}

export interface AdministrativeMetadata {
  country: string;
  administrativeModel: string;
  effectiveDate: string;
  source: string;
  version: string;
  updatedAt: string;
  totalProvinces: number;
  totalCommunes: number;
}

export interface Structured2TierAddress {
  provinceCode: string;
  provinceName: string;
  communeCode: string;
  communeName: string;
  communeType: "ward" | "commune" | "special_zone";
  streetAddress: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  isVerified: boolean;
  deliveryNote?: string;
}

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"))
    .toLowerCase()
    .trim();
}

class AdministrativeDataService {
  private provinces: ProvinceUnit[] = [];
  private communes: CommuneUnit[] = [];
  private communesByProvince: Map<string, CommuneUnit[]> = new Map();
  private metadata: AdministrativeMetadata;

  constructor() {
    this.metadata = (rawDataset as any).metadata;
    this.provinces = (rawDataset as any).provinces || [];
    this.communes = (rawDataset as any).communes || [];

    for (const c of this.communes) {
      const list = this.communesByProvince.get(c.provinceCode) || [];
      list.push(c);
      this.communesByProvince.set(c.provinceCode, list);
    }
  }

  public getMetadata(): AdministrativeMetadata {
    return this.metadata;
  }

  public getProvinces(search?: string): ProvinceUnit[] {
    if (!search || !search.trim()) {
      return this.provinces;
    }
    const cleanSearch = removeVietnameseAccents(search);
    return this.provinces.filter((p) => {
      const nameMatch = removeVietnameseAccents(p.name).includes(cleanSearch);
      const fullNameMatch = removeVietnameseAccents(p.fullName).includes(cleanSearch);
      const aliasMatch = p.aliases?.some((a) =>
        removeVietnameseAccents(a).includes(cleanSearch)
      );
      return nameMatch || fullNameMatch || aliasMatch;
    });
  }

  public getProvinceByCode(code: string): ProvinceUnit | undefined {
    return this.provinces.find((p) => p.code === code);
  }

  public getCommunes(
    provinceCode: string,
    unitType?: "ward" | "commune" | "special_zone",
    search?: string
  ): CommuneUnit[] {
    if (!provinceCode) return [];
    let list = this.communesByProvince.get(provinceCode) || [];

    if (unitType) {
      list = list.filter((c) => c.type === unitType);
    }

    if (search && search.trim()) {
      const cleanSearch = removeVietnameseAccents(search);
      list = list.filter((c) => {
        const nameMatch = removeVietnameseAccents(c.name).includes(cleanSearch);
        const fullNameMatch = removeVietnameseAccents(c.fullName).includes(cleanSearch);
        const legacyDistrictMatch = c.legacyDistrictName
          ? removeVietnameseAccents(c.legacyDistrictName).includes(cleanSearch)
          : false;
        const aliasMatch = c.aliases?.some((a) =>
          removeVietnameseAccents(a).includes(cleanSearch)
        );
        return nameMatch || fullNameMatch || legacyDistrictMatch || aliasMatch;
      });
    }

    return list;
  }

  public getCommuneByCode(code: string): CommuneUnit | undefined {
    return this.communes.find((c) => c.code === code);
  }
}

export const administrativeService = new AdministrativeDataService();
