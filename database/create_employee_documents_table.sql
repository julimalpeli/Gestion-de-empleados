-- Create employee_documents table for file management
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL, -- File path in storage
    original_file_name VARCHAR(255) NOT NULL, -- Original filename uploaded by user
    file_type VARCHAR(100) NOT NULL, -- MIME type
    file_size BIGINT NOT NULL, -- File size in bytes
    category VARCHAR(50) NOT NULL CHECK (category IN ('recibo_sueldo', 'sac', 'documentos', 'formularios', 'otros')),
    description TEXT, -- Optional description
    file_url TEXT NOT NULL, -- Public URL to access file
    uploaded_by VARCHAR(255) NOT NULL, -- Who uploaded the file
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_category ON employee_documents(category);
CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_at ON employee_documents(uploaded_at);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_employee_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_employee_documents_updated_at ON employee_documents;
CREATE TRIGGER trigger_update_employee_documents_updated_at
    BEFORE UPDATE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_documents_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view documents for employees they have access to
CREATE POLICY "Users can view employee documents" ON employee_documents 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
            users.role IN ('admin', 'manager', 'hr')
            OR (users.role = 'employee' AND users.employee_id = employee_documents.employee_id)
        )
    )
);

-- Users with appropriate roles can insert documents
CREATE POLICY "Users can upload employee documents" ON employee_documents 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
    )
);

-- Users with appropriate roles can update documents
CREATE POLICY "Users can update employee documents" ON employee_documents 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
    )
);

-- Users with appropriate roles can delete documents
CREATE POLICY "Users can delete employee documents" ON employee_documents 
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
    )
);

-- Add comments
COMMENT ON TABLE employee_documents IS 'Documentos y archivos asociados a empleados';
COMMENT ON COLUMN employee_documents.category IS 'Categoría del documento: recibo_sueldo, sac, documentos, formularios, otros';
COMMENT ON COLUMN employee_documents.file_name IS 'Ruta del archivo en el storage de Supabase';
COMMENT ON COLUMN employee_documents.original_file_name IS 'Nombre original del archivo subido por el usuario';
