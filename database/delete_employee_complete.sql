-- ===============================================
-- SCRIPT DE ELIMINACIÓN COMPLETA DE EMPLEADO
-- ===============================================
-- 
-- Este script elimina completamente un empleado y todos sus datos relacionados
-- Ejecutar en el SQL Editor de Supabase
--
-- INSTRUCCIONES:
-- 1. Reemplazar 'EMPLOYEE_ID_HERE' con el ID real del empleado
-- 2. Reemplazar 'EMPLOYEE_DNI_HERE' con el DNI real del empleado  
-- 3. Ejecutar paso a paso para verificar cada operación
-- 
-- ADVERTENCIA: ESTA OPERACIÓN NO SE PUEDE DESHACER
-- ===============================================

-- PASO 1: VERIFICAR DATOS DEL EMPLEADO
-- Ejecutar primero para confirmar que es el empleado correcto
SELECT 
  id,
  name,
  dni,
  email,
  position,
  status,
  created_at
FROM employees 
WHERE id = 'EMPLOYEE_ID_HERE' OR dni = 'EMPLOYEE_DNI_HERE';

-- PASO 2: VERIFICAR DATOS RELACIONADOS
-- Ver qué datos se van a eliminar
SELECT 
  'vacation_requests' as table_name,
  COUNT(*) as records_count
FROM vacation_requests 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'payroll_records' as table_name,
  COUNT(*) as records_count
FROM payroll_records 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'files' as table_name,
  COUNT(*) as records_count
FROM files 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'users' as table_name,
  COUNT(*) as records_count
FROM users 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- PASO 3: ELIMINAR SOLICITUDES DE VACACIONES
-- Elimina todas las solicitudes de vacaciones del empleado
DELETE FROM vacation_requests 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Verificar eliminación
SELECT 
  'vacation_requests_after_delete' as status,
  COUNT(*) as remaining_records
FROM vacation_requests 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- PASO 4: ELIMINAR REGISTROS DE NÓMINA
-- Elimina todos los registros de nómina del empleado
DELETE FROM payroll_records 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Verificar eliminación
SELECT 
  'payroll_records_after_delete' as status,
  COUNT(*) as remaining_records
FROM payroll_records 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- PASO 5: ELIMINAR DOCUMENTOS
-- Obtener rutas de archivos antes de eliminar (para limpieza manual del storage si es necesario)
SELECT 
  id,
  file_name,
  file_path,
  file_type
FROM files 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Eliminar registros de documentos
DELETE FROM files 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Verificar eliminación
SELECT 
  'files_after_delete' as status,
  COUNT(*) as remaining_records
FROM files 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- PASO 6: ELIMINAR USUARIO ASOCIADO
-- Obtener datos del usuario antes de eliminar
SELECT 
  id,
  username,
  email,
  name,
  role,
  is_active
FROM users 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Eliminar usuario de la tabla users
DELETE FROM users 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- Verificar eliminación
SELECT 
  'users_after_delete' as status,
  COUNT(*) as remaining_records
FROM users 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- PASO 7: ELIMINAR EL EMPLEADO
-- Obtener datos del empleado una última vez
SELECT 
  id,
  name,
  dni,
  email,
  'ABOUT_TO_DELETE' as status
FROM employees 
WHERE id = 'EMPLOYEE_ID_HERE';

-- ELIMINACIÓN FINAL DEL EMPLEADO
DELETE FROM employees 
WHERE id = 'EMPLOYEE_ID_HERE';

-- PASO 8: VERIFICACIÓN FINAL
-- Confirmar que el empleado fue eliminado completamente
SELECT 
  'FINAL_VERIFICATION' as status,
  'employees' as table_name,
  COUNT(*) as remaining_records
FROM employees 
WHERE id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'FINAL_VERIFICATION' as status,
  'vacation_requests' as table_name,
  COUNT(*) as remaining_records
FROM vacation_requests 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'FINAL_VERIFICATION' as status,
  'payroll_records' as table_name,
  COUNT(*) as remaining_records
FROM payroll_records 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'FINAL_VERIFICATION' as status,
  'files' as table_name,
  COUNT(*) as remaining_records
FROM files 
WHERE employee_id = 'EMPLOYEE_ID_HERE'

UNION ALL

SELECT 
  'FINAL_VERIFICATION' as status,
  'users' as table_name,
  COUNT(*) as remaining_records
FROM users 
WHERE employee_id = 'EMPLOYEE_ID_HERE';

-- ===============================================
-- EJEMPLO DE USO:
-- ===============================================
-- Para eliminar el empleado con DNI 35940844:
-- 
-- 1. Reemplazar todas las instancias de:
--    'EMPLOYEE_ID_HERE' → 'actual-employee-id-uuid'
--    'EMPLOYEE_DNI_HERE' → '35940844'
--
-- 2. Ejecutar cada sección paso a paso
-- 3. Verificar los resultados antes de continuar
-- ===============================================

-- NOTAS IMPORTANTES:
-- 
-- 1. BACKUP: Hacer backup de la base de datos antes de ejecutar
-- 2. STORAGE: Los archivos en el storage de Supabase deben eliminarse manualmente
-- 3. AUTH: El usuario en Supabase Auth debe eliminarse desde el panel de Admin
-- 4. LOGS: Considerar registrar esta operación en una tabla de auditoría
-- 5. IRREVERSIBLE: Esta operación NO se puede deshacer
-- 
-- ===============================================
