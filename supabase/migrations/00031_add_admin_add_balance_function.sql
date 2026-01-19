-- Create function for admin to add balance directly to user wallet
CREATE OR REPLACE FUNCTION admin_add_balance_to_user(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_admin_id UUID,
  p_note TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL(12, 2);
  v_username TEXT;
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Get username for transaction description
  SELECT username INTO v_username FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Add amount to user's total balance only (not withdrawable_balance)
  UPDATE profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction for audit trail
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    'admin_credit',
    p_amount,
    v_new_balance,
    'Balance added by admin' || CASE WHEN p_note IS NOT NULL THEN ': ' || p_note ELSE '' END
  );

  RETURN json_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$;