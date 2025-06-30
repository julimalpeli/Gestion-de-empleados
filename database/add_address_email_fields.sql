-- Add address and email fields to employees table
-- These fields were added to the employee creation/edit forms

-- Add address column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add email column  
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Add comments to document the new fields
COMMENT ON COLUMN employees.address IS 'Employee home address';
COMMENT ON COLUMN employees.email IS 'Employee email address';
