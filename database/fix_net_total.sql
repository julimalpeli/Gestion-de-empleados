-- Función para calcular automáticamente el net_total
CREATE OR REPLACE FUNCTION calculate_net_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular total neto automáticamente
    NEW.net_total := (
        COALESCE(NEW.white_amount, 0) + 
        COALESCE(NEW.informal_amount, 0) + 
        COALESCE(NEW.holiday_bonus, 0) + 
        COALESCE(NEW.aguinaldo, 0) + 
        COALESCE(NEW.presentismo_amount, 0) +
        COALESCE(NEW.overtime_amount, 0) +
        COALESCE(NEW.bonus_amount, 0) -
        COALESCE(NEW.discounts, 0) -
        COALESCE(NEW.advances, 0)
    );
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute en INSERT y UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_net_total ON payroll_records;
CREATE TRIGGER trigger_calculate_net_total
    BEFORE INSERT OR UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION calculate_net_total();

-- Actualizar registros existentes con net_total en 0
UPDATE payroll_records 
SET net_total = (
    COALESCE(white_amount, 0) + 
    COALESCE(informal_amount, 0) + 
    COALESCE(holiday_bonus, 0) + 
    COALESCE(aguinaldo, 0) + 
    COALESCE(presentismo_amount, 0) +
    COALESCE(overtime_amount, 0) +
    COALESCE(bonus_amount, 0) -
    COALESCE(discounts, 0) -
    COALESCE(advances, 0)
)
WHERE net_total = 0 OR net_total IS NULL;
