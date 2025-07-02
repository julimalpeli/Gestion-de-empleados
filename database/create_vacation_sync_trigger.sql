-- Function and trigger to automatically sync vacations_taken field
-- when vacation_requests are inserted, updated, or deleted

-- Create function to update vacations_taken for an employee
CREATE OR REPLACE FUNCTION sync_employee_vacations_taken()
RETURNS TRIGGER AS $$
DECLARE
    affected_employee_id UUID;
BEGIN
    -- Determine which employee_id was affected
    IF TG_OP = 'DELETE' THEN
        affected_employee_id := OLD.employee_id;
    ELSE
        affected_employee_id := NEW.employee_id;
    END IF;

    -- Update the employee's vacations_taken field
    UPDATE employees 
    SET vacations_taken = (
        SELECT COALESCE(SUM(days), 0)
        FROM vacation_requests 
        WHERE employee_id = affected_employee_id 
        AND status = 'approved'
    )
    WHERE id = affected_employee_id;

    -- If this was an UPDATE and employee_id changed, also update the old employee
    IF TG_OP = 'UPDATE' AND OLD.employee_id != NEW.employee_id THEN
        UPDATE employees 
        SET vacations_taken = (
            SELECT COALESCE(SUM(days), 0)
            FROM vacation_requests 
            WHERE employee_id = OLD.employee_id 
            AND status = 'approved'
        )
        WHERE id = OLD.employee_id;
    END IF;

    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS vacation_sync_trigger ON vacation_requests;

-- Create trigger that fires after INSERT, UPDATE, or DELETE on vacation_requests
CREATE TRIGGER vacation_sync_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vacation_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_vacations_taken();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_employee_vacations_taken() TO authenticated;

SELECT 'Vacation sync trigger created successfully' as result;
