-- Cádiz Bar de Tapas - Database Schema
-- Este archivo contiene el esquema completo para Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ===========================================
-- USERS TABLE (Authentication and Roles)
-- ===========================================
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'hr', 'employee', 'readonly')) NOT NULL DEFAULT 'employee',
    employee_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    password_hash TEXT NOT NULL, -- Para autenticación custom
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- EMPLOYEES TABLE
-- ===========================================
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    white_wage DECIMAL(12,2) NOT NULL DEFAULT 0, -- Sueldo en blanco mensual
    informal_wage DECIMAL(12,2) NOT NULL DEFAULT 0, -- Sueldo informal mensual
    daily_wage DECIMAL(10,2) NOT NULL DEFAULT 0, -- Calculado automáticamente
    presentismo DECIMAL(10,2) NOT NULL DEFAULT 0, -- Monto presentismo
    loses_presentismo BOOLEAN DEFAULT false, -- Si pierde presentismo este período
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    start_date DATE NOT NULL, -- Fecha de ingreso
    vacation_days INTEGER DEFAULT 14, -- Días de vacaciones anuales (calculado por antigüedad)
    vacations_taken INTEGER DEFAULT 0, -- Días tomados en el año actual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PAYROLL RECORDS TABLE
-- ===========================================
CREATE TABLE payroll_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- "YYYY-MM" formato
    base_days INTEGER NOT NULL DEFAULT 30, -- Días base trabajados
    holiday_days INTEGER DEFAULT 0, -- Días feriados trabajados
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Sueldo base calculado
    holiday_bonus DECIMAL(12,2) DEFAULT 0, -- Pago doble por feriados
    aguinaldo DECIMAL(12,2) DEFAULT 0, -- SAC cuando corresponda
    discounts DECIMAL(10,2) DEFAULT 0, -- Descuentos varios
    advances DECIMAL(10,2) DEFAULT 0, -- Adelantos de sueldo
    white_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Monto en blanco
    informal_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Monto informal
    presentismo_amount DECIMAL(10,2) DEFAULT 0, -- Monto presentismo aplicado
    overtime_hours DECIMAL(5,2) DEFAULT 0, -- Horas extra trabajadas
    overtime_amount DECIMAL(10,2) DEFAULT 0, -- Pago por horas extra
    bonus_amount DECIMAL(10,2) DEFAULT 0, -- Bonos adicionales
    net_total DECIMAL(12,2) NOT NULL DEFAULT 0, -- Total neto a pagar
    status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'processed')) DEFAULT 'draft',
    processed_date TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    notes TEXT, -- Observaciones adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados por empleado y período
    UNIQUE(employee_id, period)
);

-- ===========================================
-- VACATION REQUESTS TABLE
-- ===========================================
CREATE TABLE vacation_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL, -- Días solicitados
    reason TEXT NOT NULL, -- Motivo de la solicitud
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    request_date DATE DEFAULT CURRENT_DATE, -- Fecha de solicitud
    approved_by UUID REFERENCES users(id), -- Quién aprobó/rechazó
    approved_date TIMESTAMP WITH TIME ZONE, -- Cuándo se aprobó/rechazó
    rejection_reason TEXT, -- Motivo del rechazo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (days > 0)
);

-- ===========================================
-- FILES TABLE (Para documentos)
-- ===========================================
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(20) CHECK (entity_type IN ('employee', 'payroll', 'vacation')) NOT NULL,
    entity_id UUID NOT NULL, -- ID del empleado, liquidación, etc.
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL, -- Path en storage
    category VARCHAR(50), -- Categoría del archivo
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- AUDIT LOG TABLE (Para trazabilidad)
-- ===========================================
CREATE TABLE audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- TRIGGERS para updated_at automático
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas principales
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vacation_requests_updated_at BEFORE UPDATE ON vacation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TRIGGERS para cálculos automáticos
-- ===========================================

-- Calcular sueldo diario automáticamente
CREATE OR REPLACE FUNCTION calculate_daily_wage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.daily_wage = ROUND((NEW.white_wage + NEW.informal_wage) / 30, 2);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_daily_wage 
    BEFORE INSERT OR UPDATE OF white_wage, informal_wage ON employees 
    FOR EACH ROW EXECUTE FUNCTION calculate_daily_wage();

-- Calcular días de vacaciones por antigüedad
CREATE OR REPLACE FUNCTION calculate_vacation_days()
RETURNS TRIGGER AS $$
DECLARE
    years_worked INTEGER;
BEGIN
    -- Calcular años de antigüedad
    years_worked = EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.start_date));
    
    -- Asignar días según antigüedad
    IF years_worked >= 20 THEN
        NEW.vacation_days = 35;
    ELSIF years_worked >= 10 THEN
        NEW.vacation_days = 28;
    ELSIF years_worked >= 5 THEN
        NEW.vacation_days = 21;
    ELSE
        NEW.vacation_days = 14;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_vacation_days 
    BEFORE INSERT OR UPDATE OF start_date ON employees 
    FOR EACH ROW EXECUTE FUNCTION calculate_vacation_days();

-- Calcular días de solicitud de vacaciones
CREATE OR REPLACE FUNCTION calculate_vacation_request_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days = (NEW.end_date - NEW.start_date) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_vacation_request_days 
    BEFORE INSERT OR UPDATE OF start_date, end_date ON vacation_requests 
    FOR EACH ROW EXECUTE FUNCTION calculate_vacation_request_days();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para empleados (todos pueden ver, solo admin/manager/hr pueden modificar)
CREATE POLICY employees_select_policy ON employees FOR SELECT USING (true);
CREATE POLICY employees_insert_policy ON employees FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
        AND users.is_active = true
    )
);
CREATE POLICY employees_update_policy ON employees FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
        AND users.is_active = true
    )
);
CREATE POLICY employees_delete_policy ON employees FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.is_active = true
    )
);

-- Políticas para liquidaciones
CREATE POLICY payroll_select_policy ON payroll_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
            users.role IN ('admin', 'manager', 'hr', 'readonly') 
            OR (users.role = 'employee' AND users.employee_id = payroll_records.employee_id)
        )
        AND users.is_active = true
    )
);

CREATE POLICY payroll_insert_policy ON payroll_records FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'hr')
        AND users.is_active = true
    )
);

CREATE POLICY payroll_update_policy ON payroll_records FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
            users.role IN ('admin', 'manager', 'hr')
            OR (users.role = 'admin' AND status = 'processed') -- Solo admin puede editar procesadas
        )
        AND users.is_active = true
    )
);

-- ===========================================
-- ÍNDICES para performance
-- ===========================================
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_start_date ON employees(start_date);
CREATE INDEX idx_payroll_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_period ON payroll_records(period);
CREATE INDEX idx_payroll_status ON payroll_records(status);
CREATE INDEX idx_vacation_employee_id ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_status ON vacation_requests(status);
CREATE INDEX idx_vacation_dates ON vacation_requests(start_date, end_date);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ===========================================
-- DATOS INICIALES (Usuarios y ejemplos)
-- ===========================================

-- Insertar usuarios de sistema (las contraseñas se hashearán en la aplicación)
INSERT INTO users (username, email, name, role, password_hash) VALUES
('admin', 'admin@cadizbartapas.com', 'Administrador', 'admin', '$2b$10$dummy.hash.for.admin123'),
('gerente', 'gerente@cadizbartapas.com', 'María López', 'manager', '$2b$10$dummy.hash.for.gerente123'),
('rrhh', 'rrhh@cadizbartapas.com', 'Ana García', 'hr', '$2b$10$dummy.hash.for.rrhh123'),
('auditor', 'auditor@cadizbartapas.com', 'Carlos Auditor', 'readonly', '$2b$10$dummy.hash.for.auditor123');

-- Insertar empleados de ejemplo (datos reales para migrar desde mock)
INSERT INTO employees (name, position, white_wage, informal_wage, presentismo, start_date, vacations_taken) VALUES
('Juan Pérez', 'Cocinero', 300000, 150000, 25000, '2023-01-15', 5),
('María González', 'Mesera', 240000, 120000, 20000, '2019-03-20', 7),
('Carlos López', 'Cajero', 285000, 120000, 22000, '2012-11-10', 8),
('Ana Martínez', 'Ayudante de Cocina', 210000, 120000, 18000, '2023-06-01', 0),
('Luis Fernández', 'Encargado', 525000, 225000, 35000, '2000-05-22', 10);

-- Actualizar employee_id en usuarios para empleados
UPDATE users SET employee_id = (SELECT id FROM employees WHERE name = 'Juan Pérez') WHERE username = 'employee';

-- ===========================================
-- FUNCIONES ÚTILES
-- ===========================================

-- Función para obtener empleados activos
CREATE OR REPLACE FUNCTION get_active_employees()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    position VARCHAR,
    daily_wage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.name, e.position, e.daily_wage
    FROM employees e
    WHERE e.status = 'active'
    ORDER BY e.name;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular aguinaldo
CREATE OR REPLACE FUNCTION calculate_aguinaldo(
    emp_id UUID,
    calculation_period VARCHAR -- "YYYY-1" o "YYYY-2"
)
RETURNS TABLE (
    employee_id UUID,
    employee_name VARCHAR,
    corresponds BOOLEAN,
    amount DECIMAL,
    reason TEXT
) AS $$
DECLARE
    emp_record employees%ROWTYPE;
    year_part INTEGER;
    semester INTEGER;
    semester_start DATE;
    semester_end DATE;
    best_salary DECIMAL;
    months_worked INTEGER;
    full_aguinaldo DECIMAL;
    final_amount DECIMAL;
    corresponds_bool BOOLEAN;
    reason_text TEXT;
BEGIN
    -- Obtener datos del empleado
    SELECT * INTO emp_record FROM employees WHERE id = emp_id;
    
    IF emp_record.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Parsear período
    year_part := SPLIT_PART(calculation_period, '-', 1)::INTEGER;
    semester := SPLIT_PART(calculation_period, '-', 2)::INTEGER;
    
    -- Determinar fechas del semestre
    IF semester = 1 THEN
        semester_start := MAKE_DATE(year_part, 1, 1);
        semester_end := MAKE_DATE(year_part, 6, 30);
    ELSE
        semester_start := MAKE_DATE(year_part, 7, 1);
        semester_end := MAKE_DATE(year_part, 12, 31);
    END IF;
    
    -- Verificar si trabajó en el período
    IF emp_record.start_date > semester_end THEN
        corresponds_bool := false;
        final_amount := 0;
        reason_text := 'No trabajó en este período';
    ELSE
        corresponds_bool := true;
        best_salary := emp_record.white_wage + emp_record.informal_wage;
        full_aguinaldo := (best_salary / 12) * 6; -- 6 meses
        
        -- Calcular proporcional si empezó durante el semestre
        IF emp_record.start_date > semester_start THEN
            months_worked := EXTRACT(MONTH FROM AGE(semester_end, emp_record.start_date)) + 1;
            final_amount := (best_salary / 12) * months_worked;
            reason_text := 'Aguinaldo proporcional (' || months_worked || ' meses)';
        ELSE
            final_amount := full_aguinaldo;
            reason_text := 'Aguinaldo completo';
        END IF;
    END IF;
    
    RETURN QUERY SELECT emp_id, emp_record.name, corresponds_bool, final_amount, reason_text;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- COMENTARIOS FINALES
-- ===========================================

COMMENT ON TABLE employees IS 'Tabla principal de empleados del bar de tapas';
COMMENT ON TABLE payroll_records IS 'Registros de liquidaciones de sueldos';
COMMENT ON TABLE vacation_requests IS 'Solicitudes de vacaciones de empleados';
COMMENT ON TABLE users IS 'Usuarios del sistema con roles y permisos';
COMMENT ON TABLE files IS 'Archivos adjuntos (documentos, recibos, etc.)';
COMMENT ON TABLE audit_log IS 'Log de auditoría para trazabilidad de cambios';

-- Finalizar
SELECT 'Database schema created successfully!' as result;
