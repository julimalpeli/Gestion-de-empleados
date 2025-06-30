-- Sync emails between users and employees tables
-- This ensures that user accounts have the same email as their corresponding employee record

UPDATE users 
SET email = employees.email
FROM employees 
WHERE users.employee_id = employees.id 
  AND employees.email IS NOT NULL 
  AND employees.email != ''
  AND users.email != employees.email;

-- Show the results to verify
SELECT 
  u.id as user_id,
  u.username,
  u.email as user_email,
  e.email as employee_email,
  e.name as employee_name
FROM users u
JOIN employees e ON u.employee_id = e.id
WHERE u.role = 'employee'
ORDER BY e.name;
