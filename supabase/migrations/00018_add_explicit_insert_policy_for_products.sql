
-- Add explicit INSERT policy for products
CREATE POLICY "Admins can insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));
