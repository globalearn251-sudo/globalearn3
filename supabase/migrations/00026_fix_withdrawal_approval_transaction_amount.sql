-- Fix the approve_withdrawal_request function to record actual withdrawal amount in transaction history
CREATE OR REPLACE FUNCTION approve_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT DEFAULT NULL
) RETURNS JSON
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

  -- Record transaction for approval with actual withdrawal amount
  -- Note: Amount is negative because it was already deducted, this is just for history
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    v_request.user_id,
    'withdrawal_approved',
    -v_request.amount,
    (SELECT balance FROM profiles WHERE id = v_request.user_id),
    'Withdrawal approved and processed - ₹' || v_request.amount || ' transferred',
    p_request_id
  );

  RETURN json_build_object('success', TRUE);
END;
$$;