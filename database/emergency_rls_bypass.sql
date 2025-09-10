-- =============================================================================
-- BYPASS TEMPORAL DE RLS - ACCESO DE EMERGENCIA
-- =============================================================================
-- Este script temporalmente deshabilita RLS para restaurar el acceso
-- mientras se ajustan las políticas para el sistema de auth actual
-- =============================================================================

-- PASO 1: Deshabilitar RLS temporalmente en todas las tablas críticas
DO $$
BEGIN
    RAISE NOTICE '🚨 EMERGENCY BYPASS: Deshabilitando RLS temporalmente...';
    
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en users';
    
    ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en employees';
    
    ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en payroll_records';
    
    ALTER TABLE vacation_requests DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en vacation_requests';
    
    ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en employee_documents';
    
    ALTER TABLE salary_history DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en salary_history';
    
    ALTER TABLE files DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS deshabilitado en files';
    
    -- Mantener audit_log con RLS para proteger logs
    RAISE NOTICE '✅ audit_log mantiene RLS habilitado';
    
END;
$$;

-- PASO 2: Verificar que el acceso se restauró
DO $$
DECLARE
    user_count INTEGER;
    employee_count INTEGER;
    payroll_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 Verificando acceso restaurado...';
    
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO employee_count FROM employees;
    SELECT COUNT(*) INTO payroll_count FROM payroll_records;
    
    RAISE NOTICE 'Usuarios visibles: %', user_count;
    RAISE NOTICE 'Empleados visibles: %', employee_count;
    RAISE NOTICE 'Liquidaciones visibles: %', payroll_count;
    
    IF user_count > 0 AND employee_count > 0 AND payroll_count > 0 THEN
        RAISE NOTICE '✅ ACCESO RESTAURADO - Datos visibles nuevamente';
    ELSE
        RAISE NOTICE '❌ PROBLEMA PERSISTE - Verificar conectividad';
    END IF;
END;
$$;

-- PASO 3: Estado final
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS activo'
        ELSE '🔓 RLS deshabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'employees', 'payroll_records', 'vacation_requests')
ORDER BY tablename;

RAISE NOTICE '';
RAISE NOTICE '🚨 EMERGENCY BYPASS COMPLETADO';
RAISE NOTICE '⚠️  ESTADO: RLS temporalmente deshabilitado';
RAISE NOTICE '🔧 PRÓXIMOS PASOS: Ajustar políticas para el sistema de auth actual';
RAISE NOTICE '';
