export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  isPopular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  badge?: string;
  subCategories: SubCategory[];
  featuredImage?: string;
  featuredTitle?: string;
  featuredSubtitle?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;         // Category slug (e.g. 'thuoc-khong-ke-don')
  categoryName: string;     // Display category name (e.g. 'Thuốc Không Kê Đơn')
  subCategory?: string;     // Subcategory slug (e.g. 'giam-dau-ha-sot')
  price: number;
  salePrice?: number;
  images: string[];
  shortDescription: string;
  description: string;
  activeIngredient: string; // Hoạt chất chính
  dosageForm: string;       // Dạng bào chế: Viên nén, Viên nang, Siro, Bột pha...
  packaging: string;        // Quy cách: Hộp 15 vỉ x 12 viên...
  origin: string;           // Xuất xứ: Việt Nam, Pháp, Nhật Bản, Đức, Mỹ...
  manufacturer: string;     // Nhà sản xuất: GSK, Sanofi, DHG, DHC, Omron...
  usage: string;            // Cách dùng & công dụng tóm tắt
  indications: string;      // Chỉ định điều trị
  contraindications: string;// Chống chỉ định
  sideEffects: string;      // Tác dụng phụ
  precautions: string;      // Thận trọng khi dùng
  storage: string;          // Bảo quản
  stock: number;            // Tồn kho
  rating: number;           // Điểm đánh giá (1-5)
  reviewCount: number;      // Số lượt đánh giá
  isPrescription: boolean;  // QUAN TRỌNG: True = Thuốc kê đơn Rx
  isFeatured: boolean;      // Nổi bật
  isBestSeller: boolean;    // Bán chạy
  createdAt: string;
}

export interface SearchSuggestionItem {
  id: string;
  title: string;
  category: string;
  price?: number;
  originalPrice?: number;
  unit?: string;
  brand?: string;
  badge?: string;
  image?: string;
  slug: string;
}

export interface TrustStat {
  value: string;
  label: string;
  sublabel: string;
  icon: string;
}

export type ProductSortOption =
  | "popular"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface ProductFilterState {
  category: string;
  subCategory: string;
  brand: string[];
  priceRange: string;
  origin: string[];
  dosageForm: string[];
  prescriptionType: "all" | "otc" | "rx";
  searchQuery?: string;
}
