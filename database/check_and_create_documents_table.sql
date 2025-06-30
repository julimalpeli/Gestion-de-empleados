-- Check if employee_documents table exists and create if needed
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_documents') THEN
        RAISE NOTICE 'employee_documents table does not exist, creating it...';
        
        -- Create the table
        CREATE TABLE employee_documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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

        -- Create indexes
        CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
        CREATE INDEX idx_employee_documents_category ON employee_documents(category);
        CREATE INDEX idx_employee_documents_uploaded_at ON employee_documents(uploaded_at);

        -- Create update trigger
        CREATE OR REPLACE FUNCTION update_employee_documents_updated_at()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_employee_documents_updated_at
            BEFORE UPDATE ON employee_documents
            FOR EACH ROW
            EXECUTE FUNCTION update_employee_documents_updated_at();

        -- Enable RLS
        ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view employee documents" ON employee_documents 
        FOR SELECT USING (true); -- Simplified for now

        CREATE POLICY "Users can upload employee documents" ON employee_documents 
        FOR INSERT WITH CHECK (true); -- Simplified for now

        CREATE POLICY "Users can update employee documents" ON employee_documents 
        FOR UPDATE USING (true); -- Simplified for now

        CREATE POLICY "Users can delete employee documents" ON employee_documents 
        FOR DELETE USING (true); -- Simplified for now

        RAISE NOTICE 'employee_documents table created successfully';
    ELSE
        RAISE NOTICE 'employee_documents table already exists';
    END IF;
    
    -- Check storage bucket
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'employee-documents') THEN
        RAISE NOTICE 'Creating employee-documents storage bucket...';
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('employee-documents', 'employee-documents', true);
        RAISE NOTICE 'Storage bucket created successfully';
    ELSE
        RAISE NOTICE 'employee-documents storage bucket already exists';
    END IF;
END $$;

-- Show table status
SELECT 
    'employee_documents' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_documents') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as status;

-- Show bucket status  
SELECT 
    'employee-documents' as bucket_name,
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'employee-documents') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as status;
