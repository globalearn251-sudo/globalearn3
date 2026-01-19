-- Fix update_user_balance to use correct column name
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(12, 2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's balance, withdrawable_amount, and total_earnings
  UPDATE profiles
  SET 
    balance = balance + p_amount,
    withdrawable_amount = withdrawable_amount + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;