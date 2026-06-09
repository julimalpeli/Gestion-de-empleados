-- Create payroll_sends table for tracking receipt sends
-- ✅ Applied to Supabase (project: wfeoihoxpnzdfwzohzyo)
CREATE TABLE IF NOT EXISTS payroll_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Batch tracking (groups all sends from one upload)
    batch_id UUID NOT NULL,

    -- References (optional - may not always have a linked payroll record)
    payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

    -- Email info
    email VARCHAR(255) NOT NULL,
    document_file_path VARCHAR(500) NOT NULL,

    -- Status tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    attempts INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_payroll_sends_batch
    ON payroll_sends(batch_id);

CREATE INDEX IF NOT EXISTS idx_payroll_sends_employee
    ON payroll_sends(employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_sends_status
    ON payroll_sends(status);

CREATE INDEX IF NOT EXISTS idx_payroll_sends_created
    ON payroll_sends(created_at DESC);

-- Enable RLS
ALTER TABLE payroll_sends ENABLE ROW LEVEL SECURITY;
