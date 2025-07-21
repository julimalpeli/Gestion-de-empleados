-- Script para actualizar el cálculo de vacaciones al sistema acumulativo
-- Ejecutar en Supabase SQL Editor

-- 1. Mostrar datos actuales antes del cambio
SELECT 'ANTES DEL CAMBIO' as status,
       name, 
       dni,
       start_date,
       EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER as years_worked,
       vacation_days as current_vacation_days,
       GREATEST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER, 0) * 14 as new_vacation_days
FROM employees 
WHERE status = 'active'
ORDER BY start_date;

-- 2. Actualizar todos los empleados con el nuevo cálculo acumulativo
UPDATE employees 
SET vacation_days = GREATEST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER, 0) * 14,
    updated_at = NOW()
WHERE status = 'active';

-- 3. Mostrar datos después del cambio
SELECT 'DESPUÉS DEL CAMBIO' as status,
       name, 
       dni,
       start_date,
       EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER as years_worked,
       vacation_days as updated_vacation_days,
       vacations_taken,
       (vacation_days - vacations_taken) as available_days
FROM employees 
WHERE status = 'active'
ORDER BY start_date;

-- 4. Verificación específica para empleada DNI 44586777
SELECT 'VERIFICACIÓN DNI 44586777' as check_type,
       name,
       dni,
       start_date,
       EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER as years_worked,
       EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date))::INTEGER as months_worked,
       vacation_days,
       vacations_taken,
       (vacation_days - vacations_taken) as available_days
FROM employees 
WHERE dni = '44586777';

SELECT 'Cálculo de vacaciones actualizado al sistema acumulativo (14 días por año)' as result;
