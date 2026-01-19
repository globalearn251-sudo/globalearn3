-- Drop existing functions
DROP FUNCTION IF EXISTS approve_withdrawal_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS reject_withdrawal_request(uuid, uuid, text);

-- Create function to create withdrawal request with immediate balance deduction
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
BEGIN
  -- Check if user has enough withdrawable balance
  SELECT withdrawable_balance INTO v_withdrawable FROM profiles WHERE id = p_user_id;
  
  IF v_withdrawable IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
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

-- Update approve function to NOT deduct balance (already deducted)
CREATE OR REPLACE FUNCTION approve_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request withdrawal_requests;
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM withdrawal_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- Update request status (balance already deducted when request was created)
  UPDATE withdrawal_requests
  SET status = 'approved',
      processed_by = p_admin_id,
      processed_at = NOW(),
      admin_note = p_admin_note
  WHERE id = p_request_id;

  -- Record transaction for approval
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    v_request.user_id,
    'withdrawal',
    0, -- No balance change, already deducted
    (SELECT balance FROM profiles WHERE id = v_request.user_id),
    'Withdrawal approved and processed',
    p_request_id
  );

  RETURN json_build_object('success', TRUE);
END;
$$;

-- Update reject function to ADD balance back
CREATE OR REPLACE FUNCTION reject_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request withdrawal_requests;
  v_new_balance DECIMAL(12, 2);
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM withdrawal_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- Return funds to user balance
  UPDATE profiles
  SET balance = balance + v_request.amount,
      withdrawable_balance = withdrawable_balance + v_request.amount
  WHERE id = v_request.user_id
  RETURNING balance INTO v_new_balance;

  -- Update withdrawal request status
  UPDATE withdrawal_requests
  SET status = 'rejected',
      admin_note = p_admin_note,
      processed_by = p_admin_id,
      processed_at = NOW()
  WHERE id = p_request_id;

  -- Record transaction for refund
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    v_request.user_id,
    'refund',
    v_request.amount,
    v_new_balance,
    'Withdrawal rejected - funds returned',
    p_request_id
  );
END;
$$;