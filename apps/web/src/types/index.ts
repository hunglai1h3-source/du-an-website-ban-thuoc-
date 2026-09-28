export type UserRole = 'ADMIN' | 'DATA_REVIEWER' | 'VIEWER' | 'CUSTOMER'

export interface User {
  id: number
  email: string
  phone?: string | null
  full_name: string
  role: UserRole
  loyalty_points?: number
  is_active: boolean
  created_at?: string
  last_login_at?: string | null
}

export type ConfidenceLabel = 'HIGH_OFFICIAL_MATCH' | 'REVIEW_REQUIRED' | 'INSUFFICIENT_EVIDENCE' | 'BLOCKED'

export interface Product {
  id: number
  canonical_name: string
  registration_number: string | null
  manufacturer: string | null
  image_url?: string | null
  description?: string | null
  usage_instructions?: string | null
  indications?: string | null
  contraindications?: string | null
  side_effects?: string | null
  storage_conditions?: string | null
  dosage_form?: string | null
  route?: string | null
  package_description?: string | null
  manufacturing_country?: string | null
  rx_otc_status: 'OTC' | 'PRESCRIPTION' | 'UNKNOWN'
  regulatory_status: string
  overall_score: number
  confidence_label: ConfidenceLabel
  publish_status: string
  is_demo: boolean
  updated_at: string
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Source {
  id: number
  code: string
  name: string
  source_type: string
  base_url: string | null
  authority_level: number
  authority_weight: number
  enabled: boolean
  robots_status: string
  crawl_frequency: string
  last_success_at: string | null
}

export interface Conflict {
  id: number
  product_id: number
  conflict_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  field_name: string
  value_a: string | null
  value_b: string | null
  description: string
  status: string
  created_at: string
}

