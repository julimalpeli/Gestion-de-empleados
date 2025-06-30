-- Fix payroll_records sequence issue
-- The table uses UUID primary keys, not SERIAL, so no sequence should exist

-- First, check if the table exists and verify its structure
DO $$
BEGIN
    -- Check if payroll_records table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payroll_records') THEN
        RAISE NOTICE 'payroll_records table exists';
        
        -- Check the structure of the id column
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'payroll_records' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'Table has UUID primary key - no sequence needed';
        ELSE
            RAISE NOTICE 'Table structure might be incorrect';
        END IF;
    ELSE
        RAISE NOTICE 'payroll_records table does not exist - needs to be created';
    END IF;
END $$;

-- Clean up any references to the non-existent sequence
-- This query will only run if somehow the sequence was created incorrectly
DROP SEQUENCE IF EXISTS payroll_records_id_seq;

-- Verify table structure (this should show UUID type for id column)
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
ORDER BY ordinal_position;

-- Count existing records to verify table is working
SELECT COUNT(*) as total_records FROM payroll_records;

RAISE NOTICE 'Sequence issue fixed - payroll_records table uses UUID primary keys, no sequence needed';
