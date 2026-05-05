-- Tabla para el historial de sueldos
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  impact_period VARCHAR(7) NOT NULL, -- "2025-02" formato año-mes
  white_wage DECIMAL(12,2) NOT NULL,
  informal_wage DECIMAL(12,2) NOT NULL,
  presentismo DECIMAL(12,2) NOT NULL DEFAULT 0,
  previous_white_wage DECIMAL(12,2),
  previous_informal_wage DECIMAL(12,2),
  previous_presentismo DECIMAL(12,2),
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('aumento', 'correccion')),
  reason TEXT,
  applied_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_salary_history_employee_id ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_effective_date ON salary_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_salary_history_impact_period ON salary_history(impact_period);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_salary_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salary_history_updated_at
    BEFORE UPDATE ON salary_history
    FOR EACH ROW EXECUTE FUNCTION update_salary_history_updated_at();

-- Función para obtener el sueldo vigente para un período específico
CREATE OR REPLACE FUNCTION get_salary_for_period(
    emp_id UUID,
    target_period VARCHAR(7)
)
RETURNS TABLE(
    white_wage DECIMAL(12,2),
    informal_wage DECIMAL(12,2),
    presentismo DECIMAL(12,2),
    base_wage DECIMAL(12,2),
    source VARCHAR(20)
) AS $$
DECLARE
    target_date DATE;
    end_of_month_date DATE;
    history_record RECORD;
    employee_record RECORD;
    year_val INTEGER;
    month_val INTEGER;
BEGIN
    -- Convertir período (YYYY-MM) a fecha del último día del mes
    year_val := (split_part(target_period, '-', 1))::INTEGER;
    month_val := (split_part(target_period, '-', 2))::INTEGER;
    end_of_month_date := (DATE_TRUNC('MONTH', (year_val || '-' || month_val || '-01')::DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Buscar el último cambio que sea efectivo en o antes del último día del período
    SELECT * INTO history_record
    FROM salary_history
    WHERE employee_id = emp_id
      AND effective_date <= end_of_month_date
    ORDER BY effective_date DESC, created_at DESC
    LIMIT 1;

    -- Si encontramos historial, usar esos valores
    IF FOUND THEN
        RETURN QUERY SELECT history_record.white_wage, history_record.informal_wage, history_record.presentismo, history_record.base_wage, 'history'::VARCHAR(20);
    ELSE
        -- Si no hay historial, usar valores actuales del empleado
        SELECT e.white_wage, e.informal_wage, e.presentismo, e.sueldo_base INTO employee_record
        FROM employees e
        WHERE e.id = emp_id;

        IF FOUND THEN
            RETURN QUERY SELECT employee_record.white_wage, employee_record.informal_wage, employee_record.presentismo, employee_record.sueldo_base, 'current'::VARCHAR(20);
        ELSE
            -- Empleado no encontrado
            RETURN QUERY SELECT 0::DECIMAL(12,2), 0::DECIMAL(12,2), 0::DECIMAL(12,2), 0::DECIMAL(12,2), 'not_found'::VARCHAR(20);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para salary_history
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Política para ver historial (usuarios autenticados)
CREATE POLICY "salary_history_view_policy" ON salary_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para insertar historial (solo admins y managers)
CREATE POLICY "salary_history_insert_policy" ON salary_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- Política para actualizar historial (solo admins)
CREATE POLICY "salary_history_update_policy" ON salary_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE salary_history IS 'Historial de cambios de sueldos de empleados';
COMMENT ON COLUMN salary_history.change_type IS 'Tipo de cambio: aumento (incremento salarial real) o correccion (error administrativo)';
COMMENT ON COLUMN salary_history.impact_period IS 'Período desde el cual aplica el cambio, formato YYYY-MM';
COMMENT ON FUNCTION get_salary_for_period IS 'Obtiene el sueldo vigente para un empleado en un período específico';
