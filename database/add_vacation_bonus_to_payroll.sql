-- Plus vacacional: columna independiente de bonus_amount.
-- Registros existentes quedan en 0, por lo que ningún total histórico cambia.
ALTER TABLE payroll_records
    ADD COLUMN IF NOT EXISTS vacation_bonus_amount DECIMAL(12,2) DEFAULT 0;

-- Solo se reescribe la función si el trigger existe en la base (remove_trigger.sql lo elimina).
DO $do$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_net_total'
    ) THEN
        CREATE OR REPLACE FUNCTION calculate_net_total()
        RETURNS TRIGGER AS $fn$
        BEGIN
            NEW.net_total := (
                COALESCE(NEW.white_amount, 0) +
                COALESCE(NEW.informal_amount, 0) +
                COALESCE(NEW.holiday_bonus, 0) +
                COALESCE(NEW.aguinaldo, 0) +
                COALESCE(NEW.presentismo_amount, 0) +
                COALESCE(NEW.overtime_amount, 0) +
                COALESCE(NEW.bonus_amount, 0) +
                COALESCE(NEW.vacation_bonus_amount, 0) -
                COALESCE(NEW.discounts, 0) -
                COALESCE(NEW.advances, 0)
            );

            NEW.updated_at := NOW();
            RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
    END IF;
END
$do$;
