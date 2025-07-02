-- Script to synchronize vacations_taken field in employees table
-- with actual approved vacation requests

-- First, let's see the current state
SELECT 
  e.id,
  e.name,
  e.vacations_taken as current_vacations_taken,
  COALESCE(SUM(vr.days), 0) as actual_vacations_taken
FROM employees e
LEFT JOIN vacation_requests vr ON e.id = vr.employee_id AND vr.status = 'approved'
GROUP BY e.id, e.name, e.vacations_taken
ORDER BY e.name;

-- Update all employees' vacations_taken to match actual approved vacation requests
UPDATE employees 
SET vacations_taken = (
  SELECT COALESCE(SUM(vr.days), 0)
  FROM vacation_requests vr 
  WHERE vr.employee_id = employees.id 
  AND vr.status = 'approved'
);

-- Verify the update
SELECT 
  e.id,
  e.name,
  e.vacations_taken as updated_vacations_taken,
  COALESCE(SUM(vr.days), 0) as actual_vacations_taken,
  CASE 
    WHEN e.vacations_taken = COALESCE(SUM(vr.days), 0) THEN 'SYNCED' 
    ELSE 'NOT SYNCED' 
  END as status
FROM employees e
LEFT JOIN vacation_requests vr ON e.id = vr.employee_id AND vr.status = 'approved'
GROUP BY e.id, e.name, e.vacations_taken
ORDER BY e.name;

SELECT 'Vacations_taken field synchronized successfully' as result;
