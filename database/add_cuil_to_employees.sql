-- Add CUIL column to employees table
-- ✅ Applied to Supabase (project: wfeoihoxpnzdfwzohzyo)
-- CUIL is the primary identifier for payroll receipt matching (more robust than DNI)

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS cuil VARCHAR(20);

-- Partial unique index (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_cuil
    ON employees(cuil)
    WHERE cuil IS NOT NULL;
