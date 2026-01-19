-- RPC function to purchase a product
CREATE OR REPLACE FUNCTION purchase_product(p_user_id UUID, p_product_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product products;
  v_user_balance DECIMAL(12, 2);
  v_user_product_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get product details
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Get user balance
  SELECT balance INTO v_user_balance FROM profiles WHERE id = p_user_id;
  
  -- Check if user has enough balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance from user
  UPDATE profiles
  SET balance = balance - v_product.price
  WHERE id = p_user_id;

  -- Create user product
  INSERT INTO user_products (
    user_id,
    product_id,
    purchase_price,
    daily_earning,
    contract_days,
    days_remaining,
    is_active,
    expires_at
  ) VALUES (
    p_user_id,
    p_product_id,
    v_product.price,
    v_product.daily_earning,
    v_product.contract_days,
    v_product.contract_days,
    TRUE,
    NOW() + (v_product.contract_days || ' days')::INTERVAL
  ) RETURNING id INTO v_user_product_id;

  -- Record transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    'purchase',
    -v_product.price,
    v_user_balance - v_product.price,
    'Purchased ' || v_product.name,
    v_user_product_id
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', TRUE,
    'user_product_id', v_user_product_id,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- RPC function to approve recharge request
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

  -- Update user balance
  UPDATE profiles
  SET balance = balance + v_request.amount,
      withdrawable_balance = withdrawable_balance + v_request.amount
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

-- RPC function to approve withdrawal request
CREATE OR REPLACE FUNCTION approve_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSON
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

  -- Check if user has enough withdrawable balance
  DECLARE
    v_withdrawable DECIMAL(12, 2);
  BEGIN
    SELECT withdrawable_balance INTO v_withdrawable FROM profiles WHERE id = v_request.user_id;
    IF v_withdrawable < v_request.amount THEN
      RAISE EXCEPTION 'Insufficient withdrawable balance';
    END IF;
  END;

  -- Update user balance
  UPDATE profiles
  SET balance = balance - v_request.amount,
      withdrawable_balance = withdrawable_balance - v_request.amount
  WHERE id = v_request.user_id
  RETURNING balance INTO v_new_balance;

  -- Update request status
  UPDATE withdrawal_requests
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
    'withdrawal',
    -v_request.amount,
    v_new_balance,
    'Withdrawal approved',
    p_request_id
  );

  RETURN json_build_object('success', TRUE, 'new_balance', v_new_balance);
END;
$$;

-- RPC function for lucky draw spin
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

  -- Update user balance
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

-- RPC function to approve KYC submission
CREATE OR REPLACE FUNCTION approve_kyc_submission(
  p_submission_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission kyc_submissions;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission FROM kyc_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'KYC submission not found';
  END IF;

  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission already processed';
  END IF;

  -- Update submission status
  UPDATE kyc_submissions
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = NOW(),
      admin_note = p_admin_note
  WHERE id = p_submission_id;

  -- Update user KYC status
  UPDATE profiles
  SET kyc_status = 'approved'
  WHERE id = v_submission.user_id;

  RETURN json_build_object('success', TRUE);
END;
$$;

-- RPC function to reject KYC submission
CREATE OR REPLACE FUNCTION reject_kyc_submission(
  p_submission_id UUID,
  p_admin_id UUID,
  p_admin_note TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission kyc_submissions;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission FROM kyc_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'KYC submission not found';
  END IF;

  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission already processed';
  END IF;

  -- Update submission status
  UPDATE kyc_submissions
  SET status = 'rejected',
      reviewed_by = p_admin_id,
      reviewed_at = NOW(),
      admin_note = p_admin_note
  WHERE id = p_submission_id;

  -- Update user KYC status
  UPDATE profiles
  SET kyc_status = 'rejected'
  WHERE id = v_submission.user_id;

  RETURN json_build_object('success', TRUE);
END;
$$;