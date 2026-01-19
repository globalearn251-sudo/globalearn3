-- Add withdrawal_blocked column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS withdrawal_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_withdrawal_blocked ON profiles(withdrawal_blocked);

-- Update the create_withdrawal_request_with_deduction function to check withdrawal block
CREATE OR REPLACE FUNCTION create_withdrawal_request_with_deduction(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_bank_details TEXT
) RETURNS withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawable DECIMAL(12, 2);
  v_new_request withdrawal_requests;
  v_new_balance DECIMAL(12, 2);
  v_withdrawal_blocked BOOLEAN;
BEGIN
  -- Check if user's withdrawal is blocked
  SELECT withdrawal_blocked INTO v_withdrawal_blocked FROM profiles WHERE id = p_user_id;
  
  IF v_withdrawal_blocked IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_withdrawal_blocked = TRUE THEN
    RAISE EXCEPTION 'Your withdrawal is blocked due to violating the policy. Please contact admin.';
  END IF;

  -- Check if user has enough withdrawable balance
  SELECT withdrawable_balance INTO v_withdrawable FROM profiles WHERE id = p_user_id;
  
  IF v_withdrawable < p_amount THEN
    RAISE EXCEPTION 'Insufficient withdrawable balance';
  END IF;

  -- Deduct from both balance and withdrawable_balance immediately
  UPDATE profiles
  SET balance = balance - p_amount,
      withdrawable_balance = withdrawable_balance - p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, amount, bank_details, status)
  VALUES (p_user_id, p_amount, p_bank_details, 'pending')
  RETURNING * INTO v_new_request;

  -- Record transaction for the hold
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    'withdrawal',
    -p_amount,
    v_new_balance,
    'Withdrawal request submitted (funds on hold)',
    v_new_request.id
  );

  RETURN v_new_request;
END;
$$;