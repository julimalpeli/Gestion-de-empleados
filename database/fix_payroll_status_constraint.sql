-- Drop the existing check constraint and recreate it with the correct values
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS payroll_records_status_check;

-- Add the updated check constraint with all status values we're using
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'processed', 'paid'));

-- Update any existing records that might have invalid status values to 'draft'
UPDATE payroll_records 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'pending', 'approved', 'processed', 'paid');
