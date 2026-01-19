-- Create VIP products table
CREATE TABLE IF NOT EXISTS vip_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  earnings DECIMAL(12, 2) NOT NULL CHECK (earnings >= 0),
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create VIP product purchases table
CREATE TABLE IF NOT EXISTS vip_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vip_product_id UUID NOT NULL REFERENCES vip_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price_paid DECIMAL(12, 2) NOT NULL,
  earnings_received DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vip_products_status ON vip_products(status);
CREATE INDEX IF NOT EXISTS idx_vip_product_purchases_user_id ON vip_product_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_product_purchases_created_at ON vip_product_purchases(created_at DESC);

-- Create RPC function to purchase VIP product
CREATE OR REPLACE FUNCTION purchase_vip_product(
  p_user_id UUID,
  p_vip_product_id UUID
) RETURNS json
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
  SELECT balance INTO v_user_balance FROM profiles WHERE id = p_user_id;
  IF v_user_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user has enough balance
  IF v_user_balance < v_product.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct price and add earnings to user balance
  UPDATE profiles
  SET balance = balance - v_product.price + v_product.earnings,
      total_earnings = total_earnings + v_product.earnings,
      withdrawable_balance = withdrawable_balance + v_product.earnings
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

-- Enable RLS
ALTER TABLE vip_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_product_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vip_products
CREATE POLICY "Anyone can view active VIP products"
  ON vip_products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage VIP products"
  ON vip_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for vip_product_purchases
CREATE POLICY "Users can view their own VIP purchases"
  ON vip_product_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all VIP purchases"
  ON vip_product_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );