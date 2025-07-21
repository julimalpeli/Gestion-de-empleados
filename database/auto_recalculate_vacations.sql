-- Actualizar trigger de empleados para recalcular vacaciones automáticamente
CREATE OR REPLACE FUNCTION update_daily_wage()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular salario diario: (sueldo_blanco + informal) / 30
    NEW.daily_wage := ROUND((NEW.white_wage + NEW.informal_wage) / 30.0, 2);

    -- Calcular días de vacaciones según antigüedad (sistema acumulativo: 14 días por año)
    NEW.vacation_days := GREATEST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.start_date))::INTEGER, 0) * 14;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para recalcular vacaciones de todos los empleados activos
CREATE OR REPLACE FUNCTION recalculate_all_vacations()
RETURNS void AS $$
BEGIN
    UPDATE employees
    SET vacation_days = GREATEST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER, 0) * 14,
    updated_at = NOW()
    WHERE status = 'active';

    RAISE NOTICE 'Vacaciones recalculadas para todos los empleados activos';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar recálculo automático para empleados existentes
SELECT recalculate_all_vacations();
