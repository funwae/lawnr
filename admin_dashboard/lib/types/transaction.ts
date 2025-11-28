export interface Transaction {
  id: string;
  job_id: string;
  homeowner_id: string;
  contractor_id: string;
  amount_total: number;
  platform_commission: number;
  contractor_payout: number;
  payment_method?: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  issued_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
}
