-- Actualizar tabla users para incluir needs_password_change
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT false;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN users.needs_password_change IS 'Indica si el usuario debe cambiar su contraseña en el próximo login';

-- Actualizar usuarios existentes de empleados para que cambien contraseña
UPDATE users 
SET needs_password_change = true 
WHERE role = 'employee' AND needs_password_change IS NULL;
