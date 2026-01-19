# KYC Enhancement: IFSC Code and UPI ID

## Overview
Enhanced the KYC submission form to collect additional banking information required for withdrawal processing:
- **IFSC Code** (Required): 11-character bank identifier code
- **UPI ID** (Optional): User's UPI ID for faster payment processing

---

## Changes Made

### 1. Database Schema Update

**Migration:** `00019_add_ifsc_and_upi_to_kyc.sql`

Added two new columns to `kyc_submissions` table:

```sql
ALTER TABLE kyc_submissions
ADD COLUMN ifsc_code TEXT NOT NULL DEFAULT '',
ADD COLUMN upi_id TEXT;

ALTER TABLE kyc_submissions
ALTER COLUMN ifsc_code DROP DEFAULT;
```

**Column Details:**
- `ifsc_code`: TEXT, NOT NULL - Required field for bank IFSC code
- `upi_id`: TEXT, NULL - Optional field for UPI ID

---

### 2. TypeScript Interface Update

**File:** `src/types/types.ts`

Updated `KycSubmission` interface:

```typescript
export interface KycSubmission {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;           // NEW: Required IFSC code
  upi_id: string | null;       // NEW: Optional UPI ID
  status: KycStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: Profile;
}
```

---

### 3. API Function Update

**File:** `src/db/api.ts`

Updated `submitKyc` function signature:

```typescript
submitKyc: async (
  userId: string,
  idFrontUrl: string,
  idBackUrl: string,
  bankName: string,
  accountNumber: string,
  accountHolderName: string,
  ifscCode: string,        // NEW: Required parameter
  upiId?: string           // NEW: Optional parameter
) => {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert({
      user_id: userId,
      id_front_url: idFrontUrl,
      id_back_url: idBackUrl,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
      ifsc_code: ifscCode,
      upi_id: upiId || null,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as KycSubmission;
}
```

---

### 4. User KYC Submission Form

**File:** `src/pages/KycSubmitPage.tsx`

#### Added State Variables:
```typescript
const [ifscCode, setIfscCode] = useState('');
const [upiId, setUpiId] = useState('');
```

#### Added Form Fields:

**IFSC Code Field (Required):**
```tsx
<div className="space-y-2">
  <Label htmlFor="ifscCode">IFSC Code *</Label>
  <Input
    id="ifscCode"
    value={ifscCode}
    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
    placeholder="e.g., SBIN0001234"
    disabled={loading}
    required
    maxLength={11}
  />
  <p className="text-xs text-muted-foreground">
    11-character bank IFSC code
  </p>
</div>
```

**Features:**
- Automatically converts input to uppercase
- 11-character maximum length
- Required field validation
- Placeholder example: "SBIN0001234"
- Helper text explaining the format

**UPI ID Field (Optional):**
```tsx
<div className="space-y-2">
  <Label htmlFor="upiId">UPI ID (Optional)</Label>
  <Input
    id="upiId"
    value={upiId}
    onChange={(e) => setUpiId(e.target.value)}
    placeholder="e.g., yourname@paytm"
    disabled={loading}
  />
  <p className="text-xs text-muted-foreground">
    Your UPI ID for faster payments
  </p>
</div>
```

**Features:**
- Optional field (not required)
- Placeholder example: "yourname@paytm"
- Helper text explaining the purpose

#### Updated Validation:
```typescript
if (!bankName || !accountNumber || !accountHolderName || !ifscCode) {
  toast({
    title: 'Missing Information',
    description: 'Please fill in all required fields',
    variant: 'destructive',
  });
  return;
}
```

#### Updated Submit Button:
```typescript
<Button
  type="submit"
  className="w-full"
  disabled={loading || !idFront || !idBack || !bankName || !accountNumber || !accountHolderName || !ifscCode}
>
```

---

### 5. Admin KYC Review Page

**File:** `src/pages/admin/AdminKycPage.tsx`

Added display fields in the KYC submission details dialog:

```tsx
<div>
  <p className="text-sm text-muted-foreground">IFSC Code</p>
  <p className="font-medium font-mono">{viewingSubmission.ifsc_code}</p>
</div>
<div>
  <p className="text-sm text-muted-foreground">UPI ID</p>
  <p className="font-medium">{viewingSubmission.upi_id || 'Not provided'}</p>
</div>
```

**Features:**
- IFSC code displayed in monospace font for better readability
- UPI ID shows "Not provided" if user didn't enter one
- Positioned after Account Holder Name in the details grid

---

## User Experience

### KYC Submission Flow

1. **User navigates to KYC Submit page**
2. **Uploads ID documents** (front and back)
3. **Fills in bank details:**
   - Bank Name *
   - Account Number *
   - Account Holder Name *
   - **IFSC Code *** (NEW - Required)
   - **UPI ID** (NEW - Optional)
4. **Submits form**
5. **System validates** all required fields
6. **Documents uploaded** to storage
7. **KYC submission created** with all details

### Admin Review Flow

1. **Admin opens KYC submission**
2. **Views all details including:**
   - User information
   - ID documents (front and back)
   - Bank details
   - **IFSC Code** (NEW)
   - **UPI ID** (NEW - if provided)
3. **Reviews and approves/rejects**

---

## IFSC Code Information

### What is IFSC?
**IFSC** = Indian Financial System Code

- 11-character alphanumeric code
- Uniquely identifies bank branches in India
- Required for NEFT, RTGS, and IMPS transactions
- Format: First 4 letters (bank code) + 0 + 6 digits (branch code)

### Examples:
- State Bank of India: `SBIN0001234`
- HDFC Bank: `HDFC0001234`
- ICICI Bank: `ICIC0001234`
- Axis Bank: `UTIB0001234`

### How to Find IFSC Code:
1. Check bank passbook
2. Check bank cheque leaf
3. Visit bank's website
4. Use RBI's IFSC code search tool
5. Contact bank customer service

---

## UPI ID Information

### What is UPI ID?
**UPI** = Unified Payments Interface

- Virtual Payment Address (VPA)
- Format: `username@bankname` or `username@paymentapp`
- Used for instant money transfers
- Optional but enables faster payments

### Examples:
- `9876543210@paytm`
- `yourname@ybl` (Google Pay)
- `yourname@oksbi` (SBI)
- `yourname@axisbank`

### Benefits of Providing UPI ID:
- Faster withdrawal processing
- Instant payment receipt
- No need to wait for bank transfer
- 24/7 availability

---

## Validation Rules

### IFSC Code:
- ✅ Required field
- ✅ Maximum 11 characters
- ✅ Automatically converted to uppercase
- ✅ Must be filled before submission

### UPI ID:
- ✅ Optional field
- ✅ No character limit
- ✅ Can be left empty
- ✅ Helps with faster payments if provided

---

## Database Migration Details

### Before Migration:
```sql
kyc_submissions (
  id,
  user_id,
  id_front_url,
  id_back_url,
  bank_name,
  account_number,
  account_holder_name,
  status,
  admin_note,
  reviewed_by,
  reviewed_at,
  created_at
)
```

### After Migration:
```sql
kyc_submissions (
  id,
  user_id,
  id_front_url,
  id_back_url,
  bank_name,
  account_number,
  account_holder_name,
  ifsc_code,        -- NEW: Required
  upi_id,           -- NEW: Optional
  status,
  admin_note,
  reviewed_by,
  reviewed_at,
  created_at
)
```

---

## Testing Checklist

### User Side:
- [ ] Navigate to KYC Submit page
- [ ] Upload ID front and back images
- [ ] Fill in bank name, account number, account holder name
- [ ] Enter IFSC code (should convert to uppercase)
- [ ] Optionally enter UPI ID
- [ ] Try submitting without IFSC code (should show error)
- [ ] Submit with all required fields (should succeed)

### Admin Side:
- [ ] Open KYC submissions list
- [ ] Click on a submission to view details
- [ ] Verify IFSC code is displayed
- [ ] Verify UPI ID is displayed (or "Not provided")
- [ ] Approve/reject submission
- [ ] Verify all data is saved correctly

### Database:
```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'kyc_submissions' 
  AND column_name IN ('ifsc_code', 'upi_id');

-- Check sample data
SELECT 
  user_id,
  bank_name,
  ifsc_code,
  upi_id,
  status
FROM kyc_submissions
ORDER BY created_at DESC
LIMIT 5;
```

---

## Benefits

### For Users:
- ✅ Complete banking information in one place
- ✅ Faster withdrawal processing with UPI
- ✅ Clear guidance on what information is needed
- ✅ Validation prevents submission errors

### For Admin:
- ✅ All necessary banking details for processing withdrawals
- ✅ IFSC code for bank transfers
- ✅ UPI ID option for instant payments
- ✅ Better organized information display

### For System:
- ✅ Reduced back-and-forth for missing information
- ✅ Enables automated withdrawal processing
- ✅ Supports multiple payment methods
- ✅ Improved data completeness

---

## Future Enhancements

Potential improvements:
1. **IFSC Code Validation**: Verify against RBI database
2. **Bank Name Auto-fill**: Fetch bank name from IFSC code
3. **UPI ID Validation**: Check format (username@provider)
4. **Branch Details**: Auto-populate branch name and address
5. **QR Code**: Generate UPI QR code for admin reference

---

## Status
✅ **Implemented and Deployed**

All KYC submissions now require IFSC code and optionally accept UPI ID for faster payment processing.

---

**Date Implemented:** 2025-12-27  
**Migration:** 00019_add_ifsc_and_upi_to_kyc.sql
