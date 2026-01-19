# Withdrawable Amount Logic Update & Minimum Withdrawal Limit

## Date: 2025-12-29

## Overview
Updated the withdrawable amount logic to clarify that only earnings (daily earnings, lucky draw wins, and referral commissions) are withdrawable. Added a configurable minimum withdrawal limit that admins can set to prevent small withdrawal requests.

---

## Changes Implemented

### 1. Withdrawable Amount Clarification

**Current Logic (Already Correct)**:
The withdrawable_balance is ONLY increased by earnings:
- ✅ Daily earnings from products
- ✅ Lucky draw winnings
- ✅ Referral commissions

**NOT included in withdrawable_balance**:
- ❌ Recharge amounts (only added to balance)
- ❌ Product purchases (deducted from balance only)

**Database Functions Verified**:

1. **approve_recharge_request**: Only updates `balance`, NOT `withdrawable_balance`
   ```sql
   UPDATE profiles
   SET balance = balance + v_request.amount
   WHERE id = v_request.user_id
   ```

2. **update_user_balance** (used by daily earnings): Updates both `balance` AND `withdrawable_balance`
   ```sql
   UPDATE profiles
   SET 
     balance = balance + p_amount,
     withdrawable_balance = withdrawable_balance + p_amount,
     total_earnings = total_earnings + p_amount
   WHERE id = p_user_id;
   ```

3. **spin_lucky_draw**: Updates both `balance` AND `withdrawable_balance`
   ```sql
   UPDATE profiles
   SET balance = balance + v_reward.reward_amount,
       withdrawable_balance = withdrawable_balance + v_reward.reward_amount
   WHERE id = p_user_id
   ```

4. **purchase_product** (referral commission): Updates both `balance` AND `withdrawable_balance` for referrer
   ```sql
   UPDATE profiles
   SET 
     balance = balance + v_commission_amount,
     withdrawable_balance = withdrawable_balance + v_commission_amount,
     total_earnings = total_earnings + v_commission_amount
   WHERE id = v_referrer_id;
   ```

**Conclusion**: The withdrawable amount logic was already correctly implemented. No changes needed to database functions.

---

### 2. Minimum Withdrawal Limit Feature

**New Feature**: Admin-configurable minimum withdrawal amount

#### Database Changes

**Migration**: `add_minimum_withdrawal_limit`

```sql
-- Add minimum withdrawal limit setting (default 500)
INSERT INTO company_settings (key, value)
VALUES ('min_withdrawal_amount', '500')
ON CONFLICT (key) DO NOTHING;
```

#### Frontend Changes

##### A. WithdrawalPage.tsx

**Added Features**:
1. Load minimum withdrawal amount from company settings
2. Validate user's withdrawable balance against minimum
3. Validate withdrawal amount against minimum
4. Disable form if user's balance is below minimum
5. Show clear error messages and warnings

**Key Changes**:

```typescript
// Added state for minimum withdrawal amount
const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(500);

// Load settings on page load
useEffect(() => {
  loadSettings();
}, []);

const loadSettings = async () => {
  try {
    const settings = await companyApi.getAllSettings();
    const minSetting = settings.find(s => s.key === 'min_withdrawal_amount');
    if (minSetting) {
      setMinWithdrawalAmount(parseFloat(minSetting.value));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};
```

**Validation Logic**:

```typescript
// Check 1: User's total withdrawable balance must meet minimum
if (profile.withdrawable_balance < minWithdrawalAmount) {
  toast({
    title: 'Minimum Withdrawal Not Met',
    description: `Your withdrawable balance must be at least ₹${minWithdrawalAmount}...`,
    variant: 'destructive',
  });
  return;
}

// Check 2: Withdrawal amount must meet minimum
if (amountNum < minWithdrawalAmount) {
  toast({
    title: 'Amount Too Low',
    description: `Minimum withdrawal amount is ₹${minWithdrawalAmount}`,
    variant: 'destructive',
  });
  return;
}

// Check 3: Amount must not exceed available balance
if (amountNum > profile.withdrawable_balance) {
  toast({
    title: 'Insufficient Balance',
    description: 'You do not have enough withdrawable balance',
    variant: 'destructive',
  });
  return;
}
```

**UI Updates**:

1. **Alert showing balance and minimum**:
```tsx
<Alert>
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>
    <div className="space-y-1">
      <div>Withdrawable Balance: <span className="font-bold">₹{profile?.withdrawable_balance?.toFixed(2)}</span></div>
      <div className="text-sm">Minimum Withdrawal: <span className="font-semibold">₹{minWithdrawalAmount}</span></div>
    </div>
  </AlertDescription>
</Alert>
```

2. **Warning if below minimum**:
```tsx
{profile && profile.withdrawable_balance < minWithdrawalAmount && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Your withdrawable balance is below the minimum withdrawal limit of ₹{minWithdrawalAmount}. 
      You need at least ₹{(minWithdrawalAmount - profile.withdrawable_balance).toFixed(2)} more to withdraw.
    </AlertDescription>
  </Alert>
)}
```

3. **Input field with minimum**:
```tsx
<Input
  id="amount"
  type="number"
  step="0.01"
  min={minWithdrawalAmount}
  max={profile?.withdrawable_balance || 0}
  placeholder={`Enter amount (min: ₹${minWithdrawalAmount})`}
  disabled={loading || (profile ? profile.withdrawable_balance < minWithdrawalAmount : false)}
  required
/>
<p className="text-xs text-muted-foreground">
  Minimum withdrawal amount: ₹{minWithdrawalAmount}
</p>
```

4. **Submit button disabled if below minimum**:
```tsx
<Button 
  type="submit" 
  className="w-full" 
  disabled={
    loading || 
    !amount || 
    !bankDetails || 
    (profile ? profile.withdrawable_balance < minWithdrawalAmount : false)
  }
>
```

##### B. AdminSettingsPage.tsx

**Added Features**:
1. Input field for minimum withdrawal amount
2. Load and save minimum withdrawal setting
3. Clear description for admins

**Key Changes**:

```typescript
// Added state
const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('500');

// Load setting
if (s.key === 'min_withdrawal_amount') setMinWithdrawalAmount(s.value);

// Save setting
companyApi.updateSetting('min_withdrawal_amount', minWithdrawalAmount),
```

**UI Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Minimum Withdrawal Amount</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Label htmlFor="minWithdrawalAmount">Minimum Amount (₹)</Label>
      <Input
        id="minWithdrawalAmount"
        type="number"
        min="0"
        step="0.01"
        value={minWithdrawalAmount}
        onChange={(e) => setMinWithdrawalAmount(e.target.value)}
        placeholder="Enter minimum withdrawal amount (e.g., 500)"
      />
      <p className="text-sm text-muted-foreground">
        Users must have at least this amount in their withdrawable balance to submit a withdrawal request
      </p>
    </div>
  </CardContent>
</Card>
```

---

## User Experience Flow

### Scenario 1: User Below Minimum (Balance: ₹300, Minimum: ₹500)

1. User navigates to Withdrawal page
2. Sees alert: "Withdrawable Balance: ₹300.00" and "Minimum Withdrawal: ₹500"
3. Sees red warning: "Your withdrawable balance is below the minimum withdrawal limit of ₹500. You need at least ₹200.00 more to withdraw."
4. Amount input field is disabled
5. Submit button is disabled
6. User cannot submit withdrawal request

**User Action**: Must earn ₹200 more through:
- Daily earnings from products
- Lucky draw wins
- Referral commissions

### Scenario 2: User Above Minimum (Balance: ₹800, Minimum: ₹500)

1. User navigates to Withdrawal page
2. Sees alert: "Withdrawable Balance: ₹800.00" and "Minimum Withdrawal: ₹500"
3. No warning shown
4. Amount input field is enabled with min="500"
5. User enters amount (e.g., ₹600)
6. If amount < ₹500: Error toast "Amount Too Low"
7. If amount > ₹800: Error toast "Insufficient Balance"
8. If ₹500 ≤ amount ≤ ₹800: Request submitted successfully

### Scenario 3: Admin Configuration

1. Admin navigates to Settings page
2. Scrolls to "Minimum Withdrawal Amount" card
3. Sees current value (e.g., 500)
4. Changes to new value (e.g., 1000)
5. Clicks "Save All Settings"
6. Success toast shown
7. All users now see new minimum of ₹1000

---

## Benefits

### For Platform Owners
1. **Reduce Processing Overhead**: Fewer small withdrawal requests to process manually
2. **Transaction Cost Management**: Avoid processing fees for tiny amounts
3. **Fraud Prevention**: Minimum threshold discourages abuse
4. **Flexible Control**: Can adjust minimum based on business needs

### For Users
1. **Clear Expectations**: Know exactly how much they need to withdraw
2. **Transparent Rules**: See minimum amount upfront
3. **Helpful Guidance**: Warnings show how much more they need to earn
4. **Earnings Tracking**: Only earnings are withdrawable (clear separation)

---

## Technical Details

### Files Modified
1. **Database**: 
   - Migration: `00014_add_minimum_withdrawal_limit.sql`
   - Added: `min_withdrawal_amount` setting (default: 500)

2. **Frontend**:
   - `src/pages/WithdrawalPage.tsx`: Added minimum validation and UI updates
   - `src/pages/admin/AdminSettingsPage.tsx`: Added minimum withdrawal configuration

### Validation Points
1. **Client-side** (WithdrawalPage.tsx):
   - Check user's total withdrawable balance ≥ minimum
   - Check withdrawal amount ≥ minimum
   - Check withdrawal amount ≤ available balance
   - Disable form if conditions not met

2. **User Feedback**:
   - Toast notifications for validation errors
   - Alert banner showing current balance and minimum
   - Warning alert if below minimum
   - Helper text on input field
   - Disabled state with visual feedback

### Default Values
- **Minimum Withdrawal Amount**: ₹500
- **Referral Commission**: 5%

---

## Testing Checklist

### User Testing
- [ ] User with balance < minimum cannot submit withdrawal
- [ ] User with balance ≥ minimum can submit withdrawal
- [ ] User cannot enter amount < minimum
- [ ] User cannot enter amount > available balance
- [ ] Warning message shows correct amount needed
- [ ] Form is disabled when below minimum
- [ ] Submit button is disabled when below minimum

### Admin Testing
- [ ] Admin can view current minimum withdrawal amount
- [ ] Admin can change minimum withdrawal amount
- [ ] Changes are saved successfully
- [ ] New minimum applies to all users immediately
- [ ] Setting persists after page reload

### Edge Cases
- [ ] Minimum set to 0 (allows any amount)
- [ ] Minimum set to very high value (e.g., 100000)
- [ ] User's balance exactly equals minimum
- [ ] Withdrawal amount exactly equals minimum
- [ ] Multiple users with different balances

---

## Example Scenarios

### Example 1: New User Journey
```
Day 1: User registers, recharges ₹5000
- Balance: ₹5000
- Withdrawable Balance: ₹0 (recharge not withdrawable)
- Can withdraw? NO (below ₹500 minimum)

Day 2: User purchases ₹1000 product (daily earning: ₹50)
- Balance: ₹4000
- Withdrawable Balance: ₹0
- Can withdraw? NO

Day 3-12: Daily earnings accumulate (₹50 × 10 days = ₹500)
- Balance: ₹4500
- Withdrawable Balance: ₹500
- Can withdraw? YES (exactly at minimum)

Day 13: User wins ₹200 in lucky draw
- Balance: ₹4700
- Withdrawable Balance: ₹700
- Can withdraw? YES (can withdraw ₹500-₹700)
```

### Example 2: Referral Earnings
```
User A refers User B

User B purchases ₹2000 product
- Commission: 5% = ₹100
- User A's withdrawable balance: +₹100

User B purchases another ₹3000 product
- Commission: 5% = ₹150
- User A's withdrawable balance: +₹150

Total: User A has ₹250 in withdrawable balance
- Can withdraw? NO (below ₹500 minimum)
- Needs: ₹250 more to reach minimum
```

---

## Summary

### What Changed
1. ✅ Clarified withdrawable amount logic (already correct in code)
2. ✅ Added minimum withdrawal limit feature
3. ✅ Added admin configuration for minimum amount
4. ✅ Added comprehensive user validation and feedback
5. ✅ Added clear UI indicators and warnings

### What Stayed the Same
- Withdrawable balance calculation (already correct)
- Daily earnings system
- Lucky draw system
- Referral commission system
- Recharge system (still only adds to balance)

### Impact
- **Users**: Clear understanding of withdrawal requirements
- **Admins**: Control over minimum withdrawal threshold
- **Platform**: Reduced processing overhead for small withdrawals

---

**Implementation Status**: ✅ Complete
**Lint Status**: ✅ All checks pass
**Testing Required**: User acceptance testing recommended
