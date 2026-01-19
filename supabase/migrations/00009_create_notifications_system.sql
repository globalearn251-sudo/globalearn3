-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'important')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_notifications table to track read status
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Admins can do everything
CREATE POLICY "Admins can manage notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view active notifications
CREATE POLICY "Users can view active notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- RLS Policies for user_notifications
-- Users can view their own notification status
CREATE POLICY "Users can view their notification status"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notification status
CREATE POLICY "Users can update their notification status"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own notification status
CREATE POLICY "Users can insert their notification status"
  ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all notification statuses
CREATE POLICY "Admins can view all notification statuses"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to create notification for all users
CREATE OR REPLACE FUNCTION create_notification_for_all_users(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_user_count INTEGER;
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_created_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create notifications';
  END IF;

  -- Create notification
  INSERT INTO notifications (title, message, type, created_by)
  VALUES (p_title, p_message, p_type, p_created_by)
  RETURNING id INTO v_notification_id;

  -- Create user_notifications for all users
  INSERT INTO user_notifications (user_id, notification_id)
  SELECT id, v_notification_id
  FROM profiles
  WHERE role = 'user';

  GET DIAGNOSTICS v_user_count = ROW_COUNT;

  RETURN json_build_object(
    'success', TRUE,
    'notification_id', v_notification_id,
    'users_notified', v_user_count
  );
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_user_id UUID,
  p_notification_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user_notification
  INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
  VALUES (p_user_id, p_notification_id, TRUE, NOW())
  ON CONFLICT (user_id, notification_id)
  DO UPDATE SET
    is_read = TRUE,
    read_at = NOW();
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications n
  LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = p_user_id
  WHERE n.is_active = TRUE
  AND (un.is_read IS NULL OR un.is_read = FALSE);

  RETURN v_count;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();