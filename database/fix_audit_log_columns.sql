-- Fix audit_log table schema to match the code expectations
-- Execute this in Supabase SQL Editor

-- First, let's check the current structure
SELECT 'Current audit_log columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;

-- Check if columns exist and add missing ones
DO $$
BEGIN
    -- Add entity_type column if it doesn't exist (alias for table_name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'entity_type') THEN
        -- For compatibility, we'll use table_name but also add entity_type as an alias
        ALTER TABLE audit_log ADD COLUMN entity_type VARCHAR(50);
        RAISE NOTICE 'Added entity_type column';
    END IF;

    -- Add entity_id column if it doesn't exist (alias for record_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'entity_id') THEN
        ALTER TABLE audit_log ADD COLUMN entity_id VARCHAR(255);
        RAISE NOTICE 'Added entity_id column';
    END IF;

    -- Add user_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'user_email') THEN
        ALTER TABLE audit_log ADD COLUMN user_email VARCHAR(255);
        RAISE NOTICE 'Added user_email column';
    END IF;

    -- Add timestamp column if it doesn't exist (alias for changed_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'timestamp') THEN
        ALTER TABLE audit_log ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added timestamp column';
    END IF;

    -- Make sure changed_at exists with default value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'changed_at') THEN
        ALTER TABLE audit_log ADD COLUMN changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added changed_at column';
    END IF;

    -- Add changed_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'changed_by') THEN
        ALTER TABLE audit_log ADD COLUMN changed_by VARCHAR(255);
        RAISE NOTICE 'Added changed_by column';
    END IF;
END $$;

-- Create a trigger to sync entity_type with table_name and entity_id with record_id
CREATE OR REPLACE FUNCTION sync_audit_log_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync entity_type with table_name
    IF NEW.table_name IS NOT NULL AND NEW.entity_type IS NULL THEN
        NEW.entity_type := NEW.table_name;
    ELSIF NEW.entity_type IS NOT NULL AND NEW.table_name IS NULL THEN
        NEW.table_name := NEW.entity_type;
    END IF;

    -- Sync entity_id with record_id
    IF NEW.record_id IS NOT NULL AND NEW.entity_id IS NULL THEN
        NEW.entity_id := NEW.record_id;
    ELSIF NEW.entity_id IS NOT NULL AND NEW.record_id IS NULL THEN
        NEW.record_id := NEW.entity_id;
    END IF;

    -- Sync timestamp with changed_at
    IF NEW.changed_at IS NOT NULL AND NEW.timestamp IS NULL THEN
        NEW.timestamp := NEW.changed_at;
    ELSIF NEW.timestamp IS NOT NULL AND NEW.changed_at IS NULL THEN
        NEW.changed_at := NEW.timestamp;
    END IF;

    -- Set defaults
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := NOW();
    END IF;

    IF NEW.changed_at IS NULL THEN
        NEW.changed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_audit_log_fields_trigger ON audit_log;
CREATE TRIGGER sync_audit_log_fields_trigger
    BEFORE INSERT OR UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION sync_audit_log_fields();

-- Test the updated schema with the problematic insert
INSERT INTO audit_log (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changed_by,
    user_email,
    timestamp
) VALUES (
    'test',
    'test-id-schema-fix',
    'SCHEMA_FIX_TEST',
    '{}',
    '{"test": "schema fixed"}',
    COALESCE(auth.email(), 'system@test.com'),
    COALESCE(auth.email(), 'system@test.com'),
    NOW()
);

-- Show the final schema
SELECT 'Updated audit_log columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;

-- Show test record
SELECT 'Test record created:' as info;
SELECT * FROM audit_log WHERE entity_id = 'test-id-schema-fix';

SELECT 'Audit log schema updated successfully!' as result;
