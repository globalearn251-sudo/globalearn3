-- Add transaction_id column to recharge_requests table
ALTER TABLE recharge_requests ADD COLUMN IF NOT EXISTS transaction_id TEXT;