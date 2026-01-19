-- Add minimum withdrawal limit setting (default 500)
INSERT INTO company_settings (key, value)
VALUES ('min_withdrawal_amount', '500')
ON CONFLICT (key) DO NOTHING;