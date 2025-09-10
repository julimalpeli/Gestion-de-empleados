-- =============================================================================
-- SCRIPT PARA DESHABILITAR RLS EN AUDIT_LOG
-- =============================================================================
-- NOTA: Este script deshabilita RLS solo en la tabla audit_log
-- Todas las demás tablas ya están sin RLS por decisión del usuario
-- =============================================================================

-- Deshabilitar RLS en audit_log (única tabla con RLS habilitado)
DO $$
BEGIN
    RAISE NOTICE '⚠️ Deshabilitando RLS en audit_log...';
    
    ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en audit_log';
    
    RAISE NOTICE 'ℹ️ Nota: Las demás tablas ya estaban sin RLS por decisión del usuario';
    
END;
$$;

-- Verificar estado final
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS activo'
        ELSE '✅ RLS deshabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 'employees', 'payroll_records', 
        'vacation_requests', 'employee_documents', 
        'salary_history', 'files', 'audit_log'
    )
ORDER BY tablename;

RAISE NOTICE '';
RAISE NOTICE '✅ ESTADO FINAL: Todas las tablas sin RLS';
RAISE NOTICE '⚠️ ADVERTENCIA: Sin audit_log RLS, los logs no están protegidos';
RAISE NOTICE '';
