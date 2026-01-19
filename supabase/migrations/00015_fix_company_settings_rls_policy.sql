
-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;

-- Create new policy with proper with_check for INSERT operations
CREATE POLICY "Admins can manage company settings"
ON company_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
