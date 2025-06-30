-- Add address, email and document_type fields to employees table
-- These fields were added to the employee creation/edit forms

-- Add document_type column
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'dni';

-- Add address column
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add email column
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_document_type ON employees(document_type);

-- Add comments to document the new fields
COMMENT ON COLUMN employees.document_type IS 'Type of document (dni, passport, ce, ci)';
COMMENT ON COLUMN employees.address IS 'Employee home address';
COMMENT ON COLUMN employees.email IS 'Employee email address';
