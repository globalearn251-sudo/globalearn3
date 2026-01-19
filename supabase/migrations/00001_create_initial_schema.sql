-- Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create product status enum
CREATE TYPE product_status AS ENUM ('active', 'inactive');

-- Create request status enum
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create KYC status enum
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM ('recharge', 'withdrawal', 'purchase', 'earning', 'referral', 'lucky_draw');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  withdrawable_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  kyc_status kyc_status DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(12, 2) NOT NULL,
  daily_earning DECIMAL(12, 2) NOT NULL,
  contract_days INTEGER NOT NULL,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_products table (purchased products)
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  purchase_price DECIMAL(12, 2) NOT NULL,
  daily_earning DECIMAL(12, 2) NOT NULL,
  contract_days INTEGER NOT NULL,
  days_remaining INTEGER NOT NULL,
  total_earned DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_earning_date DATE
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recharge_requests table
CREATE TABLE recharge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_screenshot_url TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create withdrawal_requests table
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  bank_details TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_earnings table
CREATE TABLE daily_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_product_id UUID NOT NULL REFERENCES user_products(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  earning_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commission_earned DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create lucky_draw_config table
CREATE TABLE lucky_draw_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_name TEXT NOT NULL,
  reward_amount DECIMAL(12, 2) NOT NULL,
  probability DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create lucky_draw_history table
CREATE TABLE lucky_draw_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_amount DECIMAL(12, 2) NOT NULL,
  spin_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create kyc_submissions table
CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  status kyc_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create company_settings table
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default company settings
INSERT INTO company_settings (key, value) VALUES
  ('banner_url', ''),
  ('company_notice', 'Welcome to our Investment Platform!'),
  ('company_details', 'We provide secure and reliable investment opportunities.'),
  ('recharge_qr_code_url', '');

-- Insert default lucky draw rewards
INSERT INTO lucky_draw_config (reward_name, reward_amount, probability) VALUES
  ('$1 Bonus', 1.00, 30.00),
  ('$5 Bonus', 5.00, 25.00),
  ('$10 Bonus', 10.00, 20.00),
  ('$20 Bonus', 20.00, 15.00),
  ('$50 Bonus', 50.00, 7.00),
  ('$100 Bonus', 100.00, 3.00);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('app_8ildgs548gzl_investment_images', 'app_8ildgs548gzl_investment_images', true);

-- Storage policies for images bucket
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'app_8ildgs548gzl_investment_images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app_8ildgs548gzl_investment_images');
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'app_8ildgs548gzl_investment_images');
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'app_8ildgs548gzl_investment_images');

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Create trigger function to sync auth users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  new_username TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  new_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  INSERT INTO public.profiles (id, username, email, phone, role, referral_code)
  VALUES (
    NEW.id,
    new_username,
    NEW.email,
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END,
    generate_referral_code()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to sync users on confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for user_products
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON user_products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON user_products FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for recharge_requests
ALTER TABLE recharge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recharge requests" ON recharge_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create recharge requests" ON recharge_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage recharge requests" ON recharge_requests FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for withdrawal_requests
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage withdrawal requests" ON withdrawal_requests FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for daily_earnings
ALTER TABLE daily_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own earnings" ON daily_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all earnings" ON daily_earnings FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "Admins can view all referrals" ON referrals FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for lucky_draw_config
ALTER TABLE lucky_draw_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active rewards" ON lucky_draw_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rewards" ON lucky_draw_config FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for lucky_draw_history
ALTER TABLE lucky_draw_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lucky draw history" ON lucky_draw_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lucky draw history" ON lucky_draw_history FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create KYC submissions" ON kyc_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage KYC submissions" ON kyc_submissions FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view company settings" ON company_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage company settings" ON company_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create public view for profiles
CREATE VIEW public_profiles AS
  SELECT id, username, role, referral_code FROM profiles;