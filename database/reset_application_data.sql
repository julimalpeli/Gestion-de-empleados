-- Script para limpiar todos los datos de la aplicación y comenzar desde cero
-- PRECAUCIÓN: Este script eliminará TODOS los datos excepto el usuario administrador

-- Limpiar datos de documentos de empleados
-- Nota: Los archivos en storage deberán eliminarse manualmente desde Supabase Dashboard
DELETE FROM employee_documents;

-- Limpiar solicitudes de vacaciones
DELETE FROM vacation_requests;

-- Limpiar registros de liquidaciones
DELETE FROM payroll_records;

-- Limpiar empleados
DELETE FROM employees;

-- Limpiar usuarios pero conservar el administrador
-- Solo eliminar usuarios que NO sean el admin (julimalpeli@gmail.com)
DELETE FROM users 
WHERE email != 'julimalpeli@gmail.com';

-- Resetear el último login del admin para que tenga que loguearse nuevamente
UPDATE users 
SET last_login = NULL,
    reset_required = false
WHERE email = 'julimalpeli@gmail.com';

-- Mostrar el estado final
SELECT 'Usuarios restantes:' as info;
SELECT id, username, email, role, is_active FROM users;

SELECT 'Total empleados:' as info, COUNT(*) as count FROM employees;
SELECT 'Total liquidaciones:' as info, COUNT(*) as count FROM payroll_records;
SELECT 'Total vacaciones:' as info, COUNT(*) as count FROM vacation_requests;
SELECT 'Total documentos:' as info, COUNT(*) as count FROM employee_documents;

-- Mensaje final
SELECT '✅ Aplicación reseteada exitosamente' as resultado;
SELECT '⚠️  Recuerda eliminar archivos del storage manualmente desde Supabase Dashboard' as nota;
