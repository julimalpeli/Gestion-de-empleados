-- Agregar campo DNI a la tabla employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dni VARCHAR(8) UNIQUE;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN employees.dni IS 'Documento Nacional de Identidad del empleado (sin puntos, máximo 8 dígitos)';

-- Crear índice para búsquedas rápidas por DNI
CREATE INDEX IF NOT EXISTS idx_employees_dni ON employees(dni);

-- Actualizar empleados existentes con DNIs de ejemplo (opcional)
UPDATE employees SET dni = '12345678' WHERE name = 'Juan Pérez' AND dni IS NULL;
UPDATE employees SET dni = '23456789' WHERE name = 'María González' AND dni IS NULL;
UPDATE employees SET dni = '34567890' WHERE name = 'Carlos López' AND dni IS NULL;
UPDATE employees SET dni = '45678901' WHERE name = 'Ana Martínez' AND dni IS NULL;
UPDATE employees SET dni = '56789012' WHERE name = 'Luis Fernández' AND dni IS NULL;
