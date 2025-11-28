export interface Job {
  id: string;
  quote_id: string;
  contractor_id: string;
  property_id: string;
  scheduled_date: string;
  scheduled_time_from?: string;
  scheduled_time_to?: string;
  status: "scheduled" | "on_way" | "started" | "completed" | "cancelled";
  actual_start?: string;
  actual_end?: string;
  before_media?: string[];
  after_media?: string[];
  cost_log?: any;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  jobs: Job[];
}
