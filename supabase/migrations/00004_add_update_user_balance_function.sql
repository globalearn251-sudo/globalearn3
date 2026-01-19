-- Create function to update user balance (used by daily earnings)
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id uuid,
  p_amount decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's balance and withdrawable balance
  UPDATE profiles
  SET 
    balance = balance + p_amount,
    withdrawable_balance = withdrawable_balance + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;