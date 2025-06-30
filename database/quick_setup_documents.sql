-- Quick setup for employee documents system
-- Run this if you're getting upload errors

-- 1. Create the table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    payroll_id UUID NULL REFERENCES payroll_records(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('recibo_sueldo', 'sac', 'documentos', 'formularios', 'otros')),
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_payroll_id ON employee_documents(payroll_id);

-- 3. Disable RLS temporarily for testing
ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;

-- 4. Create storage bucket (if using Supabase dashboard, create manually)
-- Bucket name: employee-documents
-- Public: true
-- File size limit: 10MB

-- 5. Verify setup
SELECT 'employee_documents table' as component,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_documents')
            THEN 'OK' ELSE 'MISSING' END as status;

-- Test insert (remove after testing)
-- INSERT INTO employee_documents (employee_id, file_name, original_file_name, file_type, file_size, category, file_url, uploaded_by)
-- VALUES (
--     (SELECT id FROM employees LIMIT 1),
--     'test.pdf',
--     'test.pdf',
--     'application/pdf',
--     1000,
--     'otros',
--     'https://example.com/test.pdf',
--     'test'
-- );
