# Daily Earnings System - Complete Implementation

## Overview
The daily earnings system automatically distributes earnings to users who have purchased investment products. Users receive daily earnings based on the product's daily_earning rate for the duration of the contract period.

---

## How It Works

### 1. Product Purchase
When a user purchases a product:
- Amount is deducted from user's balance
- Record created in `user_products` table with:
  - `daily_earning`: Amount to earn per day
  - `contract_days`: Total duration
  - `days_remaining`: Days left (starts at contract_days)
  - `total_earned`: Total earned so far (starts at 0)
  - `is_active`: true
  - `last_earning_date`: null (no earnings yet)

### 2. Daily Earnings Calculation
The edge function `daily-earnings` processes all active products:

**For each active product:**
1. Check if already received earnings today (skip if yes)
2. Decrease `days_remaining` by 1
3. Add `daily_earning` to `total_earned`
4. Update `last_earning_date` to today
5. Deactivate if `days_remaining` reaches 0
6. Add earnings to user's wallet balances:
   - `balance` (total balance)
   - `withdrawable_balance` (can withdraw)
   - `total_earnings` (lifetime earnings)
7. Create record in `daily_earnings` table
8. Create transaction record for history

### 3. User View
Users can view their earnings:
- **Home Page**: Shows total balance and earnings
- **Daily Earnings Page**: Shows:
  - Total earnings from all products
  - Active investments with progress
  - Complete earnings history by date

---

## Database Schema

### user_products Table
```sql
CREATE TABLE user_products (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  purchase_price NUMERIC NOT NULL,
  daily_earning NUMERIC NOT NULL,
  contract_days INTEGER NOT NULL,
  days_remaining INTEGER NOT NULL,
  total_earned NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_earning_date DATE NULL
);
```

### daily_earnings Table
```sql
CREATE TABLE daily_earnings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  user_product_id UUID REFERENCES user_products(id),
  amount NUMERIC NOT NULL,
  earning_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Edge Function: daily-earnings

### Location
`supabase/functions/daily-earnings/index.ts`

### Trigger Methods

#### 1. Manual Trigger (Admin)
Admin can manually trigger from Admin Panel → Daily Earnings:
- Click "Trigger Daily Earnings" button
- Processes all eligible products immediately
- Shows results (processed, deactivated, errors)

#### 2. Scheduled Trigger (Recommended)
Set up a cron job or scheduled task to call the edge function daily:

**Using Supabase Cron (if available):**
```sql
SELECT cron.schedule(
  'daily-earnings-calculation',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT net.http_post(
    url := 'https://yrxghqyxhkxiqcoqoksh.supabase.co/functions/v1/daily-earnings',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Using External Cron Service:**
- Use services like cron-job.org, EasyCron, or GitHub Actions
- Make POST request to edge function URL daily
- Include authorization header with service role key

### Function Logic

```typescript
// 1. Get today's date
const today = new Date().toISOString().split('T')[0];

// 2. Fetch active products that haven't received earnings today
const activeProducts = await supabase
  .from('user_products')
  .select('*')
  .eq('is_active', true)
  .gt('days_remaining', 0)
  .or(`last_earning_date.is.null,last_earning_date.neq.${today}`);

// 3. Process each product
for (const product of activeProducts) {
  // Calculate new values
  const newDaysRemaining = product.days_remaining - 1;
  const newTotalEarned = product.total_earned + product.daily_earning;
  const shouldDeactivate = newDaysRemaining <= 0;

  // Update user_products
  await supabase
    .from('user_products')
    .update({
      days_remaining: newDaysRemaining,
      total_earned: newTotalEarned,
      is_active: !shouldDeactivate,
      last_earning_date: today,
    })
    .eq('id', product.id);

  // Update user balance
  await supabase.rpc('update_user_balance', {
    p_user_id: product.user_id,
    p_amount: product.daily_earning,
  });

  // Create daily earnings record
  await supabase
    .from('daily_earnings')
    .insert({
      user_id: product.user_id,
      user_product_id: product.id,
      amount: product.daily_earning,
      earning_date: today,
    });

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: product.user_id,
      type: 'earning',
      amount: product.daily_earning,
      description: 'Daily earnings from product investment',
      reference_id: product.id,
    });
}
```

---

## API Functions

### dailyEarningsApi

#### calculateDailyEarnings()
Triggers the edge function to calculate and distribute earnings.

```typescript
const result = await dailyEarningsApi.calculateDailyEarnings();
// Returns: { success, message, processed, deactivated, errors }
```

#### getUserDailyEarnings(userId)
Gets user's complete earnings history with product details.

```typescript
const earnings = await dailyEarningsApi.getUserDailyEarnings(userId);
// Returns: DailyEarning[] with nested product information
```

#### getTotalEarnings(userId)
Calculates total earnings for a user.

```typescript
const total = await dailyEarningsApi.getTotalEarnings(userId);
// Returns: number (total amount earned)
```

---

## User Interface

### Home Page
**Action Buttons:**
- Recharge
- Withdraw
- **Earnings** (new) - navigates to /daily-earnings
- Invite

**Wallet Summary:**
- Total Balance
- Earnings (from daily earnings)
- Withdrawable Amount

### Daily Earnings Page (`/daily-earnings`)

**Features:**
1. **Total Earnings Card**
   - Shows lifetime total earnings
   - Prominent display at top

2. **Active Investments Section**
   - Lists all active products
   - Shows product image and name
   - Displays daily earning rate
   - Shows days remaining
   - Shows total earned so far

3. **Earnings History**
   - Chronological list of all earnings
   - Shows date and amount
   - Grouped by earning date
   - Empty state if no earnings yet

---

## Admin Interface

### Admin Earnings Page (`/admin/earnings`)

**Features:**
1. **Manual Trigger Button**
   - "Trigger Daily Earnings" button
   - Shows loading state while processing
   - Displays results after completion

2. **Results Display**
   - Success/failure status
   - Number of products processed
   - Number of products deactivated (completed)
   - List of errors (if any)

3. **Automation Status**
   - Information about scheduling
   - Instructions for setting up cron

---

## Wallet Balance Updates

### update_user_balance RPC Function

```sql
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    balance = balance + p_amount,
    withdrawable_balance = withdrawable_balance + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;
```

**What it does:**
- Adds earnings to user's total balance
- Adds earnings to withdrawable balance (user can withdraw)
- Tracks lifetime total earnings

---

## Duplicate Prevention

The system prevents duplicate earnings on the same day:

1. **last_earning_date field**: Tracks the last date earnings were distributed
2. **Query filter**: Only processes products where:
   - `last_earning_date IS NULL` (never received earnings), OR
   - `last_earning_date != today` (last earnings was on a different day)

This ensures:
- ✅ Users can't receive double earnings if function runs twice in one day
- ✅ Safe to manually trigger for testing
- ✅ Safe to run multiple times without side effects

---

## Testing the System

### Step 1: Purchase a Product
1. Login as a user
2. Go to Products page
3. Purchase a product (e.g., Solar - ₹10, Daily: ₹2, 30 days)
4. Verify balance deducted
5. Check user_products table:
   ```sql
   SELECT * FROM user_products WHERE user_id = 'your-user-id';
   ```
   Should show: `days_remaining = 30`, `total_earned = 0`, `is_active = true`

### Step 2: Trigger Daily Earnings
**Option A: Admin Panel**
1. Login as admin
2. Go to Admin Panel → Daily Earnings
3. Click "Trigger Daily Earnings"
4. Wait for results

**Option B: Direct API Call**
```typescript
import { dailyEarningsApi } from '@/db/api';
const result = await dailyEarningsApi.calculateDailyEarnings();
console.log(result);
```

### Step 3: Verify Results

**Check user_products:**
```sql
SELECT 
  id,
  days_remaining,
  total_earned,
  last_earning_date,
  is_active
FROM user_products 
WHERE user_id = 'your-user-id';
```
Should show:
- `days_remaining = 29` (decreased by 1)
- `total_earned = 2.00` (increased by daily_earning)
- `last_earning_date = today`
- `is_active = true`

**Check daily_earnings:**
```sql
SELECT * FROM daily_earnings WHERE user_id = 'your-user-id';
```
Should have one record with today's date and amount = 2.00

**Check user balance:**
```sql
SELECT 
  balance,
  withdrawable_balance,
  total_earnings
FROM profiles 
WHERE id = 'your-user-id';
```
All three should have increased by 2.00

**Check transactions:**
```sql
SELECT * FROM transactions 
WHERE user_id = 'your-user-id' 
  AND type = 'earning'
ORDER BY created_at DESC;
```
Should have a new transaction record

### Step 4: View in UI
1. Login as user
2. Go to Home page - check wallet balances updated
3. Click "Earnings" button
4. Should see:
   - Total earnings: ₹2.00
   - Active investment showing 29 days left
   - Earnings history with today's entry

### Step 5: Test Duplicate Prevention
1. Trigger daily earnings again immediately
2. Should process 0 products (already received today)
3. Verify no duplicate records in daily_earnings table

---

## Automation Setup

### Recommended: Daily Cron Job

**Using GitHub Actions (Free):**

Create `.github/workflows/daily-earnings.yml`:
```yaml
name: Daily Earnings Calculation

on:
  schedule:
    - cron: '0 0 * * *'  # Every day at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  calculate-earnings:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Earnings
        run: |
          curl -X POST \
            https://yrxghqyxhkxiqcoqoksh.supabase.co/functions/v1/daily-earnings \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

**Using cron-job.org:**
1. Sign up at cron-job.org
2. Create new cron job
3. URL: `https://yrxghqyxhkxiqcoqoksh.supabase.co/functions/v1/daily-earnings`
4. Method: POST
5. Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
6. Schedule: Daily at midnight
7. Save and enable

---

## Troubleshooting

### Issue: No earnings distributed

**Check 1: Are there active products?**
```sql
SELECT COUNT(*) FROM user_products 
WHERE is_active = true AND days_remaining > 0;
```

**Check 2: Did they already receive earnings today?**
```sql
SELECT * FROM user_products 
WHERE last_earning_date = CURRENT_DATE;
```

**Check 3: Check edge function logs**
- Go to Supabase Dashboard → Edge Functions → daily-earnings
- Check logs for errors

### Issue: Duplicate earnings

**Check last_earning_date:**
```sql
SELECT id, last_earning_date FROM user_products;
```
Should be updated to today after each run.

**Check daily_earnings records:**
```sql
SELECT user_id, earning_date, COUNT(*) 
FROM daily_earnings 
GROUP BY user_id, earning_date 
HAVING COUNT(*) > 1;
```
Should return no results (no duplicates).

### Issue: Balance not updating

**Check update_user_balance function:**
```sql
SELECT update_user_balance('user-id-here', 10);
```

**Check profiles table:**
```sql
SELECT balance, withdrawable_balance, total_earnings 
FROM profiles 
WHERE id = 'user-id-here';
```

---

## Summary

**System Status:** ✅ Fully Implemented and Deployed

**Components:**
- ✅ Edge function for daily earnings calculation
- ✅ Database tables and RPC functions
- ✅ User interface to view earnings
- ✅ Admin interface to trigger manually
- ✅ API functions for integration
- ✅ Duplicate prevention logic

**Next Steps:**
1. Test the system by purchasing a product
2. Manually trigger daily earnings from admin panel
3. Verify earnings appear in user's wallet and history
4. Set up automated daily cron job
5. Monitor for any issues

**User Flow:**
1. User purchases product → balance deducted
2. Daily (automated or manual) → earnings distributed
3. User checks "Earnings" page → sees history
4. User can withdraw earnings anytime

---

**Status**: ✅ Ready for Production Use
