-- Add admin_credit to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'admin_credit';

-- Also add other missing types that might be needed
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'withdrawal_approved';