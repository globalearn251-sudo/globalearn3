-- Update purchase_product to allow purchases from total balance
-- But deduct from BOTH balance and withdrawable_balance to prevent double-spending
CREATE OR REPLACE FUNCTION purchase_product(
  p_user_id UUID,
  p_product_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product products;
  v_user_balance DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
  v_user_product_id UUID;
  v_transaction_id UUID;
  v_referrer_id UUID;
  v_commission_percentage DECIMAL(5, 2);
  v_commission_amount DECIMAL(12, 2);
BEGIN
  -- Get product details
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Get user balance
  SELECT balance
  INTO v_user_balance
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Check if user has enough total balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from balance and also deduct from withdrawable_balance (but not below 0)
  -- This prevents users from using the same money twice
  UPDATE profiles
  SET balance = balance - v_product.price,
      withdrawable_balance = GREATEST(0, withdrawable_balance - v_product.price)
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

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
    v_new_balance,
    'Purchased ' || v_product.name,
    v_user_product_id
  ) RETURNING id INTO v_transaction_id;

  -- Handle referral commission
  SELECT referred_by INTO v_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Get commission percentage from settings
    SELECT COALESCE(value::DECIMAL, 5) INTO v_commission_percentage
    FROM company_settings
    WHERE key = 'referral_commission_percentage';
    
    -- Calculate commission amount
    v_commission_amount := (v_product.price * v_commission_percentage / 100);
    
    -- Add commission to referrer's balance and withdrawable balance
    UPDATE profiles
    SET 
      balance = balance + v_commission_amount,
      withdrawable_balance = withdrawable_balance + v_commission_amount,
      total_earnings = total_earnings + v_commission_amount
    WHERE id = v_referrer_id;
    
    -- Update referral record
    UPDATE referrals
    SET commission_earned = commission_earned + v_commission_amount
    WHERE referrer_id = v_referrer_id AND referred_id = p_user_id;
    
    -- Record commission transaction for referrer
    INSERT INTO transactions (
      user_id,
      type,
      amount,
      balance_after,
      description,
      reference_id
    ) VALUES (
      v_referrer_id,
      'referral',
      v_commission_amount,
      (SELECT balance FROM profiles WHERE id = v_referrer_id),
      'Referral commission from purchase',
      v_user_product_id
    );
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'user_product_id', v_user_product_id,
    'transaction_id', v_transaction_id,
    'commission_paid', v_commission_amount
  );
END;
$$;

-- Update purchase_vip_product to allow purchases from total balance
-- But deduct from BOTH balance and withdrawable_balance to prevent double-spending
CREATE OR REPLACE FUNCTION purchase_vip_product(
  p_user_id UUID,
  p_vip_product_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product vip_products;
  v_user_balance DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
  v_purchase_id UUID;
BEGIN
  -- Get product details
  SELECT * INTO v_product FROM vip_products WHERE id = p_vip_product_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'VIP product not found or inactive';
  END IF;

  -- Get user balance
  SELECT balance
  INTO v_user_balance
  FROM profiles 
  WHERE id = p_user_id;
  
  IF v_user_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user has enough total balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct price from both balances (withdrawable can't go below 0)
  -- Then add earnings to both balances
  UPDATE profiles
  SET balance = balance - v_product.price + v_product.earnings,
      withdrawable_balance = GREATEST(0, withdrawable_balance - v_product.price) + v_product.earnings,
      total_earnings = total_earnings + v_product.earnings
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Create purchase record
  INSERT INTO vip_product_purchases (
    user_id,
    vip_product_id,
    product_name,
    price_paid,
    earnings_received
  ) VALUES (
    p_user_id,
    p_vip_product_id,
    v_product.name,
    v_product.price,
    v_product.earnings
  ) RETURNING id INTO v_purchase_id;

  -- Record transaction for purchase
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
    v_new_balance,
    'VIP Product Purchase: ' || v_product.name,
    v_purchase_id
  );

  -- Record transaction for earnings
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    'earning',
    v_product.earnings,
    v_new_balance,
    'VIP Product Earnings: ' || v_product.name,
    v_purchase_id
  );

  RETURN json_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'earnings_received', v_product.earnings,
    'purchase_id', v_purchase_id
  );
END;
$$;