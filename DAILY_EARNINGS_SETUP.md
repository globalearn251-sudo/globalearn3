# Daily Earnings Automation - Setup Guide

## Overview

The daily earnings system automatically calculates and distributes earnings to users who have purchased investment products. This is implemented as a Supabase Edge Function that runs on a daily schedule.

## How It Works

### Process Flow:
1. **Trigger**: Function runs daily at a scheduled time (via cron)
2. **Query**: Fetches all active user products with remaining days > 0
3. **Calculate**: For each active product:
   - Adds daily_earning to user's balance and withdrawable_balance
   - Creates a transaction record
   - Updates total_earned for the product
   - Decrements days_remaining by 1
   - Deactivates product if days_remaining reaches 0
4. **Update**: Updates user's total_earnings in profiles table

### Database Operations:
- **user_products**: Updates days_remaining, total_earned, is_active
- **profiles**: Updates balance, withdrawable_balance, total_earnings
- **transactions**: Creates new earning records

## Edge Function Details

### Function Name: `daily-earnings`
### Status: ✅ Deployed and Active
### Version: 1

### Endpoint:
```
POST https://[your-project-ref].supabase.co/functions/v1/daily-earnings
```

### Authentication:
- Uses service role key for admin access
- No user authentication required (system function)

### Response Format:
```json
{
  "success": true,
  "message": "Processed 10 products, deactivated 2",
  "processed": 10,
  "deactivated": 2,
  "errors": []
}
```

## Manual Testing

### Test the Function Manually:

You can test the function using curl or any HTTP client:

```bash
curl -X POST \
  'https://[your-project-ref].supabase.co/functions/v1/daily-earnings' \
  -H 'Authorization: Bearer [your-anon-key]' \
  -H 'Content-Type: application/json'
```

### Expected Response:
- **Success**: Status 200 with processed count
- **Partial Success**: Status 207 with errors array
- **Failure**: Status 500 with error message

### Test Scenarios:

1. **No Active Products**:
   - Response: "No active products to process"
   - Processed: 0

2. **Active Products Exist**:
   - Response: "Processed X products, deactivated Y"
   - Processed: Number of products updated
   - Deactivated: Number of products that completed

3. **Product Completion**:
   - When days_remaining reaches 0
   - Product is_active set to false
   - User receives final earning

## Setting Up Cron Schedule

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** section
3. Find the `daily-earnings` function
4. Click **"Add Cron Trigger"**
5. Set schedule: `0 0 * * *` (runs daily at midnight UTC)
6. Save the trigger

### Option 2: Using pg_cron (Advanced)

If you have access to pg_cron extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily earnings function
SELECT cron.schedule(
  'daily-earnings-job',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url := 'https://[your-project-ref].supabase.co/functions/v1/daily-earnings',
    headers := '{"Authorization": "Bearer [your-service-role-key]", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### Option 3: External Cron Service

Use services like:
- **Cron-job.org**: Free cron service
- **EasyCron**: Reliable cron scheduler
- **GitHub Actions**: Scheduled workflows

Example GitHub Action:
```yaml
name: Daily Earnings
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Earnings
        run: |
          curl -X POST \
            'https://[your-project-ref].supabase.co/functions/v1/daily-earnings' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

## Cron Schedule Examples

- `0 0 * * *` - Every day at midnight UTC
- `0 2 * * *` - Every day at 2:00 AM UTC
- `0 12 * * *` - Every day at noon UTC
- `0 0 * * 1` - Every Monday at midnight
- `0 */6 * * *` - Every 6 hours

## Monitoring and Logs

### View Function Logs:

1. **Supabase Dashboard**:
   - Go to Edge Functions
   - Click on `daily-earnings`
   - View **Logs** tab

2. **Using Supabase CLI**:
```bash
supabase functions logs daily-earnings
```

### What to Monitor:

- **Processed Count**: Number of products updated
- **Deactivated Count**: Number of completed products
- **Errors**: Any failed operations
- **Execution Time**: Function performance
- **Success Rate**: Percentage of successful runs

### Log Messages:

- `Starting daily earnings calculation...`
- `Found X active products to process`
- `Processing product [id] for user [user_id]`
- `Successfully processed product [id]`
- `Product [id] completed and deactivated`
- `Daily earnings calculation completed`

## Troubleshooting

### Issue: Function Not Running

**Check**:
1. Cron trigger is properly configured
2. Function is deployed and active
3. Service role key is valid

**Solution**:
- Verify cron schedule syntax
- Test function manually first
- Check Supabase project status

### Issue: Products Not Updated

**Check**:
1. Products have is_active = true
2. Products have days_remaining > 0
3. Database permissions are correct

**Solution**:
- Query user_products table directly
- Check RLS policies
- Verify service role key has admin access

### Issue: Balance Not Updated

**Check**:
1. update_user_balance function exists
2. User profile exists
3. Transaction records are created

**Solution**:
- Run migration for update_user_balance
- Check profiles table structure
- Verify transactions table

### Issue: Partial Failures

**Check**:
- Function logs for specific errors
- Response errors array

**Solution**:
- Address specific product/user issues
- Retry failed operations manually
- Fix data inconsistencies

## Database Functions

### update_user_balance

Updates user's balance and earnings:

```sql
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id uuid,
  p_amount decimal
)
RETURNS void
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

## Testing Checklist

Before going live, test:

- [ ] Function deploys successfully
- [ ] Manual trigger works
- [ ] Active products are processed
- [ ] User balance updates correctly
- [ ] Transaction records are created
- [ ] Products deactivate when complete
- [ ] Logs show detailed information
- [ ] Error handling works properly
- [ ] Cron trigger is configured
- [ ] Monitoring is set up

## Security Considerations

1. **Service Role Key**: 
   - Never expose in client code
   - Only used in edge function environment
   - Rotated periodically

2. **Function Access**:
   - Can be called by anyone with anon key
   - No sensitive data in response
   - Idempotent (safe to run multiple times)

3. **Database Security**:
   - RLS policies don't affect service role
   - Function uses SECURITY DEFINER
   - Proper error handling prevents data leaks

## Performance Optimization

### Current Implementation:
- Processes products sequentially
- Creates individual transactions
- Updates one product at a time

### For Large Scale (1000+ products):
Consider batch operations:
```sql
-- Batch update example
UPDATE user_products
SET 
  days_remaining = days_remaining - 1,
  total_earned = total_earned + daily_earning,
  is_active = CASE WHEN days_remaining - 1 <= 0 THEN false ELSE true END
WHERE is_active = true AND days_remaining > 0;
```

## Maintenance

### Regular Tasks:
1. **Weekly**: Review function logs
2. **Monthly**: Check success rate
3. **Quarterly**: Optimize performance
4. **Yearly**: Review and update logic

### Updates:
To update the function:
1. Modify `supabase/functions/daily-earnings/index.ts`
2. Deploy: `supabase functions deploy daily-earnings`
3. Test manually before next scheduled run

## Support

### Common Questions:

**Q: What time does it run?**
A: Depends on your cron schedule. Default is midnight UTC.

**Q: Can I run it multiple times a day?**
A: Yes, but ensure logic handles this (currently designed for once daily).

**Q: What if it fails?**
A: Check logs, fix issues, and run manually to catch up.

**Q: How do I pause it?**
A: Disable the cron trigger in Supabase dashboard.

**Q: Can users see when earnings are added?**
A: Yes, via transaction history in their profile.

---

**Status**: ✅ Deployed and Ready
**Last Updated**: 2025-12-27
**Version**: 1.0
