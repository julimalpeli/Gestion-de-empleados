-- Script corregido para limpiar datos respetando constraints y conservando usuarios del sistema
-- PRECAUCIÓN: Este script eliminará todos los empleados y sus datos relacionados

-- 1. Primero limpiar datos relacionados con empleados
DELETE FROM employee_documents;
DELETE FROM vacation_requests;
DELETE FROM payroll_records;

-- 2. Eliminar usuarios de tipo "employee" (que tienen employee_id)
-- Esto libera las foreign key constraints
DELETE FROM users 
WHERE role = 'employee' 
  AND employee_id IS NOT NULL;

-- 3. Ahora podemos eliminar empleados sin problemas de constraints
DELETE FROM employees;

-- 4. Resetear último login de usuarios restantes para que se logueen nuevamente
UPDATE users 
SET last_login = NULL,
    reset_required = false
WHERE role != 'employee';

-- Verificar el estado final
SELECT '=== ESTADO FINAL ===' as info;

SELECT 'Usuarios restantes por rol:' as categoria;
SELECT role, COUNT(*) as cantidad, 
       STRING_AGG(username, ', ') as usuarios
FROM users 
GROUP BY role 
ORDER BY role;

SELECT 'Empleados restantes:' as categoria, COUNT(*) as cantidad FROM employees;
SELECT 'Liquidaciones restantes:' as categoria, COUNT(*) as cantidad FROM payroll_records;
SELECT 'Vacaciones restantes:' as categoria, COUNT(*) as cantidad FROM vacation_requests;
SELECT 'Documentos restantes:' as categoria, COUNT(*) as cantidad FROM employee_documents;

-- Mensaje final
SELECT '✅ Limpieza completada exitosamente' as resultado;
SELECT 'ℹ️  Se conservaron usuarios del sistema (admin, manager, hr, readonly)' as nota1;
SELECT '⚠️  Elimina archivos del storage manualmente desde Supabase Dashboard' as nota2;
