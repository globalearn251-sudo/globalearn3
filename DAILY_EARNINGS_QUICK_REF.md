# Daily Earnings System - Quick Reference

## 🎯 What It Does

Automatically distributes daily earnings to users who have purchased investment products.

## 💰 Balance Management

### What Gets Updated
When daily earnings are distributed:
- ✅ **Balance**: +₹X (daily earning)
- ✅ **Withdrawable Amount**: +₹X (earnings are withdrawable)
- ✅ **Total Earnings**: +₹X (lifetime tracking)

### Withdrawable Amount Rules

| Action | Balance | Withdrawable |
|--------|---------|--------------|
| Recharge ₹1000 | +₹1000 | No change |
| Purchase ₹500 | -₹500 | No change |
| Daily Earning ₹50 | +₹50 | +₹50 ✅ |
| Lucky Draw ₹100 | +₹100 | +₹100 ✅ |
| Withdrawal ₹200 | -₹200 | -₹200 |

**Key Point**: Only earnings and rewards are withdrawable, not recharges! Purchases use balance only.

## 🔄 How It Works

### Daily Process
1. Fetch all active products (days_remaining > 0)
2. For each product:
   - Deduct 1 from days_remaining
   - Add daily_earning to total_earned
   - Update user balance (+balance, +withdrawable, +total_earnings)
   - Create daily_earnings record
   - Create transaction record
   - Deactivate if days_remaining = 0

### Example
```
Product: ₹1,000 investment
Daily Earning: ₹50
Contract: 30 days

Day 1:  Balance +₹50, Withdrawable +₹50, Days Left: 29
Day 2:  Balance +₹50, Withdrawable +₹50, Days Left: 28
...
Day 30: Balance +₹50, Withdrawable +₹50, Days Left: 0 (Deactivated)

Total Earned: ₹1,500 (30 × ₹50)
```

## 🚀 Execution Methods

### 1. Manual Trigger (Admin)
**Location**: Admin Panel → Daily Earnings

**Steps**:
1. Login as admin
2. Navigate to "Daily Earnings"
3. Click "Trigger Daily Earnings"
4. View results

**Use Case**: Testing, one-time execution, troubleshooting

### 2. Automatic Cron (Recommended)
**Setup**: Supabase Dashboard → Edge Functions → Cron Jobs

**Schedule**: `0 0 * * *` (midnight UTC daily)

**Use Case**: Production, hands-off operation

### 3. External Cron Service
**URL**: `https://[project-ref].supabase.co/functions/v1/daily-earnings`

**Headers**:
```
Authorization: Bearer [anon-key]
Content-Type: application/json
```

**Use Case**: Alternative to Supabase cron

## 📊 Monitoring

### Check Logs
**Supabase Dashboard** → Edge Functions → daily-earnings → Logs

**Look for**:
- "Processed X products"
- "Deactivated Y products"
- Any error messages

### Check User Balances
**Admin Panel** → Users

**Verify**:
- Balance increased
- Withdrawable amount increased
- Total earnings increased

### Database Queries
```sql
-- Today's earnings
SELECT u.username, de.amount, de.earning_date
FROM daily_earnings de
JOIN profiles u ON de.user_id = u.id
WHERE de.earning_date = CURRENT_DATE;

-- Active products
SELECT u.username, p.name, up.daily_earning, up.days_remaining
FROM user_products up
JOIN profiles u ON up.user_id = u.id
JOIN products p ON up.product_id = p.id
WHERE up.is_active = true;
```

## 🐛 Troubleshooting

### Earnings Not Distributed
**Check**:
1. ✅ Cron job is active
2. ✅ Edge function is deployed
3. ✅ Active products exist (days_remaining > 0)
4. ✅ Edge function logs for errors

**Solution**: Manually trigger from admin panel to test

### Withdrawable Not Updating
**Check**:
1. ✅ `update_user_balance` function exists
2. ✅ Function updates `withdrawable_amount` column
3. ✅ No database errors in logs

**Solution**: Query function definition:
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_user_balance';
```

### Products Not Deactivating
**Check**:
1. ✅ days_remaining = 0
2. ✅ is_active = false

**Solution**: Manually deactivate:
```sql
UPDATE user_products
SET is_active = false
WHERE days_remaining <= 0;
```

## 📝 Key Files

### Edge Function
- **Location**: `supabase/functions/daily-earnings/index.ts`
- **Version**: 2
- **Status**: Deployed and Active

### Database Function
- **Name**: `update_user_balance(p_user_id, p_amount)`
- **Purpose**: Updates balance, withdrawable_amount, total_earnings

### Tables
- `user_products` - Product status and earnings
- `daily_earnings` - Daily earning records
- `transactions` - Transaction history
- `profiles` - User balances

## ✅ Verification Checklist

Before going live:
- [ ] Edge function deployed (version 2)
- [ ] Cron job configured and active
- [ ] Test manual trigger works
- [ ] Verify balance updates correctly
- [ ] Verify withdrawable amount updates
- [ ] Check daily_earnings records created
- [ ] Check transaction records created
- [ ] Monitor logs for errors
- [ ] Test product deactivation at end

## 🎯 Quick Commands

### Deploy Edge Function
```bash
supabase functions deploy daily-earnings
```

### Test Locally
```bash
supabase functions serve daily-earnings
curl -X POST http://localhost:54321/functions/v1/daily-earnings
```

### Check Function Status
```sql
SELECT * FROM pg_proc WHERE proname = 'update_user_balance';
```

### View Recent Earnings
```sql
SELECT * FROM daily_earnings 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📞 Support

**Issue**: Earnings not working
**Action**: Check logs, manually trigger, verify cron

**Issue**: Balance incorrect
**Action**: Check transaction history, verify calculations

**Issue**: Function errors
**Action**: Review edge function logs, check database connection

---

**Status**: ✅ Fully Operational
**Version**: 2.0
**Last Updated**: 2025-12-29

**Documentation**: See DAILY_EARNINGS_COMPLETE.md for full details
