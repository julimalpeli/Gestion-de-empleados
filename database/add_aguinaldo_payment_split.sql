-- Migración: Agregar campos para pago de aguinaldo dividido en efectivo y depósito
-- Fecha: 2024-12-18
-- Descripción: Permite registrar el pago del aguinaldo en dos componentes (efectivo y depósito)
--              sin afectar los cálculos de meses sin aguinaldo

-- Agregar campos a payroll_records
ALTER TABLE payroll_records
ADD COLUMN IF NOT EXISTS aguinaldo_pago_efectivo NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS aguinaldo_pago_deposito NUMERIC(10, 2) DEFAULT 0 NOT NULL;

-- Agregar comentarios para documentación
COMMENT ON COLUMN payroll_records.aguinaldo_pago_efectivo IS 'Pago del aguinaldo en efectivo (solo usado en períodos con aguinaldo: junio y diciembre)';
COMMENT ON COLUMN payroll_records.aguinaldo_pago_deposito IS 'Pago del aguinaldo en depósito/banco (solo usado en períodos con aguinaldo: junio y diciembre)';

-- Verificar que los valores por defecto sean correctos para registros existentes
UPDATE payroll_records
SET aguinaldo_pago_efectivo = 0,
    aguinaldo_pago_deposito = 0
WHERE aguinaldo_pago_efectivo IS NULL
   OR aguinaldo_pago_deposito IS NULL;

-- Crear índice para optimizar consultas por período con aguinaldo
CREATE INDEX IF NOT EXISTS idx_payroll_aguinaldo_periods 
ON payroll_records(period) 
WHERE aguinaldo > 0;

-- Nota: Para rollback, ejecutar:
-- ALTER TABLE payroll_records DROP COLUMN IF EXISTS aguinaldo_pago_efectivo;
-- ALTER TABLE payroll_records DROP COLUMN IF EXISTS aguinaldo_pago_deposito;
-- DROP INDEX IF EXISTS idx_payroll_aguinaldo_periods;
