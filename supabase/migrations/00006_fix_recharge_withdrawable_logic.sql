-- Fix approve_recharge_request to NOT add to withdrawable_amount
-- Only earnings should be withdrawable, not recharges
CREATE OR REPLACE FUNCTION approve_recharge_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request recharge_requests;
  v_new_balance DECIMAL(12, 2);
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM recharge_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- Update user balance only (not withdrawable_amount)
  -- Withdrawable amount should only increase from earnings
  UPDATE profiles
  SET balance = balance + v_request.amount
  WHERE id = v_request.user_id
  RETURNING balance INTO v_new_balance;

  -- Update request status
  UPDATE recharge_requests
  SET status = 'approved',
      processed_by = p_admin_id,
      processed_at = NOW(),
      admin_note = p_admin_note
  WHERE id = p_request_id;

  -- Record transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    v_request.user_id,
    'recharge',
    v_request.amount,
    v_new_balance,
    'Recharge approved',
    p_request_id
  );

  RETURN json_build_object('success', TRUE, 'new_balance', v_new_balance);
END;
$$;