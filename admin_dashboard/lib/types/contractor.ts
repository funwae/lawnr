export interface ContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_logo_url?: string;
  description?: string;
  service_types: string[];
  base_rate_per_hour?: number;
  per_service_rate?: Record<string, number>;
  availability?: any;
  is_verified: boolean;
  premium_listing: "none" | "boosted" | "featured";
  rating_avg?: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
  };
}

export interface ContractorListResponse {
  contractors: ContractorProfile[];
}
