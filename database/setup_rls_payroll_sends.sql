-- Row Level Security Policies for payroll_sends table
-- ✅ Applied to Supabase (project: wfeoihoxpnzdfwzohzyo)
-- Note: single-tenant app, no company_id isolation needed

CREATE POLICY "Authenticated users can view payroll_sends"
    ON payroll_sends FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert payroll_sends"
    ON payroll_sends FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payroll_sends"
    ON payroll_sends FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payroll_sends"
    ON payroll_sends FOR DELETE
    USING (auth.role() = 'authenticated');
