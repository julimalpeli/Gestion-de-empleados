-- Documentos y reglamentos laborales (acceso solo admin / manager / hr)

CREATE TABLE IF NOT EXISTS company_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('reglamento', 'vacaciones', 'contrato', 'regla_interna', 'otro')),
    description TEXT,
    current_version_id UUID,
    requires_signature BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES company_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    notes TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS company_document_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_version_id UUID NOT NULL REFERENCES company_document_versions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    signed_file_path TEXT NOT NULL,
    signed_file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    UNIQUE (document_version_id, employee_id)
);

ALTER TABLE company_documents
    ADD CONSTRAINT company_documents_current_version_fk
    FOREIGN KEY (current_version_id) REFERENCES company_document_versions(id) ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_company_documents_category ON company_documents(category);
CREATE INDEX IF NOT EXISTS idx_company_document_versions_document ON company_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_company_document_signatures_version ON company_document_signatures(document_version_id);
CREATE INDEX IF NOT EXISTS idx_company_document_signatures_employee ON company_document_signatures(employee_id);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_signatures ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_documents_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
          AND users.is_active = true
          AND users.role IN ('admin', 'manager', 'hr')
    );
$$;

DROP POLICY IF EXISTS "Company documents manageable by admin/manager/hr" ON company_documents;
CREATE POLICY "Company documents manageable by admin/manager/hr" ON company_documents
    FOR ALL TO authenticated
    USING (public.is_company_documents_manager())
    WITH CHECK (public.is_company_documents_manager());

DROP POLICY IF EXISTS "Company document versions manageable by admin/manager/hr" ON company_document_versions;
CREATE POLICY "Company document versions manageable by admin/manager/hr" ON company_document_versions
    FOR ALL TO authenticated
    USING (public.is_company_documents_manager())
    WITH CHECK (public.is_company_documents_manager());

DROP POLICY IF EXISTS "Company document signatures manageable by admin/manager/hr" ON company_document_signatures;
CREATE POLICY "Company document signatures manageable by admin/manager/hr" ON company_document_signatures
    FOR ALL TO authenticated
    USING (public.is_company_documents_manager())
    WITH CHECK (public.is_company_documents_manager());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'company-documents',
    'company-documents',
    false,
    10485760,
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Company documents storage readable by admin/manager/hr" ON storage.objects;
CREATE POLICY "Company documents storage readable by admin/manager/hr" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'company-documents' AND public.is_company_documents_manager());

DROP POLICY IF EXISTS "Company documents storage uploadable by admin/manager/hr" ON storage.objects;
CREATE POLICY "Company documents storage uploadable by admin/manager/hr" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'company-documents' AND public.is_company_documents_manager());

DROP POLICY IF EXISTS "Company documents storage deletable by admin/manager/hr" ON storage.objects;
CREATE POLICY "Company documents storage deletable by admin/manager/hr" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'company-documents' AND public.is_company_documents_manager());
