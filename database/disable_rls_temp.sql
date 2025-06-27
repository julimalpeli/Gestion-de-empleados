-- Deshabilitar temporalmente RLS para testing
-- EJECUTAR SOLO EN DESARROLLO

-- Deshabilitar RLS en todas las tablas
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users visible to admins only" ON users;
DROP POLICY IF EXISTS "Employees visible to authorized users" ON employees;
DROP POLICY IF EXISTS "Employees modifiable by admin and hr" ON employees;
DROP POLICY IF EXISTS "Payroll records visible to authorized users" ON payroll_records;
DROP POLICY IF EXISTS "Vacation requests manageable" ON vacation_requests;
DROP POLICY IF EXISTS "Files manageable" ON files;

-- NOTA: En producción deberás habilitar RLS nuevamente con políticas correctas
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- etc...
