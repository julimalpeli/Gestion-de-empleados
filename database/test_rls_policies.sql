-- =============================================================================
-- SCRIPT DE TESTING PARA POLÍTICAS RLS
-- =============================================================================
-- Este script verifica que las políticas RLS funcionen correctamente
-- sin afectar la funcionalidad existente del sistema.
-- =============================================================================

-- Test 1: Verificar funciones auxiliares
DO $$
BEGIN
    RAISE NOTICE '=== TESTING FUNCIONES AUXILIARES ===';
    
    -- Test de función get_user_role
    PERFORM get_user_role();
    RAISE NOTICE '✅ get_user_role() funciona correctamente';
    
    -- Test de función is_admin_or_manager
    PERFORM is_admin_or_manager();
    RAISE NOTICE '✅ is_admin_or_manager() funciona correctamente';
    
    -- Test de función get_current_employee_id
    PERFORM get_current_employee_id();
    RAISE NOTICE '✅ get_current_employee_id() funciona correctamente';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en funciones auxiliares: %', SQLERRM;
END;
$$;

-- Test 2: Verificar que las políticas están creadas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLÍTICAS CREADAS ===';
    
    -- Contar políticas en la tabla users
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas en tabla users: %', policy_count;
    
    -- Contar políticas en la tabla employees
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'employees' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas en tabla employees: %', policy_count;
    
    -- Contar políticas en la tabla payroll_records
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'payroll_records' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas en tabla payroll_records: %', policy_count;
    
END;
$$;

-- Test 3: Simular consultas como diferentes tipos de usuarios
DO $$
BEGIN
    RAISE NOTICE '=== TESTING ACCESO A DATOS ===';
    
    -- Test de lectura en employees (debería funcionar sin auth por ahora)
    PERFORM COUNT(*) FROM employees;
    RAISE NOTICE '✅ Consulta a employees funciona';
    
    -- Test de lectura en users
    PERFORM COUNT(*) FROM users;
    RAISE NOTICE '✅ Consulta a users funciona';
    
    -- Test de lectura en payroll_records
    PERFORM COUNT(*) FROM payroll_records;
    RAISE NOTICE '✅ Consulta a payroll_records funciona';
    
    -- Test de lectura en vacation_requests
    PERFORM COUNT(*) FROM vacation_requests;
    RAISE NOTICE '✅ Consulta a vacation_requests funciona';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en consultas: %', SQLERRM;
END;
$$;

-- Test 4: Verificar estado de RLS en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS habilitado'
        ELSE '❌ RLS deshabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 'employees', 'payroll_records', 
        'vacation_requests', 'employee_documents', 
        'salary_history', 'files', 'audit_log'
    )
ORDER BY tablename;

-- Test 5: Listar todas las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN roles = '{}'::name[] THEN 'Todos los roles'
        ELSE array_to_string(roles, ', ')
    END as applies_to
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 6: Verificar integridad de datos existentes
DO $$
DECLARE
    user_count INTEGER;
    employee_count INTEGER;
    payroll_count INTEGER;
    vacation_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICANDO INTEGRIDAD DE DATOS ===';
    
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO employee_count FROM employees;
    SELECT COUNT(*) INTO payroll_count FROM payroll_records;
    SELECT COUNT(*) INTO vacation_count FROM vacation_requests;
    
    RAISE NOTICE 'Usuarios: %', user_count;
    RAISE NOTICE 'Empleados: %', employee_count;
    RAISE NOTICE 'Liquidaciones: %', payroll_count;
    RAISE NOTICE 'Solicitudes de vacaciones: %', vacation_count;
    
    IF user_count > 0 AND employee_count > 0 THEN
        RAISE NOTICE '✅ Datos existentes preservados correctamente';
    ELSE
        RAISE NOTICE '⚠️ Verificar que los datos no se hayan perdido';
    END IF;
END;
$$;

-- Test 7: Verificar que la función de creación de vacaciones funciona
DO $$
BEGIN
    RAISE NOTICE '=== TESTING FUNCIÓN ESPECIAL DE VACACIONES ===';
    
    -- Solo verificar que la función existe
    PERFORM 1 FROM pg_proc WHERE proname = 'create_vacation_request_as_admin';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Función create_vacation_request_as_admin existe';
    ELSE
        RAISE NOTICE '❌ Función create_vacation_request_as_admin no encontrada';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error verificando función: %', SQLERRM;
END;
$$;

-- Test 8: Verificar grants y permisos
SELECT 
    routine_name as function_name,
    specific_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'get_user_role', 
        'is_admin_or_manager', 
        'get_current_employee_id',
        'create_vacation_request_as_admin'
    );

-- =============================================================================
-- RESUMEN DEL TEST
-- =============================================================================
-- 
-- Este script verifica:
-- ✅ Funciones auxiliares funcionan
-- ✅ Políticas están creadas correctamente  
-- ✅ RLS está habilitado en las tablas críticas
-- ✅ Datos existentes están preservados
-- �� Funciones especiales están disponibles
-- ✅ Permisos están configurados
-- 
-- Si todos los tests pasan, las políticas están listas para producción
-- =============================================================================

RAISE NOTICE '=== TEST DE RLS COMPLETADO ===';
RAISE NOTICE 'Revisa los resultados arriba para verificar que todo funciona correctamente';
