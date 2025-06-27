-- Configurar Supabase Storage para archivos

-- 1. Crear bucket para documentos de empleados
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', true);

-- 2. Políticas de acceso para el bucket
CREATE POLICY "Todos pueden ver documentos" ON storage.objects
FOR SELECT USING (bucket_id = 'employee-documents');

CREATE POLICY "Usuarios autenticados pueden subir" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'employee-documents');

CREATE POLICY "Usuarios autenticados pueden actualizar" ON storage.objects
FOR UPDATE USING (bucket_id = 'employee-documents');

CREATE POLICY "Usuarios autenticados pueden eliminar" ON storage.objects
FOR DELETE USING (bucket_id = 'employee-documents');

-- 3. Actualizar tabla files para usar URLs de Supabase Storage
ALTER TABLE files ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS public_url TEXT;
