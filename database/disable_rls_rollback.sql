-- =============================================================================
-- SCRIPT DE ROLLBACK - DESHABILITAR RLS
-- =============================================================================
-- ⚠️ USAR SOLO EN EMERGENCIA ⚠️
-- 
-- Este script deshabilita todas las políticas RLS y vuelve al estado anterior
-- en caso de que surjan problemas con las nuevas políticas de seguridad.
-- =============================================================================

-- Deshabilitar RLS en todas las tablas principales
DO $$
BEGIN
    RAISE NOTICE '🚨 INICIANDO ROLLBACK DE RLS - EMERGENCY MODE 🚨';
    
    -- Deshabilitar RLS en cada tabla
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en users';
    
    ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en employees';
    
    ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en payroll_records';
    
    ALTER TABLE vacation_requests DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en vacation_requests';
    
    ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en employee_documents';
    
    ALTER TABLE salary_history DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en salary_history';
    
    ALTER TABLE files DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '❌ RLS deshabilitado en files';
    
    -- Mantener audit_log con RLS (ya estaba habilitado)
    RAISE NOTICE '✅ audit_log mantiene RLS habilitado';
    
END;
$$;

-- Eliminar todas las políticas creadas
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🗑️ ELIMINANDO POLÍTICAS RLS...';
    
    -- Eliminar políticas de users
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de employees
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'employees' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON employees', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de payroll_records
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'payroll_records' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON payroll_records', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de vacation_requests
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'vacation_requests' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vacation_requests', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de employee_documents
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'employee_documents' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON employee_documents', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de salary_history
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'salary_history' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON salary_history', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
    -- Eliminar políticas de files
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'files' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON files', policy_record.policyname);
        RAISE NOTICE '🗑️ Eliminada política: %', policy_record.policyname;
    END LOOP;
    
END;
$$;

-- Eliminar funciones auxiliares (opcional)
DO $$
BEGIN
    RAISE NOTICE '🗑️ ELIMINANDO FUNCIONES AUXILIARES...';
    
    DROP FUNCTION IF EXISTS get_user_role();
    RAISE NOTICE '🗑️ Eliminada función: get_user_role()';
    
    DROP FUNCTION IF EXISTS is_admin_or_manager();
    RAISE NOTICE '🗑️ Eliminada función: is_admin_or_manager()';
    
    DROP FUNCTION IF EXISTS get_current_employee_id();
    RAISE NOTICE '🗑️ Eliminada función: get_current_employee_id()';
    
    DROP FUNCTION IF EXISTS create_vacation_request_as_admin(UUID, DATE, DATE, INTEGER, TEXT, TEXT);
    RAISE NOTICE '🗑️ Eliminada función: create_vacation_request_as_admin()';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Algunas funciones no pudieron eliminarse: %', SQLERRM;
END;
$$;

-- Verificar estado final
DO $$
DECLARE
    rls_count INTEGER;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '📊 VERIFICANDO ESTADO FINAL...';
    
    -- Contar tablas con RLS habilitado
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
        AND rowsecurity = true
        AND tablename IN ('users', 'employees', 'payroll_records', 'vacation_requests', 'employee_documents', 'salary_history', 'files');
    
    -- Contar políticas restantes
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
        AND tablename IN ('users', 'employees', 'payroll_records', 'vacation_requests', 'employee_documents', 'salary_history', 'files');
    
    RAISE NOTICE 'Tablas con RLS habilitado: %', rls_count;
    RAISE NOTICE 'Políticas restantes: %', policy_count;
    
    IF rls_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE '✅ ROLLBACK COMPLETADO - Sistema vuelto al estado anterior';
        RAISE NOTICE '⚠️ ADVERTENCIA: El sistema está ahora SIN PROTECCIÓN RLS';
    ELSE
        RAISE NOTICE '⚠️ ROLLBACK INCOMPLETO - Revisar manualmente';
    END IF;
    
END;
$$;

-- Verificar funcionalidad básica post-rollback
DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO FUNCIONALIDAD POST-ROLLBACK...';
    
    -- Test de acceso a datos
    PERFORM COUNT(*) FROM users;
    RAISE NOTICE '✅ Acceso a users restaurado';
    
    PERFORM COUNT(*) FROM employees;
    RAISE NOTICE '✅ Acceso a employees restaurado';
    
    PERFORM COUNT(*) FROM payroll_records;
    RAISE NOTICE '✅ Acceso a payroll_records restaurado';
    
    PERFORM COUNT(*) FROM vacation_requests;
    RAISE NOTICE '✅ Acceso a vacation_requests restaurado';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR POST-ROLLBACK: %', SQLERRM;
END;
$$;

-- =============================================================================
-- MENSAJE FINAL
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚨════════════════════════════════════════════════════════🚨';
    RAISE NOTICE '    ROLLBACK DE RLS COMPLETADO';
    RAISE NOTICE '';
    RAISE NOTICE '    ⚠️  ESTADO ACTUAL: SIN PROTECCIÓN RLS';
    RAISE NOTICE '    📋 RECOMENDACIÓN: Investigar problema y re-habilitar RLS';
    RAISE NOTICE '    🔧 PRÓXIMOS PASOS: Revisar logs y ajustar políticas';
    RAISE NOTICE '🚨════════════════════════════════════════════════════════🚨';
    RAISE NOTICE '';
END;
$$;
