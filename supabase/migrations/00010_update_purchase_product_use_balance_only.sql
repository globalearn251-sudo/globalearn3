-- Update purchase_product to only use balance, not withdrawable_amount
CREATE OR REPLACE FUNCTION purchase_product(
  p_user_id UUID,
  p_product_id UUID
)
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
  SELECT balance 
  INTO v_user_balance 
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Check if user has enough balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from balance only (not from withdrawable_amount)
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