
-- Fix products table
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
ON products
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix kyc_submissions table
DROP POLICY IF EXISTS "Admins can manage KYC submissions" ON kyc_submissions;
CREATE POLICY "Admins can manage KYC submissions"
ON kyc_submissions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix lucky_draw_config table
DROP POLICY IF EXISTS "Admins can manage rewards" ON lucky_draw_config;
CREATE POLICY "Admins can manage rewards"
ON lucky_draw_config
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix notifications table
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications"
ON notifications
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
));

-- Fix profiles table
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles"
ON profiles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix recharge_requests table
DROP POLICY IF EXISTS "Admins can manage recharge requests" ON recharge_requests;
CREATE POLICY "Admins can manage recharge requests"
ON recharge_requests
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix withdrawal_requests table
DROP POLICY IF EXISTS "Admins can manage withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Admins can manage withdrawal requests"
ON withdrawal_requests
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix user_notifications table (UPDATE only, so WITH CHECK is for updates)
DROP POLICY IF EXISTS "Users can update their notification status" ON user_notifications;
CREATE POLICY "Users can update their notification status"
ON user_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
