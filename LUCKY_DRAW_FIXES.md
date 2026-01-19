# Lucky Draw and Withdrawable Balance Fixes

## Issues Fixed

### 1. Lucky Draw Error: "Column withdrawable_amount does not exist"

**Problem**: The database column was named `withdrawable_balance` but the code was using `withdrawable_amount`.

**Root Cause**: Inconsistent naming between database schema and application code.

**Solution**: Updated all references from `withdrawable_amount` to `withdrawable_balance` throughout the application.

### 2. Wheel Size Not Responsive

**Problem**: The spinning wheel had a fixed size of 400x400px, not adapting to different screen sizes.

**Solution**: Implemented responsive sizing with container-based width calculation and window resize listener.

### 3. Admin Panel Currency Symbol

**Problem**: Admin Lucky Draw page showed "$" instead of "₹" for currency.

**Solution**: Updated currency label from "Amount ($)" to "Amount (₹)".

## Changes Made

### Database Functions

#### 1. Fixed `spin_lucky_draw` Function

**File**: Migration `fix_withdrawable_column_name`

**Changes**:
```sql
-- Before
UPDATE profiles
SET balance = balance + v_reward.reward_amount,
    withdrawable_amount = withdrawable_amount + v_reward.reward_amount
WHERE id = p_user_id;

-- After
UPDATE profiles
SET balance = balance + v_reward.reward_amount,
    withdrawable_balance = withdrawable_balance + v_reward.reward_amount
WHERE id = p_user_id;
```

#### 2. Fixed `update_user_balance` Function

**File**: Migration `fix_withdrawable_column_name`

**Changes**:
```sql
-- Before
UPDATE profiles
SET 
  balance = balance + p_amount,
  withdrawable_amount = withdrawable_amount + p_amount,
  total_earnings = total_earnings + p_amount
WHERE id = p_user_id;

-- After
UPDATE profiles
SET 
  balance = balance + p_amount,
  withdrawable_balance = withdrawable_balance + p_amount,
  total_earnings = total_earnings + p_amount
WHERE id = p_user_id;
```

### TypeScript Types

#### Updated Profile Interface

**File**: `src/types/types.ts`

**Changes**:
```typescript
// Before
export interface Profile {
  // ...
  withdrawable_amount: number;
  // ...
}

// After
export interface Profile {
  // ...
  withdrawable_balance: number;
  // ...
}
```

### Frontend Components

#### 1. HomePage Component

**File**: `src/pages/HomePage.tsx`

**Changes**:
- Updated `withdrawable_amount` to `withdrawable_balance`
- Added `CompanySetting` type import
- Fixed TypeScript type annotations for settings array

```typescript
// Before
₹{profile?.withdrawable_amount?.toFixed(2) || '0.00'}

// After
₹{profile?.withdrawable_balance?.toFixed(2) || '0.00'}
```

#### 2. WithdrawalPage Component

**File**: `src/pages/WithdrawalPage.tsx`

**Changes**:
- Updated all references from `withdrawable_amount` to `withdrawable_balance`
- Updated currency symbol from "$" to "₹"

```typescript
// Before
if (amountNum > profile.withdrawable_amount) { ... }
max={profile?.withdrawable_amount || 0}
₹{profile?.withdrawable_amount?.toFixed(2) || '0.00'}

// After
if (amountNum > profile.withdrawable_balance) { ... }
max={profile?.withdrawable_balance || 0}
₹{profile?.withdrawable_balance?.toFixed(2) || '0.00'}
```

#### 3. SpinWheel Component (Responsive)

**File**: `src/components/ui/SpinWheel.tsx`

**Changes**:
- Added container ref for width measurement
- Added canvas size state (default 400px)
- Added resize event listener
- Made font size responsive based on canvas size
- Made center circles responsive

**Key Features**:
```typescript
// Responsive sizing
const [canvasSize, setCanvasSize] = useState(400);

useEffect(() => {
  const updateSize = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const size = Math.min(containerWidth - 40, 400);
      setCanvasSize(size);
    }
  };

  updateSize();
  window.addEventListener('resize', updateSize);
  return () => window.removeEventListener('resize', updateSize);
}, []);

// Responsive font size
const fontSize = Math.max(14, canvasSize / 22);

// Responsive circles
const centerCircleRadius = canvasSize / 10;
const innerCircleRadius = canvasSize / 16;
```

#### 4. AdminLuckyDrawPage Component

**File**: `src/pages/admin/AdminLuckyDrawPage.tsx`

**Changes**:
- Updated currency label from "Amount ($)" to "Amount (₹)"

#### 5. AdminKycPage Component

**File**: `src/pages/admin/AdminKycPage.tsx`

**Changes**:
- Fixed TypeScript error by using `undefined` instead of `null`

```typescript
// Before
await kycApi.approveKycSubmission(viewingSubmission.id, adminNote || null);

// After
await kycApi.approveKycSubmission(viewingSubmission.id, adminNote || undefined);
```

## Database Schema

### Profiles Table Columns

| Column Name | Data Type | Purpose |
|-------------|-----------|---------|
| `balance` | numeric | Total funds (recharges + earnings - purchases - withdrawals) |
| `total_earnings` | numeric | Lifetime earnings tracking |
| `withdrawable_balance` | numeric | Funds available for withdrawal (earnings + rewards - withdrawals) |

**Note**: The column is named `withdrawable_balance`, NOT `withdrawable_amount`.

## Testing Checklist

- [x] Lucky draw spin works without errors
- [x] Winning amount is added to balance
- [x] Winning amount is added to withdrawable_balance
- [x] Transaction is recorded correctly
- [x] Toast notification shows correct amount
- [x] Wheel is responsive on mobile
- [x] Wheel is responsive on tablet
- [x] Wheel is responsive on desktop
- [x] Wheel resizes on window resize
- [x] Font size scales with wheel size
- [x] Center circles scale with wheel size
- [x] Withdrawal page shows correct withdrawable balance
- [x] Withdrawal validation uses correct field
- [x] Admin lucky draw page shows ₹ symbol
- [x] All TypeScript errors resolved
- [x] Code passes lint

## Responsive Wheel Behavior

### Mobile (< 400px width)
- Wheel size: Container width - 40px
- Font size: Minimum 14px, scales with wheel
- Center circle: 1/10 of wheel size
- Inner circle: 1/16 of wheel size

### Tablet/Desktop (≥ 400px width)
- Wheel size: Maximum 400px
- Font size: 18px (400 / 22)
- Center circle: 40px (400 / 10)
- Inner circle: 25px (400 / 16)

### Window Resize
- Automatically recalculates size
- Redraws wheel with new dimensions
- Maintains aspect ratio
- Smooth transition

## Files Modified

1. **Database Migration**: `fix_withdrawable_column_name`
   - Updated `spin_lucky_draw` function
   - Updated `update_user_balance` function

2. **TypeScript Types**: `src/types/types.ts`
   - Updated `Profile` interface

3. **Frontend Components**:
   - `src/pages/HomePage.tsx` - Updated withdrawable_balance reference
   - `src/pages/WithdrawalPage.tsx` - Updated withdrawable_balance references and currency
   - `src/components/ui/SpinWheel.tsx` - Made responsive
   - `src/pages/admin/AdminLuckyDrawPage.tsx` - Updated currency symbol
   - `src/pages/admin/AdminKycPage.tsx` - Fixed TypeScript error

## Verification Steps

### 1. Test Lucky Draw Spin

```
1. Login as user
2. Navigate to Lucky Draw page
3. Click "Spin Now!" button
4. Wait for wheel to stop spinning
5. Verify toast notification shows winning amount
6. Check profile balance increased
7. Check withdrawable_balance increased
8. Check transaction history shows lucky_draw entry
```

### 2. Test Responsive Wheel

```
1. Open Lucky Draw page on mobile device
2. Verify wheel fits within screen
3. Resize browser window
4. Verify wheel resizes accordingly
5. Check text remains readable
6. Verify center circles scale properly
```

### 3. Test Withdrawal

```
1. Login as user with withdrawable_balance > 0
2. Navigate to Withdrawal page
3. Verify correct withdrawable balance displayed
4. Enter amount less than withdrawable balance
5. Submit withdrawal request
6. Verify no errors occur
```

### 4. Test Admin Lucky Draw

```
1. Login as admin
2. Navigate to Admin > Lucky Draw
3. Verify currency symbol is ₹
4. Add/edit rewards
5. Save changes
6. Verify no errors occur
```

## Known Issues Resolved

1. ✅ "Column withdrawable_amount does not exist" error
2. ✅ Fixed wheel size on mobile devices
3. ✅ Currency symbol consistency (₹ instead of $)
4. ✅ TypeScript type errors
5. ✅ Withdrawal validation using correct field

## Future Enhancements

### Potential Improvements

1. **Wheel Animations**
   - Add confetti effect on win
   - Add sound effects
   - Add haptic feedback on mobile

2. **Responsive Optimizations**
   - Add landscape mode support
   - Optimize for very small screens (< 320px)
   - Add tablet-specific layout

3. **Admin Features**
   - Preview wheel with current configuration
   - Test spin functionality
   - Analytics dashboard for spin statistics

4. **User Experience**
   - Show probability percentages to users
   - Add spin history chart
   - Add leaderboard for biggest wins

---

**Status**: ✅ All Issues Fixed
**Version**: 2.0
**Date**: 2025-12-29
**Tested**: Yes
**Production Ready**: Yes
