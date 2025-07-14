-- ===================================================
-- VERIFICAR Y CORREGIR ESQUEMA DE AUDIT_LOG
-- ===================================================

-- Verificar si la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_log';

-- Verificar columnas actuales
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_log'
ORDER BY ordinal_position;

-- ===================================================
-- CREAR/RECREAR TABLA AUDIT_LOG CON ESQUEMA CORRECTO
-- ===================================================

-- Eliminar tabla si existe (cuidado en producción)
DROP TABLE IF EXISTS audit_log CASCADE;

-- Crear tabla con esquema correcto
CREATE TABLE audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ===================================================
-- POLÍTICAS RLS PARA AUDIT_LOG
-- ===================================================

-- Habilitar RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Audit log visible to admins" ON audit_log;
DROP POLICY IF EXISTS "Audit log insertable by system" ON audit_log;

-- Solo admins pueden ver logs de auditoría
CREATE POLICY "Audit log visible to admins" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- El sistema puede insertar logs (sin restricciones para triggers y servicios)
CREATE POLICY "Audit log insertable by system" ON audit_log
    FOR INSERT WITH CHECK (true);

-- ===================================================
-- COMENTARIOS Y VERIFICACIÓN FINAL
-- ===================================================

COMMENT ON TABLE audit_log IS 'Registro de auditoría para trazabilidad de cambios';
COMMENT ON COLUMN audit_log.table_name IS 'Nombre de la tabla afectada';
COMMENT ON COLUMN audit_log.record_id IS 'ID del registro afectado';
COMMENT ON COLUMN audit_log.action IS 'Tipo de acción realizada';
COMMENT ON COLUMN audit_log.old_values IS 'Valores anteriores (JSON)';
COMMENT ON COLUMN audit_log.new_values IS 'Valores nuevos (JSON)';
COMMENT ON COLUMN audit_log.changed_by IS 'Usuario que realizó el cambio';
COMMENT ON COLUMN audit_log.changed_at IS 'Timestamp del cambio';

-- Verificar que todo se creó correctamente
SELECT 
    'Tabla creada' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_log';

-- Verificar foreign key
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'audit_log';

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audit_log';
