
-- Add IFSC code and UPI ID fields to kyc_submissions table
ALTER TABLE kyc_submissions
ADD COLUMN ifsc_code TEXT NOT NULL DEFAULT '',
ADD COLUMN upi_id TEXT;

-- Remove default after adding column (for future inserts)
ALTER TABLE kyc_submissions
ALTER COLUMN ifsc_code DROP DEFAULT;
