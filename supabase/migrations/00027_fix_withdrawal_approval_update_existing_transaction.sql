-- Fix the approve_withdrawal_request function to update existing transaction instead of creating duplicate
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

  -- Update the existing transaction description to show approval
  UPDATE transactions
  SET description = 'Withdrawal approved and processed - ₹' || v_request.amount || ' transferred'
  WHERE reference_id = p_request_id 
    AND type = 'withdrawal'
    AND user_id = v_request.user_id;

  RETURN json_build_object('success', TRUE);
END;
$$;