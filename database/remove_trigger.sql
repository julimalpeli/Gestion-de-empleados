-- Eliminar trigger que causa doble cálculo del presentismo
DROP TRIGGER IF EXISTS trigger_calculate_net_total ON payroll_records;
DROP FUNCTION IF EXISTS calculate_net_total();

-- El cálculo se hará solo desde el frontend para evitar duplicaciones
