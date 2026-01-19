-- Add reject_withdrawal_request function
CREATE OR REPLACE FUNCTION reject_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update withdrawal request status
  UPDATE withdrawal_requests
  SET 
    status = 'rejected',
    admin_note = p_admin_note,
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
END;
$$;

-- Add reject_recharge_request function
CREATE OR REPLACE FUNCTION reject_recharge_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update recharge request status
  UPDATE recharge_requests
  SET 
    status = 'rejected',
    admin_note = p_admin_note,
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;
END;
$$;