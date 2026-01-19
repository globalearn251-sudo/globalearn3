-- Fix spin_lucky_draw to use withdrawable_balance instead of withdrawable_amount
CREATE OR REPLACE FUNCTION spin_lucky_draw(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_already_spun BOOLEAN;
  v_reward lucky_draw_config;
  v_random DECIMAL(5, 2);
  v_cumulative DECIMAL(5, 2) := 0;
  v_new_balance DECIMAL(12, 2);
BEGIN
  -- Check if user already spun today
  SELECT EXISTS(
    SELECT 1 FROM lucky_draw_history
    WHERE user_id = p_user_id AND spin_date = v_today
  ) INTO v_already_spun;

  IF v_already_spun THEN
    RAISE EXCEPTION 'Already spun today';
  END IF;

  -- Generate random number between 0 and 100
  v_random := RANDOM() * 100;

  -- Select reward based on probability
  FOR v_reward IN
    SELECT * FROM lucky_draw_config
    WHERE is_active = TRUE
    ORDER BY probability DESC
  LOOP
    v_cumulative := v_cumulative + v_reward.probability;
    IF v_random <= v_cumulative THEN
      EXIT;
    END IF;
  END LOOP;

  IF v_reward.id IS NULL THEN
    RAISE EXCEPTION 'No active rewards configured';
  END IF;

  -- Update user balance and withdrawable_balance
  UPDATE profiles
  SET balance = balance + v_reward.reward_amount,
      withdrawable_balance = withdrawable_balance + v_reward.reward_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record lucky draw history
  INSERT INTO lucky_draw_history (
    user_id,
    reward_name,
    reward_amount,
    spin_date
  ) VALUES (
    p_user_id,
    v_reward.reward_name,
    v_reward.reward_amount,
    v_today
  );

  -- Record transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    'lucky_draw',
    v_reward.reward_amount,
    v_new_balance,
    'Lucky draw reward: ' || v_reward.reward_name
  );

  RETURN json_build_object(
    'success', TRUE,
    'reward_name', v_reward.reward_name,
    'reward_amount', v_reward.reward_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Fix update_user_balance to use withdrawable_balance
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's balance, withdrawable_balance, and total_earnings
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