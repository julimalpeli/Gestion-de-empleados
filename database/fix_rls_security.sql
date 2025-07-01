-- =====================================================
-- FIX SUPABASE RLS SECURITY ISSUES
-- =====================================================
-- Este script resuelve los errores de seguridad reportados por Supabase
-- relacionados con Row Level Security (RLS)

-- Habilitar RLS en todas las tablas que lo necesitan
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA EMPLOYEES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Employees visible to all authenticated users" ON employees;
DROP POLICY IF EXISTS "Employees manageable by authorized users" ON employees;

-- Política para ver empleados (todos los usuarios autenticados)
CREATE POLICY "Employees visible to all authenticated users" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para gestionar empleados (admin, gerente, rrhh)
CREATE POLICY "Employees manageable by authorized users" ON employees
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr')
    );

-- =====================================================
-- POLÍTICAS PARA USERS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users visible to admins" ON users;
DROP POLICY IF EXISTS "Users manageable by admins" ON users;

-- Solo admins pueden ver usuarios
CREATE POLICY "Users visible to admins" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Solo admins pueden gestionar usuarios
CREATE POLICY "Users manageable by admins" ON users
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'admin'
    );

-- =====================================================
-- POLÍTICAS PARA VACATION_REQUESTS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Vacation requests visible to authorized users" ON vacation_requests;
DROP POLICY IF EXISTS "Vacation requests manageable by authorized users" ON vacation_requests;

-- Ver solicitudes de vacaciones (todos los usuarios autenticados)
CREATE POLICY "Vacation requests visible to authorized users" ON vacation_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gestionar solicitudes (admin, gerente, rrhh pueden aprobar; empleados pueden crear las suyas)
CREATE POLICY "Vacation requests manageable by authorized users" ON vacation_requests
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr') OR
            (auth.jwt() ->> 'role' = 'employee' AND employee_id = auth.uid()::uuid)
        )
    );

-- =====================================================
-- POLÍTICAS PARA AUDIT_LOG
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Audit log visible to admins" ON audit_log;
DROP POLICY IF EXISTS "Audit log insertable by system" ON audit_log;

-- Solo admins pueden ver logs de auditoría
CREATE POLICY "Audit log visible to admins" ON audit_log
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'admin'
    );

-- El sistema puede insertar logs (sin restricciones para triggers)
CREATE POLICY "Audit log insertable by system" ON audit_log
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLÍTICAS PARA FILES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Files visible to authorized users" ON files;
DROP POLICY IF EXISTS "Files manageable by authorized users" ON files;

-- Ver archivos (todos los usuarios autenticados)
CREATE POLICY "Files visible to authorized users" ON files
    FOR SELECT USING (auth.role() = 'authenticated');

-- Gestionar archivos (admin, gerente, rrhh)
CREATE POLICY "Files manageable by authorized users" ON files
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr')
    );

-- =====================================================
-- POLÍTICAS PARA EMPLOYEE_DOCUMENTS (YA EXISTÍAN PERO FALTABA RLS)
-- =====================================================

-- Verificar que las políticas existentes estén bien configuradas
-- (Las políticas ya existen según el error, solo faltaba habilitar RLS)

-- Si necesitas recrear las políticas de employee_documents:
-- DROP POLICY IF EXISTS "Users can view employee documents" ON employee_documents;
-- DROP POLICY IF EXISTS "Users can upload employee documents" ON employee_documents;
-- DROP POLICY IF EXISTS "Users can update employee documents" ON employee_documents;
-- DROP POLICY IF EXISTS "Users can delete employee documents" ON employee_documents;

-- CREATE POLICY "Users can view employee documents" ON employee_documents
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Users can upload employee documents" ON employee_documents
--     FOR INSERT WITH CHECK (
--         auth.role() = 'authenticated' AND 
--         auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr')
--     );

-- CREATE POLICY "Users can update employee documents" ON employee_documents
--     FOR UPDATE USING (
--         auth.role() = 'authenticated' AND 
--         auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr')
--     );

-- CREATE POLICY "Users can delete employee documents" ON employee_documents
--     FOR DELETE USING (
--         auth.role() = 'authenticated' AND 
--         auth.jwt() ->> 'role' IN ('admin', 'manager', 'hr')
--     );

-- =====================================================
-- VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que RLS esté habilitado en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'employees', 'users', 'vacation_requests', 
        'audit_log', 'files', 'employee_documents'
    )
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command_type,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'employees', 'users', 'vacation_requests', 
        'audit_log', 'files', 'employee_documents'
    )
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Estas políticas asumen que usas Supabase Auth con JWT tokens
-- 2. Los roles ('admin', 'manager', 'hr', 'employee') deben estar en el JWT
-- 3. Para sistemas con auth local, podrías necesitar ajustar las políticas
-- 4. Siempre prueba las políticas en un entorno de desarrollo primero

-- =====================================================
-- COMANDOS DE ROLLBACK (si necesitas deshacer)
-- =====================================================

-- Para deshabilitar RLS (NO recomendado en producción):
-- ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vacation_requests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.employee_documents DISABLE ROW LEVEL SECURITY;
