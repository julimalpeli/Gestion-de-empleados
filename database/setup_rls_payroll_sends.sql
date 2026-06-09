-- Row Level Security Policies for payroll_sends table
-- These policies ensure users can only see their own company's data

-- Policy: Authenticated users can view payroll sends for their company
CREATE POLICY "View payroll sends for company" 
    ON payroll_sends 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_sends.employee_id
            AND e.company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Only authenticated users can insert payroll sends
CREATE POLICY "Insert payroll sends" 
    ON payroll_sends 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_sends.employee_id
            AND e.company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can update payroll sends for their company (status updates, etc)
CREATE POLICY "Update payroll sends" 
    ON payroll_sends 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_sends.employee_id
            AND e.company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Allow batch operations for authenticated users
CREATE POLICY "Delete payroll sends (batch cleanup)" 
    ON payroll_sends 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_sends.employee_id
            AND e.company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );
