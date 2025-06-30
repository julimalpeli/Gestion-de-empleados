-- Script para limpiar datos parcialmente
-- Útil si quieres conservar empleados pero limpiar liquidaciones, etc.

-- =====================================================
-- OPCIÓN 1: Solo limpiar liquidaciones y documentos
-- =====================================================

-- Limpiar liquidaciones del período actual
-- DELETE FROM payroll_records WHERE period >= '2024-12';

-- Limpiar todas las liquidaciones
-- DELETE FROM payroll_records;

-- Limpiar documentos de empleados
-- DELETE FROM employee_documents;

-- =====================================================
-- OPCIÓN 2: Solo limpiar solicitudes de vacaciones
-- =====================================================

-- DELETE FROM vacation_requests;

-- =====================================================
-- OPCIÓN 3: Limpiar empleados específicos
-- =====================================================

-- Eliminar empleados inactivos únicamente
-- DELETE FROM employees WHERE status = 'inactive';

-- Eliminar un empleado específico (reemplaza 'EMPLOYEE_ID' con el ID real)
-- DELETE FROM employee_documents WHERE employee_id = 'EMPLOYEE_ID';
-- DELETE FROM vacation_requests WHERE employee_id = 'EMPLOYEE_ID';
-- DELETE FROM payroll_records WHERE employee_id = 'EMPLOYEE_ID';
-- DELETE FROM employees WHERE id = 'EMPLOYEE_ID';

-- =====================================================
-- VERIFICACIÓN DEL ESTADO ACTUAL
-- =====================================================

SELECT 'Estado actual de la base de datos:' as info;

SELECT 'Empleados por estado:' as categoria;
SELECT status, COUNT(*) as cantidad 
FROM employees 
GROUP BY status 
ORDER BY status;

SELECT 'Liquidaciones por período:' as categoria;
SELECT period, COUNT(*) as cantidad 
FROM payroll_records 
GROUP BY period 
ORDER BY period DESC 
LIMIT 10;

SELECT 'Solicitudes de vacaciones por estado:' as categoria;
SELECT status, COUNT(*) as cantidad 
FROM vacation_requests 
GROUP BY status 
ORDER BY status;

SELECT 'Total de documentos:' as categoria;
SELECT COUNT(*) as cantidad FROM employee_documents;

SELECT 'Usuarios registrados:' as categoria;
SELECT username, email, role, is_active 
FROM users 
ORDER BY created_at;
