# Telegram Support Link Fix

## Issue
Admin added Telegram link in admin panel, but support button still shows "Support link not configured. Please contact admin."

---

## Root Cause

The `updateSetting` function in `src/db/api.ts` was using `.update()` which only updates **existing** records. When trying to save a new setting like `support_telegram_link` that doesn't exist in the database yet, the update operation fails silently (no error, but nothing is saved).

**Original Code (Broken)**:
```typescript
updateSetting: async (key: string, value: string) => {
  const { data, error } = await supabase
    .from('company_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)  // Only updates if key exists
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CompanySetting;
},
```

**Problem**: 
- `.update()` requires the record to exist
- If `support_telegram_link` doesn't exist, nothing happens
- No error is thrown, so admin thinks it saved successfully
- User clicks support button → link is empty → shows error message

---

## Solution

Changed `updateSetting` to use `.upsert()` which will:
- **Insert** the record if it doesn't exist
- **Update** the record if it already exists

**Fixed Code**:
```typescript
updateSetting: async (key: string, value: string) => {
  const { data, error } = await supabase
    .from('company_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }  // Use 'key' as unique identifier
    )
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CompanySetting;
},
```

**Benefits**:
- ✅ Works for new settings (insert)
- ✅ Works for existing settings (update)
- ✅ No need to check if setting exists first
- ✅ Simpler and more reliable

---

## How to Test

### Step 1: Clear Old Data (if needed)
If you already tried to save the Telegram link, it might not be in the database. No action needed - the fix will handle it.

### Step 2: Save Telegram Link Again
1. Login as admin
2. Go to Admin Panel → Company Settings
3. Scroll to "Support Telegram Link"
4. Enter your Telegram link (e.g., `https://t.me/yourchannelname`)
5. Click "Save All Settings"
6. Wait for success message

### Step 3: Verify It Saved
Open browser console and run:
```javascript
// This will show the saved link
fetch('/rest/v1/company_settings?key=eq.support_telegram_link', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

Or check in database:
```sql
SELECT * FROM company_settings WHERE key = 'support_telegram_link';
```

### Step 4: Test Support Button
1. Logout and login as regular user
2. Go to Home page
3. Click "Support" button
4. Should open Telegram in new tab
5. No error message should appear

---

## Expected Behavior

### Before Fix
1. Admin saves Telegram link → appears to succeed
2. Database check → setting doesn't exist
3. User clicks support → "Support link not configured" error
4. Admin confused why it's not working

### After Fix
1. Admin saves Telegram link → succeeds
2. Database check → setting exists with correct value
3. User clicks support → Telegram opens in new tab
4. Everything works as expected

---

## Database Schema

The `company_settings` table has a unique constraint on the `key` column:

```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `UNIQUE` constraint on `key` is what allows `upsert` to work with `onConflict: 'key'`.

---

## Impact on Other Settings

This fix improves **all** company settings, not just Telegram link:

**Settings that benefit**:
- ✅ `banner_url`
- ✅ `recharge_qr_code_url`
- ✅ `company_notice`
- ✅ `company_details`
- ✅ `referral_commission_percentage`
- ✅ `min_withdrawal_amount`
- ✅ `support_telegram_link`
- ✅ Any future settings added

**Before**: Had to manually insert new settings in database first
**After**: Can add new settings directly from admin panel

---

## Migration Note

If you have existing settings that were not saved due to this bug, you'll need to:

1. Go to Admin Panel → Company Settings
2. Re-enter the values
3. Click "Save All Settings"
4. They will now be saved correctly

No database migration needed - the fix is in the application code only.

---

## Files Modified

1. **src/db/api.ts**
   - Changed `updateSetting` from `.update()` to `.upsert()`
   - Added `onConflict: 'key'` option
   - Now handles both insert and update cases

---

## Testing Checklist

- [x] Fix applied to `src/db/api.ts`
- [x] Lint passed with no errors
- [ ] Admin can save Telegram link
- [ ] Setting appears in database
- [ ] User can click support button
- [ ] Telegram opens in new tab
- [ ] No error message appears
- [ ] Works for other settings too

---

## Summary

**Problem**: `updateSetting` only updated existing records, failed silently for new settings

**Solution**: Changed to `upsert` which handles both insert and update

**Result**: Telegram support link (and all future settings) now save correctly

**Action Required**: Re-save Telegram link in admin panel to apply the fix

---

**Status**: ✅ Fixed and Ready to Test
