-- Add payroll_id column to employee_documents table for payroll-specific documents

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_documents' 
                   AND column_name = 'payroll_id') THEN
        
        -- Add the payroll_id column
        ALTER TABLE employee_documents 
        ADD COLUMN payroll_id UUID NULL REFERENCES payroll_records(id) ON DELETE SET NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_employee_documents_payroll_id 
        ON employee_documents(payroll_id);
        
        -- Add comment
        COMMENT ON COLUMN employee_documents.payroll_id IS 'ID de la liquidación específica (null para documentos generales del empleado)';
        
        RAISE NOTICE 'payroll_id column added to employee_documents table successfully';
    ELSE
        RAISE NOTICE 'payroll_id column already exists in employee_documents table';
    END IF;
END $$;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_documents' 
ORDER BY ordinal_position;
