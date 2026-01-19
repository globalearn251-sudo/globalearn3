# Product Purchase Logic Update

## Issue Fixed
**Error**: "withdrawable amount does not exist" when trying to purchase a product

**Root Cause**: The `purchase_product` function was trying to check and deduct from `withdrawable_amount`, which caused issues.

## Solution
Updated the product purchase logic to use **Total Balance only** instead of checking withdrawable amount.

## Changes Made

### Before (Old Logic)
```sql
-- Check both balance and withdrawable_amount
SELECT balance, withdrawable_amount 
INTO v_user_balance, v_user_withdrawable 
FROM profiles 
WHERE id = p_user_id;

-- Deduct from both balance and withdrawable_amount
UPDATE profiles
SET 
  balance = balance - v_product.price,
  withdrawable_amount = GREATEST(0, withdrawable_amount - v_product.price)
WHERE id = p_user_id;
```

**Problems**:
- Required withdrawable_amount to exist
- Deducted from withdrawable_amount (incorrect logic)
- Users couldn't purchase with recharged balance

### After (New Logic)
```sql
-- Check balance only
SELECT balance 
INTO v_user_balance 
FROM profiles 
WHERE id = p_user_id;

-- Deduct from balance only
UPDATE profiles
SET balance = balance - v_product.price
WHERE id = p_user_id;
```

**Benefits**:
- ✅ No dependency on withdrawable_amount
- ✅ Users can purchase with recharged balance
- ✅ Simpler and clearer logic
- ✅ Withdrawable amount preserved for earnings

## Updated Balance Flow

### Recharge Flow
```
User recharges ₹1,000
→ Balance: +₹1,000
→ Withdrawable: No change (₹0)
```

### Purchase Flow
```
User purchases ₹500 product
→ Balance: -₹500 (deducted)
→ Withdrawable: No change (₹0)
```

### Earnings Flow
```
User earns ₹50 daily
→ Balance: +₹50
→ Withdrawable: +₹50 (earnings are withdrawable)
```

### Withdrawal Flow
```
User withdraws ₹100
→ Balance: -₹100
→ Withdrawable: -₹100
```

## Complete Example Scenario

```
Day 1: User recharges ₹1,000
- Balance: ₹1,000
- Withdrawable: ₹0
- Status: Can purchase products ✅

Day 1: User purchases ₹500 product (30 days, ₹20/day)
- Balance: ₹500
- Withdrawable: ₹0
- Status: Product active, earning starts

Day 2: Daily earnings ₹20
- Balance: ₹520
- Withdrawable: ₹20
- Status: Can withdraw ₹20 ✅

Day 3: Daily earnings ₹20
- Balance: ₹540
- Withdrawable: ₹40
- Status: Can withdraw ₹40 ✅

Day 10: User withdraws ₹100
- Balance: ₹440
- Withdrawable: ₹60 (₹160 earned - ₹100 withdrawn)
- Status: Withdrawal successful ✅

Day 31: Product completed (30 days × ₹20 = ₹600 earned)
- Balance: ₹1,100 (₹500 remaining + ₹600 earned)
- Withdrawable: ₹560 (₹600 earned - ₹100 withdrawn + ₹60 previous)
- Total Earnings: ₹600
- Status: Product deactivated, can purchase new products ✅
```

## Key Points

### What Uses Balance
- ✅ **Product Purchase**: Checks and deducts from balance
- ✅ **Recharge**: Adds to balance
- ✅ **Daily Earnings**: Adds to balance
- ✅ **Lucky Draw**: Adds to balance
- ✅ **Withdrawal**: Deducts from balance

### What Uses Withdrawable Amount
- ✅ **Daily Earnings**: Adds to withdrawable (earnings are withdrawable)
- ✅ **Lucky Draw**: Adds to withdrawable (rewards are withdrawable)
- ✅ **Withdrawal**: Checks and deducts from withdrawable
- ❌ **Product Purchase**: Does NOT check or deduct from withdrawable
- ❌ **Recharge**: Does NOT add to withdrawable

### Balance vs Withdrawable

| Field | Purpose | Source |
|-------|---------|--------|
| **Balance** | Total funds available | Recharges + Earnings + Rewards - Purchases - Withdrawals |
| **Withdrawable** | Funds that can be withdrawn | Earnings + Rewards - Withdrawals |

**Rule**: You can only withdraw what you've earned, not what you've recharged.

## Database Function

### Function Name
`purchase_product(p_user_id UUID, p_product_id UUID)`

### Parameters
- `p_user_id`: User making the purchase
- `p_product_id`: Product being purchased

### Returns
```json
{
  "success": true,
  "user_product_id": "uuid",
  "transaction_id": "uuid"
}
```

### Logic Flow
1. **Validate Product**: Check product exists and is active
2. **Check Balance**: Verify user has sufficient balance
3. **Deduct Balance**: Subtract product price from balance only
4. **Create User Product**: Record purchase with contract details
5. **Create Transaction**: Log transaction for history
6. **Return Success**: Return IDs for tracking

### Error Handling
- **Product not found**: "Product not found or inactive"
- **Insufficient balance**: "Insufficient balance"
- **Database error**: Standard PostgreSQL error messages

## Testing

### Test Case 1: Successful Purchase
```sql
-- Setup: User with ₹1,000 balance
UPDATE profiles SET balance = 1000 WHERE id = '[user-id]';

-- Purchase ₹500 product
SELECT purchase_product('[user-id]', '[product-id]');

-- Verify: Balance should be ₹500
SELECT balance, withdrawable_amount FROM profiles WHERE id = '[user-id]';
-- Expected: balance = 500, withdrawable_amount = unchanged
```

### Test Case 2: Insufficient Balance
```sql
-- Setup: User with ₹100 balance
UPDATE profiles SET balance = 100 WHERE id = '[user-id]';

-- Try to purchase ₹500 product
SELECT purchase_product('[user-id]', '[product-id]');
-- Expected: ERROR: Insufficient balance
```

### Test Case 3: Multiple Purchases
```sql
-- Setup: User with ₹2,000 balance
UPDATE profiles SET balance = 2000 WHERE id = '[user-id]';

-- Purchase ₹500 product
SELECT purchase_product('[user-id]', '[product-1-id]');
-- Balance: ₹1,500

-- Purchase ₹800 product
SELECT purchase_product('[user-id]', '[product-2-id]');
-- Balance: ₹700

-- Verify
SELECT balance FROM profiles WHERE id = '[user-id]';
-- Expected: 700
```

## Migration Applied

**Migration Name**: `update_purchase_product_use_balance_only`

**Applied**: 2025-12-29

**Status**: ✅ Success

## Impact

### User Experience
- ✅ **Improved**: Users can now purchase products with recharged balance
- ✅ **Clearer**: Simpler logic, easier to understand
- ✅ **Fixed**: No more "withdrawable amount does not exist" error

### System Behavior
- ✅ **Balance**: Used for all purchases
- ✅ **Withdrawable**: Only for earnings and withdrawals
- ✅ **Transactions**: Properly recorded
- ✅ **Products**: Correctly activated after purchase

## Verification Checklist

- [x] Function updated in database
- [x] Migration applied successfully
- [x] No errors in function definition
- [x] Logic verified (balance only)
- [x] Withdrawable amount not touched
- [x] Transaction records created
- [x] User products created correctly
- [x] All code passes lint
- [x] Documentation created

## Related Documentation

- **DAILY_EARNINGS_COMPLETE.md**: Daily earnings system details
- **DAILY_EARNINGS_QUICK_REF.md**: Quick reference for earnings
- **TODO.md**: Project notes and status

## Summary

The product purchase logic has been updated to use **Total Balance only**. This fixes the "withdrawable amount does not exist" error and provides a clearer separation:

- **Balance**: For all transactions (recharges, purchases, earnings, withdrawals)
- **Withdrawable Amount**: Only for earnings that can be withdrawn

Users can now purchase products with their recharged balance, and earnings will be added to both balance and withdrawable amount, making them available for withdrawal.

---

**Status**: ✅ Fixed and Deployed
**Version**: 2.0
**Date**: 2025-12-29
