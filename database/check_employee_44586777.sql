-- Check data for employee with DNI 44586777
-- Run this in Supabase SQL Editor

-- 1. Check employee basic data
SELECT 'Employee data' as check_type,
       id, name, dni, email, job_position, status, start_date,
       white_wage, informal_wage, daily_wage, vacation_days, vacations_taken
FROM employees 
WHERE dni = '44586777';

-- 2. Check if employee has user account
SELECT 'User account' as check_type,
       u.id, u.email, u.name, u.role, u.employee_id, u.is_active
FROM users u
JOIN employees e ON e.id = u.employee_id 
WHERE e.dni = '44586777';

-- 3. Check payroll records for this employee
SELECT 'Payroll records' as check_type,
       pr.id, pr.period, pr.base_days, pr.white_amount, pr.informal_amount,
       pr.net_total, pr.status, pr.processed_date
FROM payroll_records pr
JOIN employees e ON e.id = pr.employee_id 
WHERE e.dni = '44586777'
ORDER BY pr.period DESC
LIMIT 5;

-- 4. Check vacation requests for this employee
SELECT 'Vacation requests' as check_type,
       vr.id, vr.start_date, vr.end_date, vr.days, vr.status, vr.reason
FROM vacation_requests vr
JOIN employees e ON e.id = vr.employee_id 
WHERE e.dni = '44586777'
ORDER BY vr.start_date DESC
LIMIT 5;

-- 5. Check documents for this employee
SELECT 'Documents' as check_type,
       ed.id, ed.category, ed.description, ed.file_name, ed.uploaded_date
FROM employee_documents ed
JOIN employees e ON e.id = ed.employee_id 
WHERE e.dni = '44586777'
ORDER BY ed.uploaded_date DESC
LIMIT 5;
