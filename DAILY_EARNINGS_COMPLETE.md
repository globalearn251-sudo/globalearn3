# Daily Earnings System - Complete Documentation

## Overview
The Daily Earnings System automatically calculates and distributes daily income to users who have purchased investment products. The system runs daily and adds earnings to both the user's balance and withdrawable amount.

## How It Works

### Automatic Daily Process
1. **Fetch Active Products**: Retrieves all active user products with remaining days > 0
2. **Calculate Earnings**: For each product, calculates the daily earning amount
3. **Update User Balance**: Adds earnings to user's balance and withdrawable amount
4. **Create Records**: Creates daily_earnings and transaction records for tracking
5. **Update Product Status**: Decrements days_remaining and deactivates when complete

### Balance Management
When daily earnings are distributed:
- ✅ **Balance**: Increased by daily earning amount
- ✅ **Withdrawable Amount**: Increased by daily earning amount (earnings are withdrawable)
- ✅ **Total Earnings**: Increased by daily earning amount (lifetime tracking)

### Example Flow
```
User purchases product:
- Price: ₹1,000
- Daily Earning: ₹50
- Contract Days: 30

Day 1:
- Balance: +₹50
- Withdrawable Amount: +₹50
- Total Earnings: +₹50
- Days Remaining: 29

Day 2:
- Balance: +₹50
- Withdrawable Amount: +₹50
- Total Earnings: +₹100
- Days Remaining: 28

...

Day 30:
- Balance: +₹50
- Withdrawable Amount: +₹50
- Total Earnings: +₹1,500
- Days Remaining: 0
- Product Status: Deactivated (completed)
```

## Database Components

### Tables Involved

#### 1. user_products
Tracks user's purchased products and their earning status.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who purchased |
| product_id | UUID | Product purchased |
| purchase_price | NUMERIC | Original purchase price |
| daily_earning | NUMERIC | Daily earning amount |
| contract_days | INTEGER | Total contract days |
| days_remaining | INTEGER | Days left to earn |
| total_earned | NUMERIC | Total earned so far |
| is_active | BOOLEAN | Active status |
| purchased_at | TIMESTAMPTZ | Purchase timestamp |

#### 2. daily_earnings
Records each daily earning distribution.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who earned |
| user_product_id | UUID | Product that generated earning |
| amount | NUMERIC | Earning amount |
| earning_date | DATE | Date of earning |
| created_at | TIMESTAMPTZ | Record creation time |

#### 3. profiles
User account with balance information.

| Column | Type | Description |
|--------|------|-------------|
| balance | NUMERIC | Total balance |
| withdrawable_amount | NUMERIC | Amount available for withdrawal |
| total_earnings | NUMERIC | Lifetime total earnings |

#### 4. transactions
Transaction history for all financial activities.

| Column | Type | Description |
|--------|------|-------------|
| type | TEXT | 'earning' for daily earnings |
| amount | NUMERIC | Transaction amount |
| description | TEXT | Transaction description |
| reference_id | UUID | Links to user_product |

### RPC Function: update_user_balance

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
  -- Update user's balance, withdrawable_amount, and total_earnings
  UPDATE profiles
  SET 
    balance = balance + p_amount,
    withdrawable_amount = withdrawable_amount + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$;
```

**What it does**:
- Adds earning amount to balance
- Adds earning amount to withdrawable_amount (makes it withdrawable)
- Adds earning amount to total_earnings (lifetime tracking)
- Raises exception if user not found

## Edge Function: daily-earnings

### Location
`supabase/functions/daily-earnings/index.ts`

### Functionality

#### 1. Fetch Active Products
```typescript
const { data: activeProducts } = await supabase
  .from('user_products')
  .select('*')
  .eq('is_active', true)
  .gt('days_remaining', 0);
```

#### 2. Process Each Product
For each active product:

**a. Update Product Status**
```typescript
const newDaysRemaining = product.days_remaining - 1;
const newTotalEarned = product.total_earned + product.daily_earning;
const shouldDeactivate = newDaysRemaining <= 0;

await supabase
  .from('user_products')
  .update({
    days_remaining: newDaysRemaining,
    total_earned: newTotalEarned,
    is_active: !shouldDeactivate,
  })
  .eq('id', product.id);
```

**b. Update User Balance**
```typescript
await supabase.rpc('update_user_balance', {
  p_user_id: product.user_id,
  p_amount: product.daily_earning,
});
```

**c. Create Daily Earnings Record**
```typescript
const today = new Date().toISOString().split('T')[0];
await supabase
  .from('daily_earnings')
  .insert({
    user_id: product.user_id,
    user_product_id: product.id,
    amount: product.daily_earning,
    earning_date: today,
  });
```

**d. Create Transaction Record**
```typescript
await supabase
  .from('transactions')
  .insert({
    user_id: product.user_id,
    type: 'earning',
    amount: product.daily_earning,
    description: 'Daily earnings from product investment',
    reference_id: product.id,
  });
```

#### 3. Return Results
```typescript
{
  success: true,
  message: "Processed X products, deactivated Y",
  processed: number,
  deactivated: number,
  errors: string[]
}
```

### Error Handling
- **Partial Success**: If some products fail, continues processing others
- **Error Tracking**: Collects all errors and returns them in response
- **Status Code**: 200 for full success, 207 for partial success, 500 for fatal error
- **Logging**: Comprehensive console logging for debugging

## Execution Methods

### 1. Manual Trigger (Admin Panel)
Admins can manually trigger the daily earnings calculation from the admin panel.

**Location**: Admin Panel → Daily Earnings

**Steps**:
1. Navigate to Admin Panel
2. Click "Daily Earnings" in sidebar
3. Click "Trigger Daily Earnings" button
4. View results (processed count, deactivated count, errors)

### 2. Automatic Cron Job (Recommended)
Set up a cron job in Supabase Dashboard to run automatically every day.

**Setup Instructions**:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "Edge Functions" section
   - Find "daily-earnings" function

2. **Set Up Cron Trigger**
   - Click on "Cron Jobs" or "Triggers"
   - Create new cron job
   - **Schedule**: `0 0 * * *` (runs at midnight UTC every day)
   - **Function**: daily-earnings
   - **Method**: POST
   - **Headers**: Include authorization header

3. **Alternative Schedule Options**:
   - `0 1 * * *` - 1:00 AM UTC daily
   - `0 2 * * *` - 2:00 AM UTC daily
   - `0 */12 * * *` - Every 12 hours
   - `0 0 * * 1` - Every Monday at midnight

4. **Verify Setup**:
   - Check cron job is active
   - Monitor first execution
   - Review logs for any errors

### 3. External Cron Service
Use an external service like cron-job.org or EasyCron.

**Setup**:
1. Get your edge function URL:
   ```
   https://[project-ref].supabase.co/functions/v1/daily-earnings
   ```

2. Get your anon key from Supabase Dashboard

3. Configure cron job:
   - **URL**: Your edge function URL
   - **Method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer [your-anon-key]
     Content-Type: application/json
     ```
   - **Schedule**: Daily at preferred time

## Monitoring & Logs

### Check Execution Logs

**Supabase Dashboard**:
1. Go to Edge Functions
2. Select "daily-earnings"
3. View "Logs" tab
4. Check for:
   - Execution time
   - Number of products processed
   - Any errors
   - Deactivated products

**Log Messages**:
```
Starting daily earnings calculation...
Found X active products to process
Processing product [id] for user [id]
Successfully processed product [id]
Product [id] completed and deactivated
Daily earnings calculation completed
Processed: X, Deactivated: Y, Errors: Z
```

### Monitor User Balances

**Admin Panel**:
- View user balances in Users page
- Check transaction history
- Verify daily_earnings records

**Database Queries**:
```sql
-- Check today's earnings
SELECT 
  u.username,
  de.amount,
  de.earning_date
FROM daily_earnings de
JOIN profiles u ON de.user_id = u.id
WHERE de.earning_date = CURRENT_DATE
ORDER BY de.created_at DESC;

-- Check active products
SELECT 
  u.username,
  p.name as product_name,
  up.daily_earning,
  up.days_remaining,
  up.total_earned
FROM user_products up
JOIN profiles u ON up.user_id = u.id
JOIN products p ON up.product_id = p.id
WHERE up.is_active = true
ORDER BY up.days_remaining ASC;

-- Check user balance changes
SELECT 
  username,
  balance,
  withdrawable_amount,
  total_earnings
FROM profiles
WHERE role = 'user'
ORDER BY total_earnings DESC;
```

## Withdrawable Amount Management

### How Withdrawable Amount Works

#### Sources that ADD to Withdrawable Amount:
1. ✅ **Daily Earnings**: Earnings are withdrawable
2. ✅ **Lucky Draw Rewards**: Bonus rewards are withdrawable
3. ❌ **Recharges**: NOT added to withdrawable (used for investment)

#### Actions that DEDUCT from Withdrawable Amount:
1. ✅ **Withdrawal**: Deducts from withdrawable amount
2. ❌ **Product Purchase**: Does NOT deduct from withdrawable (uses balance only)

### Balance vs Withdrawable Amount

| Action | Balance | Withdrawable Amount |
|--------|---------|---------------------|
| Recharge ₹1000 | +₹1000 | No change |
| Purchase ₹500 product | -₹500 | No change |
| Earn ₹50 daily | +₹50 | +₹50 |
| Lucky draw ₹100 | +₹100 | +₹100 |
| Withdraw ₹200 | -₹200 | -₹200 |

### Example Scenario

```
Initial State:
- Balance: ₹0
- Withdrawable: ₹0

Day 1: User recharges ₹1,000
- Balance: ₹1,000
- Withdrawable: ₹0

Day 1: User purchases ₹500 product (50 days, ₹10/day)
- Balance: ₹500
- Withdrawable: ₹0 (unchanged)

Day 2: Daily earnings ₹10
- Balance: ₹510
- Withdrawable: ₹10

Day 3: Daily earnings ₹10
- Balance: ₹520
- Withdrawable: ₹20

Day 10: User wants to withdraw ₹50
- Can withdraw: ₹80 (8 days × ₹10)
- After withdrawal:
  - Balance: ₹470
  - Withdrawable: ₹30

Day 51: Product completed (50 days × ₹10 = ₹500 earned)
- Balance: ₹1,000 (₹500 initial + ₹500 earned - ₹50 withdrawn)
- Withdrawable: ₹450 (₹500 earned - ₹50 withdrawn)
- Total Earnings: ₹500
```

## Troubleshooting

### Issue: Earnings Not Distributed

**Possible Causes**:
1. Cron job not set up or inactive
2. Edge function not deployed
3. No active products with days_remaining > 0
4. Database connection issues

**Solutions**:
1. Check cron job status in Supabase Dashboard
2. Verify edge function is deployed and active
3. Query database for active products:
   ```sql
   SELECT COUNT(*) FROM user_products 
   WHERE is_active = true AND days_remaining > 0;
   ```
4. Check edge function logs for errors
5. Manually trigger from admin panel to test

### Issue: Withdrawable Amount Not Updating

**Possible Causes**:
1. `update_user_balance` function not updating withdrawable_amount
2. Database column name mismatch

**Solutions**:
1. Verify RPC function definition:
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'update_user_balance';
   ```
2. Check that function updates `withdrawable_amount` column
3. Test function manually:
   ```sql
   SELECT update_user_balance('[user-id]', 10);
   SELECT balance, withdrawable_amount FROM profiles WHERE id = '[user-id]';
   ```

### Issue: Products Not Deactivating

**Possible Causes**:
1. days_remaining not decrementing
2. is_active not being set to false

**Solutions**:
1. Check edge function logic for product updates
2. Verify database updates:
   ```sql
   SELECT id, days_remaining, is_active, total_earned
   FROM user_products
   WHERE days_remaining <= 0;
   ```
3. Manually deactivate if needed:
   ```sql
   UPDATE user_products
   SET is_active = false
   WHERE days_remaining <= 0;
   ```

### Issue: Duplicate Earnings

**Possible Causes**:
1. Cron job running multiple times
2. Manual trigger while cron is running
3. No unique constraint on daily_earnings

**Solutions**:
1. Check cron job schedule (should run once daily)
2. Add unique constraint:
   ```sql
   ALTER TABLE daily_earnings
   ADD CONSTRAINT unique_daily_earning
   UNIQUE (user_product_id, earning_date);
   ```
3. Review edge function logs for duplicate executions

## Best Practices

### For Admins
1. **Monitor Daily**: Check logs daily to ensure earnings are distributed
2. **Verify Balances**: Spot-check user balances match expected earnings
3. **Review Errors**: Address any errors in edge function logs promptly
4. **Test Changes**: Use manual trigger to test before relying on cron
5. **Backup Data**: Regular database backups before major changes

### For Developers
1. **Error Handling**: Always handle errors gracefully, continue processing
2. **Logging**: Comprehensive logging for debugging
3. **Idempotency**: Ensure function can be safely re-run
4. **Testing**: Test with various scenarios (0 products, many products, errors)
5. **Monitoring**: Set up alerts for function failures

### For Users
1. **Check Daily**: Verify earnings appear in transaction history
2. **Track Progress**: Monitor days_remaining on active products
3. **Withdrawable Amount**: Only earnings are withdrawable, not recharges
4. **Contact Support**: Report any discrepancies immediately

## Performance Considerations

### Optimization Tips
1. **Batch Processing**: Process products in batches if volume is high
2. **Indexing**: Ensure proper indexes on user_products (is_active, days_remaining)
3. **Connection Pooling**: Use connection pooling for database access
4. **Timeout**: Set appropriate timeout for edge function
5. **Retry Logic**: Implement retry for transient failures

### Scalability
- **Current**: Handles hundreds of products efficiently
- **Future**: May need batch processing for thousands of products
- **Monitoring**: Track execution time as user base grows

## Security

### Access Control
- **Edge Function**: Uses service role key for admin access
- **RPC Function**: SECURITY DEFINER for controlled access
- **Admin Panel**: Only admins can manually trigger
- **Cron Job**: Secured with authorization header

### Data Integrity
- **Transactions**: All updates in single transaction where possible
- **Validation**: Validates user exists before updating balance
- **Error Recovery**: Continues processing even if individual products fail
- **Audit Trail**: Creates records in daily_earnings and transactions

## Summary

The Daily Earnings System is a robust, automated solution for distributing investment earnings to users. Key features:

✅ **Automatic**: Runs daily via cron job
✅ **Reliable**: Comprehensive error handling and logging
✅ **Transparent**: Creates detailed records for tracking
✅ **Withdrawable**: Earnings are immediately withdrawable
✅ **Scalable**: Handles growing user base efficiently
✅ **Monitored**: Easy to monitor via logs and admin panel

**Status**: ✅ Fully Implemented and Production Ready

---

**Version**: 2.0
**Last Updated**: 2025-12-29
**Edge Function Version**: 2
**Status**: Active and Deployed
