-- Add status column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update existing users to have active status
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_active(UUID) TO authenticated, anon;