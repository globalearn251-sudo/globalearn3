# Product Purchase Transaction Type Fix

## Issue
When users tried to purchase a product, they received an error:
```
invalid input value for enum transaction_type: referral_commission
```

## Root Cause
The `purchase_product` RPC function was using an incorrect transaction type value when recording referral commission transactions.

**Incorrect value:** `'referral_commission'`  
**Correct value:** `'referral'`

## Database Enum Values
The `transaction_type` enum in the database has these valid values:
- `recharge`
- `withdrawal`
- `purchase`
- `earning`
- `referral`
- `lucky_draw`

## Fix Applied
Updated the `purchase_product` function to use the correct enum value:

### Before (Line ~105):
```sql
INSERT INTO transactions (
  user_id,
  type,
  amount,
  balance_after,
  description,
  reference_id
) VALUES (
  v_referrer_id,
  'referral_commission',  -- ❌ WRONG: Not in enum
  v_commission_amount,
  (SELECT balance FROM profiles WHERE id = v_referrer_id),
  'Referral commission from purchase',
  v_user_product_id
);
```

### After (Fixed):
```sql
INSERT INTO transactions (
  user_id,
  type,
  amount,
  balance_after,
  description,
  reference_id
) VALUES (
  v_referrer_id,
  'referral',  -- ✅ CORRECT: Valid enum value
  v_commission_amount,
  (SELECT balance FROM profiles WHERE id = v_referrer_id),
  'Referral commission from purchase',
  v_user_product_id
);
```

## Migration Applied
**File:** `supabase/migrations/00018_fix_purchase_product_transaction_type.sql`

The migration recreates the `purchase_product` function with the corrected transaction type.

## Testing
After applying the fix:

1. **Login as a user**
2. **Ensure you have sufficient balance** (recharge if needed)
3. **Go to Products page**
4. **Click "Buy" on any product**
5. **Should succeed without errors**

### Verify Purchase:
```sql
-- Check user_products table
SELECT * FROM user_products 
WHERE user_id = 'your-user-id' 
ORDER BY purchased_at DESC 
LIMIT 1;

-- Check transactions
SELECT * FROM transactions 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Verify Referral Commission (if user was referred):
```sql
-- Check referrer's transactions
SELECT * FROM transactions 
WHERE type = 'referral' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check referral record
SELECT * FROM referrals 
WHERE referred_id = 'your-user-id';
```

## Impact
This fix affects:
- ✅ Product purchases
- ✅ Referral commission distribution
- ✅ Transaction history recording

## Related Functions
The `purchase_product` function handles:
1. Validating product exists and is active
2. Checking user has sufficient balance
3. Deducting purchase amount from user balance
4. Creating user_product record
5. Recording purchase transaction
6. **Calculating and distributing referral commission** (if applicable)
7. Recording referral commission transaction

## Status
✅ **Fixed and Deployed**

Users can now purchase products without encountering the enum error.

---

**Date Fixed:** 2025-12-27  
**Migration:** 00018_fix_purchase_product_transaction_type.sql
