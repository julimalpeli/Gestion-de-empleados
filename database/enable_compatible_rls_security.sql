-- =============================================================================
-- POLÍTICAS RLS COMPATIBLES CON SISTEMA DE AUTENTICACIÓN HÍBRIDO
-- =============================================================================
-- Este script implementa RLS que funciona con:
-- 1. Supabase Auth (auth.uid()) 
-- 2. Tabla users personalizada (mapeo por email)
-- 3. Sistema de roles personalizado
-- =============================================================================

-- Función auxiliar para obtener el email del usuario autenticado
CREATE OR REPLACE FUNCTION get_auth_user_email()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para obtener el rol del usuario actual (compatible con sistema híbrido)
CREATE OR REPLACE FUNCTION get_user_role_by_email()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Obtener email del usuario autenticado
    user_email := get_auth_user_email();
    
    IF user_email IS NULL THEN
        RETURN 'guest';
    END IF;
    
    -- Buscar rol en tabla users por email
    SELECT role INTO user_role 
    FROM users 
    WHERE email = user_email 
      AND is_active = true;
    
    RETURN COALESCE(user_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para verificar si el usuario es admin/manager
CREATE OR REPLACE FUNCTION is_admin_or_manager_by_email()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role_by_email() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para obtener el employee_id del usuario actual por email
CREATE OR REPLACE FUNCTION get_current_employee_id_by_email()
RETURNS UUID AS $$
DECLARE
    emp_id UUID;
    user_email TEXT;
BEGIN
    user_email := get_auth_user_email();
    
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT employee_id INTO emp_id 
    FROM users 
    WHERE email = user_email 
      AND is_active = true;
    
    RETURN emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para verificar si el usuario actual puede ver los datos de un empleado específico
CREATE OR REPLACE FUNCTION can_access_employee_data(target_employee_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_role TEXT;
    current_employee_id UUID;
BEGIN
    current_role := get_user_role_by_email();
    current_employee_id := get_current_employee_id_by_email();
    
    -- Admins, managers y HR pueden ver todo
    IF current_role IN ('admin', 'manager', 'hr') THEN
        RETURN TRUE;
    END IF;
    
    -- Empleados solo pueden ver sus propios datos
    IF current_role = 'employee' AND current_employee_id = target_employee_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- POLÍTICAS RLS COMPATIBLES
-- =============================================================================

-- 1. TABLA USERS - Políticas compatibles con email lookup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Política de lectura: Admins ven todo, otros solo su perfil (por email)
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        get_user_role_by_email() IN ('admin', 'manager') OR 
        email = get_auth_user_email()
    );

-- Política de inserción: Solo admins pueden crear usuarios
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        get_user_role_by_email() = 'admin'
    );

-- Política de actualización: Admins pueden todo, usuarios su perfil
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        get_user_role_by_email() IN ('admin', 'manager') OR 
        email = get_auth_user_email()
    );

-- Política de eliminación: Solo admins
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        get_user_role_by_email() = 'admin'
    );

-- 2. TABLA EMPLOYEES - Políticas compatibles
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

-- Política de lectura usando la función auxiliar
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (
        can_access_employee_data(id)
    );

-- Política de inserción: Solo admins y managers
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (
        get_user_role_by_email() IN ('admin', 'manager')
    );

-- Política de actualización: Admins/Managers pueden todo, empleados datos básicos
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        get_user_role_by_email() IN ('admin', 'manager') OR
        (id = get_current_employee_id_by_email() AND get_user_role_by_email() = 'employee')
    );

-- Política de eliminación: Solo admins
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        get_user_role_by_email() = 'admin'
    );

-- 3. TABLA PAYROLL_RECORDS - Políticas compatibles
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "payroll_select_policy" ON payroll_records;
DROP POLICY IF EXISTS "payroll_insert_policy" ON payroll_records;
DROP POLICY IF EXISTS "payroll_update_policy" ON payroll_records;
DROP POLICY IF EXISTS "payroll_delete_policy" ON payroll_records;

-- Política de lectura: Admins/Managers ven todo, empleados solo las suyas
CREATE POLICY "payroll_select_policy" ON payroll_records
    FOR SELECT USING (
        get_user_role_by_email() IN ('admin', 'manager') OR
        employee_id = get_current_employee_id_by_email()
    );

-- Política de inserción: Solo admins y managers
CREATE POLICY "payroll_insert_policy" ON payroll_records
    FOR INSERT WITH CHECK (
        get_user_role_by_email() IN ('admin', 'manager')
    );

-- Política de actualización: Solo admins y managers
CREATE POLICY "payroll_update_policy" ON payroll_records
    FOR UPDATE USING (
        get_user_role_by_email() IN ('admin', 'manager')
    );

-- Política de eliminación: Solo admins
CREATE POLICY "payroll_delete_policy" ON payroll_records
    FOR DELETE USING (
        get_user_role_by_email() = 'admin'
    );

-- 4. TABLA VACATION_REQUESTS - Políticas compatibles
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "vacation_select_policy" ON vacation_requests;
DROP POLICY IF EXISTS "vacation_insert_policy" ON vacation_requests;
DROP POLICY IF EXISTS "vacation_update_policy" ON vacation_requests;
DROP POLICY IF EXISTS "vacation_delete_policy" ON vacation_requests;

-- Política de lectura: Admins/Managers/HR ven todo, empleados solo las suyas
CREATE POLICY "vacation_select_policy" ON vacation_requests
    FOR SELECT USING (
        get_user_role_by_email() IN ('admin', 'manager', 'hr') OR
        employee_id = get_current_employee_id_by_email()
    );

-- Política de inserción: Empleados pueden crear sus solicitudes, admins/managers las de otros
CREATE POLICY "vacation_insert_policy" ON vacation_requests
    FOR INSERT WITH CHECK (
        get_user_role_by_email() IN ('admin', 'manager') OR
        (employee_id = get_current_employee_id_by_email() AND get_user_role_by_email() = 'employee')
    );

-- Política de actualización: Admins/Managers pueden todo, empleados solo las suyas en estado pending
CREATE POLICY "vacation_update_policy" ON vacation_requests
    FOR UPDATE USING (
        get_user_role_by_email() IN ('admin', 'manager', 'hr') OR
        (employee_id = get_current_employee_id_by_email() AND status = 'pending')
    );

-- Política de eliminación: Admins y empleados sus propias solicitudes pending
CREATE POLICY "vacation_delete_policy" ON vacation_requests
    FOR DELETE USING (
        get_user_role_by_email() = 'admin' OR
        (employee_id = get_current_employee_id_by_email() AND status = 'pending')
    );

-- =============================================================================
-- GRANTS Y PERMISOS
-- =============================================================================

-- Asegurar que las funciones puedan ser ejecutadas por usuarios autenticados
GRANT EXECUTE ON FUNCTION get_auth_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_manager_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_employee_id_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_employee_data(UUID) TO authenticated;

-- =============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================================================

COMMENT ON FUNCTION get_auth_user_email() IS 'Obtiene el email del usuario autenticado desde JWT';
COMMENT ON FUNCTION get_user_role_by_email() IS 'Obtiene el rol del usuario por email (compatible con sistema híbrido)';
COMMENT ON FUNCTION is_admin_or_manager_by_email() IS 'Verifica si el usuario actual es admin o manager (por email)';
COMMENT ON FUNCTION get_current_employee_id_by_email() IS 'Obtiene el employee_id del usuario autenticado por email';
COMMENT ON FUNCTION can_access_employee_data(UUID) IS 'Verifica si el usuario puede acceder a datos de un empleado específico';

-- =============================================================================
-- RESUMEN:
-- ✅ Políticas RLS compatibles con autenticación híbrida
-- ✅ Mapeo por email en lugar de auth.uid()
-- ✅ Sistema de roles preservado
-- ✅ Funcionalidad mantenida
-- =============================================================================
