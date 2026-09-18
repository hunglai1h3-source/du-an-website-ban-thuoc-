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
