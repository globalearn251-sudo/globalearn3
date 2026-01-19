-- Update the handle_new_user function to support referral codes
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  new_username TEXT;
  referrer_id UUID;
  referral_code_param TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  new_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  -- Check if referral code is in raw_user_meta_data
  referral_code_param := NEW.raw_user_meta_data->>'referral_code';
  
  -- Find referrer if referral code provided
  IF referral_code_param IS NOT NULL AND referral_code_param != '' THEN
    SELECT id INTO referrer_id FROM profiles WHERE referral_code = referral_code_param;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, username, email, phone, role, referral_code, referred_by)
  VALUES (
    NEW.id,
    new_username,
    NEW.email,
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END,
    generate_referral_code(),
    referrer_id
  );
  
  -- Create referral record if referrer exists
  IF referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (referrer_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;