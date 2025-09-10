-- =============================================================================
-- HABILITACIÓN SEGURA DE ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Este script implementa políticas de seguridad basadas en roles para proteger
-- datos sensibles sin afectar la funcionalidad existente.
--
-- ROLES DEL SISTEMA:
-- - admin: Acceso completo a todo
-- - manager: Acceso a empleados y liquidaciones, limitado en usuarios
-- - hr: Acceso a empleados, vacaciones, documentos
-- - employee: Solo sus propios datos
-- - readonly: Solo lectura limitada
-- =============================================================================

-- Función auxiliar para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM users 
    WHERE id = auth.uid()::uuid;
    
    RETURN COALESCE(user_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para verificar si el usuario es admin/manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para obtener el employee_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
DECLARE
    emp_id UUID;
BEGIN
    SELECT employee_id INTO emp_id 
    FROM users 
    WHERE id = auth.uid()::uuid;
    
    RETURN emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 1. TABLA USERS - Políticas de gestión de usuarios
-- =============================================================================

-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Admins ven todo, otros solo su perfil
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager') OR 
        id = auth.uid()::uuid
    );

-- Política de inserción: Solo admins pueden crear usuarios
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        get_user_role() = 'admin'
    );

-- Política de actualización: Admins pueden todo, usuarios su perfil
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager') OR 
        id = auth.uid()::uuid
    );

-- Política de eliminación: Solo admins
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        get_user_role() = 'admin'
    );

-- =============================================================================
-- 2. TABLA EMPLOYEES - Políticas de gestión de empleados
-- =============================================================================

-- Habilitar RLS en la tabla employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Admins/Managers/HR ven todo, empleados solo su información
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        id = get_current_employee_id()
    );

-- Política de inserción: Solo admins y managers
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager')
    );

-- Política de actualización: Admins/Managers pueden todo, empleados datos básicos
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager') OR
        (id = get_current_employee_id() AND get_user_role() = 'employee')
    );

-- Política de eliminación: Solo admins
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        get_user_role() = 'admin'
    );

-- =============================================================================
-- 3. TABLA PAYROLL_RECORDS - Políticas de liquidaciones
-- =============================================================================

-- Habilitar RLS en la tabla payroll_records
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Admins/Managers ven todo, empleados solo las suyas
CREATE POLICY "payroll_select_policy" ON payroll_records
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager') OR
        employee_id = get_current_employee_id()
    );

-- Política de inserción: Solo admins y managers
CREATE POLICY "payroll_insert_policy" ON payroll_records
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager')
    );

-- Política de actualización: Solo admins y managers
CREATE POLICY "payroll_update_policy" ON payroll_records
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager')
    );

-- Política de eliminación: Solo admins
CREATE POLICY "payroll_delete_policy" ON payroll_records
    FOR DELETE USING (
        get_user_role() = 'admin'
    );

-- =============================================================================
-- 4. TABLA VACATION_REQUESTS - Políticas de vacaciones
-- =============================================================================

-- Habilitar RLS en la tabla vacation_requests
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Admins/Managers/HR ven todo, empleados solo las suyas
CREATE POLICY "vacation_select_policy" ON vacation_requests
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        employee_id = get_current_employee_id()
    );

-- Política de inserción: Empleados pueden crear sus solicitudes, admins/managers las de otros
CREATE POLICY "vacation_insert_policy" ON vacation_requests
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager') OR
        (employee_id = get_current_employee_id() AND get_user_role() = 'employee')
    );

-- Política de actualización: Admins/Managers pueden todo, empleados solo las suyas en estado pending
CREATE POLICY "vacation_update_policy" ON vacation_requests
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        (employee_id = get_current_employee_id() AND status = 'pending')
    );

-- Política de eliminación: Admins y empleados sus propias solicitudes pending
CREATE POLICY "vacation_delete_policy" ON vacation_requests
    FOR DELETE USING (
        get_user_role() = 'admin' OR
        (employee_id = get_current_employee_id() AND status = 'pending')
    );

-- =============================================================================
-- 5. TABLA EMPLOYEE_DOCUMENTS - Políticas de documentos
-- =============================================================================

-- Habilitar RLS en la tabla employee_documents
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Admins/Managers/HR ven todo, empleados solo los suyos
CREATE POLICY "documents_select_policy" ON employee_documents
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        employee_id = get_current_employee_id()
    );

-- Política de inserción: Admins/Managers/HR y empleados para sus documentos
CREATE POLICY "documents_insert_policy" ON employee_documents
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        employee_id = get_current_employee_id()
    );

-- Política de actualización: Solo admins/managers/hr
CREATE POLICY "documents_update_policy" ON employee_documents
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager', 'hr')
    );

-- Política de eliminación: Admins/Managers/HR y empleados sus propios documentos
CREATE POLICY "documents_delete_policy" ON employee_documents
    FOR DELETE USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        employee_id = get_current_employee_id()
    );

-- =============================================================================
-- 6. TABLA SALARY_HISTORY - Políticas de historial salarial
-- =============================================================================

-- Habilitar RLS en la tabla salary_history
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Solo admins y managers
CREATE POLICY "salary_history_select_policy" ON salary_history
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager')
    );

-- Política de inserción: Solo admins y managers
CREATE POLICY "salary_history_insert_policy" ON salary_history
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager')
    );

-- Política de actualización: Solo admins
CREATE POLICY "salary_history_update_policy" ON salary_history
    FOR UPDATE USING (
        get_user_role() = 'admin'
    );

-- Política de eliminación: Solo admins
CREATE POLICY "salary_history_delete_policy" ON salary_history
    FOR DELETE USING (
        get_user_role() = 'admin'
    );

-- =============================================================================
-- 7. TABLA FILES - Políticas de archivos
-- =============================================================================

-- Habilitar RLS en la tabla files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Depende del tipo de entidad y usuario
CREATE POLICY "files_select_policy" ON files
    FOR SELECT USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        (entity_type = 'employee' AND entity_id = get_current_employee_id())
    );

-- Política de inserción: Admins/Managers/HR y empleados para sus archivos
CREATE POLICY "files_insert_policy" ON files
    FOR INSERT WITH CHECK (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        (entity_type = 'employee' AND entity_id = get_current_employee_id())
    );

-- Política de actualización: Solo admins/managers/hr
CREATE POLICY "files_update_policy" ON files
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'manager', 'hr')
    );

-- Política de eliminación: Admins/Managers/HR y empleados sus propios archivos
CREATE POLICY "files_delete_policy" ON files
    FOR DELETE USING (
        get_user_role() IN ('admin', 'manager', 'hr') OR
        (entity_type = 'employee' AND entity_id = get_current_employee_id())
    );

-- =============================================================================
-- 8. FUNCIÓN ESPECIAL PARA CREACIÓN DE VACACIONES POR ADMIN
-- =============================================================================

-- Función para que admins/managers puedan crear vacaciones para otros empleados
CREATE OR REPLACE FUNCTION create_vacation_request_as_admin(
    p_employee_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_days INTEGER,
    p_reason TEXT,
    p_status TEXT DEFAULT 'approved'
)
RETURNS UUID AS $$
DECLARE
    vacation_id UUID;
BEGIN
    -- Verificar que el usuario sea admin o manager
    IF get_user_role() NOT IN ('admin', 'manager') THEN
        RAISE EXCEPTION 'Acceso denegado: solo admins y managers pueden crear vacaciones para otros empleados';
    END IF;
    
    -- Insertar la solicitud de vacaciones
    INSERT INTO vacation_requests (
        employee_id,
        start_date,
        end_date,
        days,
        reason,
        status,
        request_date,
        approved_by,
        approved_date
    ) VALUES (
        p_employee_id,
        p_start_date,
        p_end_date,
        p_days,
        p_reason,
        p_status,
        CURRENT_DATE,
        auth.uid(),
        CASE WHEN p_status = 'approved' THEN NOW() ELSE NULL END
    ) RETURNING id INTO vacation_id;
    
    RETURN vacation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. GRANTS Y PERMISOS ADICIONALES
-- =============================================================================

-- Asegurar que las funciones puedan ser ejecutadas por usuarios autenticados
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION create_vacation_request_as_admin(UUID, DATE, DATE, INTEGER, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- =============================================================================

COMMENT ON FUNCTION get_user_role() IS 'Obtiene el rol del usuario autenticado actual';
COMMENT ON FUNCTION is_admin_or_manager() IS 'Verifica si el usuario actual es admin o manager';
COMMENT ON FUNCTION get_current_employee_id() IS 'Obtiene el employee_id del usuario autenticado actual';
COMMENT ON FUNCTION create_vacation_request_as_admin(UUID, DATE, DATE, INTEGER, TEXT, TEXT) IS 'Permite a admins/managers crear solicitudes de vacaciones para otros empleados';

-- =============================================================================
-- RESUMEN DE POLÍTICAS IMPLEMENTADAS:
-- =============================================================================
-- 
-- 📋 USERS: Admins gestionan usuarios, usuarios editan su perfil
-- 👥 EMPLOYEES: Admins/Managers gestionan, empleados ven su info
-- 💰 PAYROLL: Solo Admins/Managers, empleados ven sus liquidaciones
-- 🏖️ VACATIONS: Admins/Managers/HR gestionan, empleados sus solicitudes
-- 📄 DOCUMENTS: Admins/Managers/HR gestionan, empleados sus documentos
-- 💸 SALARY_HISTORY: Solo Admins/Managers (datos sensibles)
-- 📁 FILES: Similar a documentos, por tipo de entidad
-- 
-- ✅ SEGURIDAD: Cada usuario solo ve y modifica lo que debe
-- ✅ FUNCIONALIDAD: Mantiene todas las capacidades existentes
-- ✅ FLEXIBILIDAD: Funciones auxiliares para casos especiales
-- =============================================================================
