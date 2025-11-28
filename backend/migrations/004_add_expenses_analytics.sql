-- Add expense tracking table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('fuel', 'materials', 'equipment', 'labor', 'other')),
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_expenses_contractor ON expenses(contractor_id);
CREATE INDEX idx_expenses_job ON expenses(job_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);

-- Add contractor analytics cache table (for performance)
CREATE TABLE IF NOT EXISTS contractor_analytics (
  contractor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  total_profit NUMERIC(10,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_cancelled INTEGER DEFAULT 0,
  average_job_value NUMERIC(10,2) DEFAULT 0,
  repeat_customers INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_period ON contractor_analytics(period_start, period_end);

-- Updated_at triggers
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

