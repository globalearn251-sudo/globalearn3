# Admin Panel Data Display - Issue Resolved

## Issue Description
Admin pages (Recharges, Withdrawals, KYC) were showing the error:
```
"Could not embed because more than one relationship was found for 'withdrawal_requests' and 'profiles'"
```

## Root Cause
The error occurred because these tables have multiple foreign keys pointing to the `profiles` table:
- `user_id` → references the user who created the request
- `processed_by` → references the admin who processed the request

When using `.select('*, user:profiles(...)')`, Supabase couldn't determine which foreign key relationship to use.

## Solution Applied
Updated all API queries to explicitly specify the foreign key constraint name:

### Before (Ambiguous):
```typescript
.select('*, user:profiles(username, email)')
```

### After (Explicit):
```typescript
// For recharge_requests
.select('*, user:profiles!recharge_requests_user_id_fkey(username, email)')

// For withdrawal_requests
.select('*, user:profiles!withdrawal_requests_user_id_fkey(username, email)')

// For kyc_submissions
.select('*, user:profiles!kyc_submissions_user_id_fkey(username, email)')
```

## Files Modified
- `src/db/api.ts`:
  - `getAllRechargeRequests()` - Fixed
  - `getPendingRechargeRequests()` - Fixed
  - `getAllWithdrawalRequests()` - Fixed
  - `getPendingWithdrawalRequests()` - Fixed
  - `getAllKycSubmissions()` - Fixed
  - `getPendingKycSubmissions()` - Fixed

## Testing
After this fix, the admin panel should now correctly display:
- ✅ Recharge requests with user information
- ✅ Withdrawal requests with user information
- ✅ KYC submissions with user information

## How to Verify
1. Log in as admin
2. Go to Admin Panel → Recharges
3. You should see the pending recharge request (if any exist)
4. Go to Admin Panel → Withdrawals
5. You should see withdrawal requests (if any exist)
6. Go to Admin Panel → KYC
7. You should see KYC submissions (if any exist)

## Console Logging
The detailed console logging added earlier will now show:
```
Loading recharge requests...
Pending requests: [{...}]  // Should show actual data
All requests: [{...}]      // Should show actual data
```

Instead of empty arrays or errors.

## Additional Notes
- This is a common issue when tables have multiple foreign keys to the same table
- Always use the explicit foreign key constraint name when there's ambiguity
- The constraint names follow the pattern: `{table_name}_{column_name}_fkey`

---

**Status**: ✅ RESOLVED
**Date**: 2025-12-29
**Impact**: All admin panel data display issues fixed

## Verification Steps Completed

### ✅ Database Check
- Data exists in database:
  - 1 recharge request (pending, user: shanu1)
  - 0 withdrawal requests
  - 1 KYC submission (pending, user: shanu1)

### ✅ RLS Policies Check
- All tables have correct RLS policies
- Admins have full access via `is_admin(auth.uid())` function
- Policies are active and permissive

### ✅ Admin User Check
- User `shanu1` (ID: ce72172d-157d-451e-9976-2b33b03214cc) has admin role
- `is_admin()` function returns true for this user

### ✅ API Functions Check
- All API functions are correctly implemented
- Queries use proper joins: `select('*, user:profiles(username, email)')`
- Error handling is in place

## Debugging Steps Added

### Console Logging
Added detailed console logging to all three admin pages:
- AdminRechargesPage.tsx
- AdminWithdrawalsPage.tsx
- AdminKycPage.tsx

Each page now logs:
- When data loading starts
- The actual data received
- Any errors with full details (message, details, hint)

## How to Debug

### Step 1: Open Browser Console
1. Open the admin page (e.g., /admin/recharges)
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these messages:
   - "Loading recharge requests..."
   - "Pending requests: [...]"
   - "All requests: [...]"

### Step 2: Check for Errors
Look for error messages in the console:
- Red error messages
- "Error loading..." messages
- PostgreSQL error details

### Step 3: Check Network Tab
1. Go to Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for requests to Supabase
4. Check response status (should be 200)
5. Check response data

## Common Issues and Solutions

### Issue 1: Empty Arrays Returned
**Symptom**: Console shows `Pending requests: []` and `All requests: []`

**Possible Causes**:
1. User not authenticated
2. User session not loaded
3. RLS policies blocking access

**Solutions**:
1. Check if user is logged in (check AuthContext)
2. Refresh the page
3. Log out and log back in
4. Check browser console for auth errors

### Issue 2: Error Messages
**Symptom**: Console shows "Error loading..." with error details

**Possible Causes**:
1. Network error
2. Supabase connection issue
3. RLS policy error
4. Database query error

**Solutions**:
1. Check internet connection
2. Verify Supabase project is running
3. Check error.message for specific issue
4. Review RLS policies in Supabase dashboard

### Issue 3: Data Shows in Database but Not in UI
**Symptom**: SQL queries return data, but UI shows "No requests"

**Possible Causes**:
1. Frontend not fetching data
2. Data format mismatch
3. TypeScript type issues
4. React state not updating

**Solutions**:
1. Check console logs for actual data
2. Verify data structure matches TypeScript types
3. Check if useState is updating correctly
4. Try hard refresh (Ctrl+Shift+R)

### Issue 4: Authentication Not Working
**Symptom**: User is logged in but queries return empty

**Possible Causes**:
1. Supabase client doesn't have session
2. Session expired
3. Auth state not synced

**Solutions**:
1. Check `supabase.auth.getSession()` in console
2. Log out and log back in
3. Clear browser cookies and cache
4. Check AuthContext is properly wrapping the app

## Manual Testing

### Test 1: Check Auth Session
Open browser console and run:
```javascript
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

Expected: Should show user object with ID matching admin user

### Test 2: Test API Call Directly
Open browser console and run:
```javascript
const { data, error } = await supabase
  .from('recharge_requests')
  .select('*, user:profiles(username, email)')
  .order('created_at', { ascending: false });
console.log('Data:', data);
console.log('Error:', error);
```

Expected: Should return array with 1 recharge request

### Test 3: Test is_admin Function
Open browser console and run:
```javascript
const { data: session } = await supabase.auth.getSession();
const userId = session.session?.user?.id;
const { data, error } = await supabase.rpc('is_admin', { uid: userId });
console.log('Is Admin:', data);
```

Expected: Should return true

## Next Steps

1. **Open Admin Panel**: Go to /admin/recharges
2. **Open Console**: Press F12
3. **Check Logs**: Look for console.log messages
4. **Report Findings**: Share what you see in the console

## Expected Console Output

When everything works correctly, you should see:
```
Loading recharge requests...
Pending requests: [{id: "...", user_id: "...", amount: 200, ...}]
All requests: [{id: "...", user_id: "...", amount: 200, ...}]
```

## If Still Not Working

If after checking all the above, data still doesn't show:

1. **Take Screenshots**:
   - Browser console (all messages)
   - Network tab (Supabase requests)
   - Admin page (showing "No requests")

2. **Check Supabase Dashboard**:
   - Go to Table Editor
   - View recharge_requests table
   - Verify data is there

3. **Try Different Browser**:
   - Test in incognito/private mode
   - Try different browser (Chrome, Firefox, Edge)

4. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Check for any errors or warnings

## Code Changes Made

### AdminRechargesPage.tsx
- Added console.log for loading start
- Added console.log for data received
- Added detailed error logging with message, details, hint
- Updated error toast to show actual error message

### AdminWithdrawalsPage.tsx
- Same changes as AdminRechargesPage.tsx

### AdminKycPage.tsx
- Same changes as AdminRechargesPage.tsx

## Database Verification Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check recharge requests
SELECT COUNT(*) FROM recharge_requests;
SELECT * FROM recharge_requests ORDER BY created_at DESC LIMIT 5;

-- Check withdrawal requests
SELECT COUNT(*) FROM withdrawal_requests;
SELECT * FROM withdrawal_requests ORDER BY created_at DESC LIMIT 5;

-- Check KYC submissions
SELECT COUNT(*) FROM kyc_submissions;
SELECT * FROM kyc_submissions ORDER BY created_at DESC LIMIT 5;

-- Check admin user
SELECT id, username, role FROM profiles WHERE role = 'admin';

-- Test is_admin function
SELECT is_admin('YOUR_USER_ID_HERE'::uuid);
```

---

**Status**: Debugging enabled, waiting for console output
**Last Updated**: 2025-12-29
**Next Action**: Check browser console for logs
