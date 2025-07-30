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
    ELSE
        -- If column exists but is UUID type, alter it to VARCHAR
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'changed_by' AND data_type = 'uuid') THEN
            -- Drop foreign key constraint if it exists
            IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE table_name = 'audit_log' AND constraint_name = 'audit_log_changed_by_fkey') THEN
                ALTER TABLE audit_log DROP CONSTRAINT audit_log_changed_by_fkey;
                RAISE NOTICE 'Dropped foreign key constraint audit_log_changed_by_fkey';
            END IF;

            -- Now alter the column type
            ALTER TABLE audit_log ALTER COLUMN changed_by TYPE VARCHAR(255) USING changed_by::text;
            RAISE NOTICE 'Changed changed_by column from UUID to VARCHAR';
        END IF;
    END IF;

    -- Add core columns that the audit service expects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'table_name') THEN
        ALTER TABLE audit_log ADD COLUMN table_name VARCHAR(50);
        RAISE NOTICE 'Added table_name column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'record_id') THEN
        ALTER TABLE audit_log ADD COLUMN record_id VARCHAR(255);
        RAISE NOTICE 'Added record_id column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'action') THEN
        ALTER TABLE audit_log ADD COLUMN action VARCHAR(50);
        RAISE NOTICE 'Added action column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'old_values') THEN
        ALTER TABLE audit_log ADD COLUMN old_values JSONB;
        RAISE NOTICE 'Added old_values column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audit_log' AND column_name = 'new_values') THEN
        ALTER TABLE audit_log ADD COLUMN new_values JSONB;
        RAISE NOTICE 'Added new_values column';
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

    -- Sync entity_id with record_id (handle data type differences safely)
    BEGIN
        IF NEW.record_id IS NOT NULL AND NEW.entity_id IS NULL THEN
            NEW.entity_id := NEW.record_id::text;
        ELSIF NEW.entity_id IS NOT NULL AND NEW.record_id IS NULL THEN
            -- Only assign if entity_id looks like a valid UUID
            IF NEW.entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                NEW.record_id := NEW.entity_id::uuid;
            ELSE
                -- For non-UUID entity_id, leave record_id as NULL
                NEW.record_id := NULL;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore type conversion errors and continue
            NULL;
    END;

    -- Sync timestamp with changed_at
    IF NEW.changed_at IS NOT NULL AND NEW.timestamp IS NULL THEN
        NEW.timestamp := NEW.changed_at;
    ELSIF NEW.timestamp IS NOT NULL AND NEW.changed_at IS NULL THEN
        NEW.changed_at := NEW.timestamp;
    END IF;

    -- Set defaults for required fields
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := NOW();
    END IF;

    IF NEW.changed_at IS NULL THEN
        NEW.changed_at := NOW();
    END IF;

    -- Ensure action has a default if null
    IF NEW.action IS NULL THEN
        NEW.action := 'UPDATE';
    END IF;

    -- Initialize JSON fields if null
    IF NEW.old_values IS NULL THEN
        NEW.old_values := '{}'::JSONB;
    END IF;

    IF NEW.new_values IS NULL THEN
        NEW.new_values := '{}'::JSONB;
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
    COALESCE(auth.uid()::text, 'system'),
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
