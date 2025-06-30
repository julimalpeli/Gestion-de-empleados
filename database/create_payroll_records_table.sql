-- Create payroll_records table for liquidations management
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    base_days INTEGER NOT NULL DEFAULT 0,
    holiday_days INTEGER DEFAULT 0,
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    holiday_bonus DECIMAL(12,2) DEFAULT 0,
    aguinaldo DECIMAL(12,2) DEFAULT 0,
    discounts DECIMAL(12,2) DEFAULT 0,
    advances DECIMAL(12,2) DEFAULT 0,
    white_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    informal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    presentismo_amount DECIMAL(12,2) DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    bonus_amount DECIMAL(12,2) DEFAULT 0,
    net_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'processed', 'paid')),
    processed_date TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);

-- Create unique constraint to prevent duplicate payroll records for same employee and period
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_records_employee_period
ON payroll_records(employee_id, period);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_payroll_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_payroll_records_updated_at ON payroll_records;
CREATE TRIGGER trigger_update_payroll_records_updated_at
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_records_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all payroll records" ON payroll_records FOR SELECT USING (true);
CREATE POLICY "Users can insert payroll records" ON payroll_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update payroll records" ON payroll_records FOR UPDATE USING (true);
CREATE POLICY "Users can delete payroll records" ON payroll_records FOR DELETE USING (true);
