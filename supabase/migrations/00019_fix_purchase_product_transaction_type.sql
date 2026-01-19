
-- Fix the purchase_product function to use correct transaction type
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
  
  -- Check if user has enough balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from balance only (not from withdrawable_balance)
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
    
    -- Record commission transaction for referrer (FIXED: changed from 'referral_commission' to 'referral')
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
