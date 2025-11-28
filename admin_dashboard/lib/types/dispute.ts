export interface Dispute {
  id: string;
  job_id: string;
  homeowner_id: string;
  contractor_id: string;
  dispute_type: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  evidence?: Array<{
    id: string;
    evidence_url: string;
    evidence_type: string;
    uploaded_by: string;
    created_at: string;
  }>;
}

export interface DisputeListResponse {
  disputes: Dispute[];
}

