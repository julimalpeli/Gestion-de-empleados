-- Safe migration: Add receives_presentismo column
-- Date: 2026-03-04
-- Purpose: Add ability to track if employee receives presentismo
-- Backward compatibility: Default TRUE to maintain existing behavior

-- Step 1: Check if column already exists (safe idempotent check)
DO $$ 
BEGIN
  -- Add the column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'receives_presentismo'
  ) THEN
    ALTER TABLE employees 
    ADD COLUMN receives_presentismo BOOLEAN DEFAULT true NOT NULL;
    
    RAISE NOTICE 'Column receives_presentismo added to employees table with default=true';
  ELSE
    RAISE NOTICE 'Column receives_presentismo already exists, skipping...';
  END IF;
END $$;

-- Step 2: Add comment to clarify purpose
COMMENT ON COLUMN employees.receives_presentismo IS 
'Controls if this employee receives presentismo bonus (aguinaldo discount/bonus). 
Default true maintains backward compatibility. 
Can be toggled at any time - affects future payroll calculations only.';

-- Step 3: Verify migration
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('presentismo', 'receives_presentismo')
ORDER BY ordinal_position;

-- Migration Summary
-- ==================
-- ✅ Safe: Uses idempotent DO block - won't fail if already exists
-- ✅ Backward compatible: Default TRUE preserves existing employee behavior
-- ✅ Future proof: Can toggle on/off for any employee at any time
-- ✅ No data loss: Existing presentismo amounts unaffected
-- ✅ Isolated: Only affects future payroll calculations via calculatePayroll logic
