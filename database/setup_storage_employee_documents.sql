-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload employee documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'employee-documents');

-- Create policy to allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view employee documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'employee-documents');

-- Create policy to allow admin/hr to delete files
CREATE POLICY "Allow admin/hr to delete employee documents" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'employee-documents' 
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
    )
);

-- Update bucket policies
UPDATE storage.buckets 
SET file_size_limit = 10485760 -- 10MB limit
WHERE id = 'employee-documents';
