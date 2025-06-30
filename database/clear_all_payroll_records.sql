-- Delete all payroll records to start fresh
-- WARNING: This will permanently delete ALL liquidation records!

-- Show current records before deletion (for backup reference)
SELECT 
  id,
  employee_id,
  period,
  net_total,
  status,
  created_at
FROM payroll_records
ORDER BY created_at DESC;

-- Uncomment the line below to actually delete all records
-- DELETE FROM payroll_records;

-- Reset the sequence if needed (PostgreSQL)
-- SELECT setval('payroll_records_id_seq', 1, false);

-- Verify deletion (should return 0 rows)
-- SELECT COUNT(*) as remaining_records FROM payroll_records;
