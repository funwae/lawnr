export interface PlatformAnalytics {
  total_users: number;
  total_contractors: number;
  total_homeowners: number;
  total_jobs: number;
  total_revenue: number;
  total_commission: number;
  average_order_value: number;
  repeat_customer_rate: number;
  popular_services: Array<{
    service: string;
    count: number;
  }>;
  top_contractors: Array<{
    contractor_id: string;
    business_name: string;
    total_earnings: number;
    job_count: number;
  }>;
}

export interface AnalyticsResponse {
  analytics: PlatformAnalytics;
}

