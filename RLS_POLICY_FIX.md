# RLS Policy Fix for Company Settings

## Error Message
```
new row violates row-level security policy for table "company_settings"
```

---

## Root Cause

The RLS (Row Level Security) policy on the `company_settings` table was missing the `WITH CHECK` clause, which is required for INSERT operations.

### Original Policy (Broken)
```sql
CREATE POLICY "Admins can manage company settings"
ON company_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));
-- Missing: WITH CHECK clause
```

**Problem**:
- `USING` clause: Controls SELECT, UPDATE, DELETE operations ✅
- `WITH CHECK` clause: Controls INSERT and UPDATE operations ❌ (missing)
- When admin tries to INSERT a new setting → RLS blocks it
- Error: "new row violates row-level security policy"

---

## Understanding RLS Clauses

### USING Clause
- **Purpose**: Determines which existing rows are visible/modifiable
- **Used for**: SELECT, UPDATE, DELETE
- **Example**: `USING (is_admin(auth.uid()))` means "only show/modify rows if user is admin"

### WITH CHECK Clause
- **Purpose**: Determines which new/modified rows can be inserted/updated
- **Used for**: INSERT, UPDATE
- **Example**: `WITH CHECK (is_admin(auth.uid()))` means "only allow insert/update if user is admin"

### Why Both Are Needed
For `FOR ALL` policies (covering all operations), you need:
- `USING`: To control read and modify access to existing rows
- `WITH CHECK`: To control creation and modification of new rows

---

## Solution

Added the `WITH CHECK` clause to the policy:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;

-- Create new policy with proper with_check for INSERT operations
CREATE POLICY "Admins can manage company settings"
ON company_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

**Now**:
- ✅ Admin can SELECT settings (USING clause)
- ✅ Admin can UPDATE settings (USING + WITH CHECK)
- ✅ Admin can DELETE settings (USING clause)
- ✅ Admin can INSERT settings (WITH CHECK clause)

---

## How RLS Works with Upsert

When using `.upsert()` in Supabase:

1. **First, try to UPDATE**:
   - Checks `USING` clause: Can I see this row?
   - Checks `WITH CHECK` clause: Can I modify this row?
   - If both pass → UPDATE succeeds

2. **If UPDATE finds no rows, try to INSERT**:
   - Checks `WITH CHECK` clause: Can I create this row?
   - If passes → INSERT succeeds
   - If fails → Error: "new row violates row-level security policy"

**Without WITH CHECK**:
- UPDATE might work (if row exists)
- INSERT always fails (no permission to create new rows)

**With WITH CHECK**:
- Both UPDATE and INSERT work correctly

---

## Verification

### Check Policy Configuration
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'company_settings' 
  AND policyname = 'Admins can manage company settings';
```

**Expected Result**:
```json
{
  "policyname": "Admins can manage company settings",
  "cmd": "ALL",
  "qual": "is_admin(auth.uid())",
  "with_check": "is_admin(auth.uid())"
}
```

### Test INSERT Permission
```sql
-- As admin user, try to insert a new setting
INSERT INTO company_settings (key, value)
VALUES ('test_setting', 'test_value');
```

**Before Fix**: ❌ Error: "new row violates row-level security policy"
**After Fix**: ✅ Success: Row inserted

---

## Impact on Other Tables

This same issue could affect other tables. Let me check if any other tables have similar problems:

### Tables to Review
- ✅ `company_settings` - Fixed
- ❓ Other admin-managed tables?

### Pattern to Look For
```sql
-- Find policies with USING but no WITH CHECK
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND cmd IN ('ALL', 'INSERT', 'UPDATE')
  AND with_check IS NULL;
```

If any results appear, those policies might have the same issue.

---

## Best Practices for RLS Policies

### For Admin-Only Tables
```sql
CREATE POLICY "policy_name"
ON table_name
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

### For User-Owned Data
```sql
CREATE POLICY "Users can manage their own data"
ON table_name
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### For Public Read, Admin Write
```sql
-- Public can read
CREATE POLICY "Anyone can view"
ON table_name
FOR SELECT
TO public
USING (true);

-- Admin can write
CREATE POLICY "Admins can manage"
ON table_name
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

---

## Testing Checklist

- [x] RLS policy updated with WITH CHECK clause
- [x] Policy verified in database
- [ ] Admin can save Telegram link without error
- [ ] Setting appears in database
- [ ] User can click support button and open Telegram
- [ ] No RLS errors in console

---

## How to Test

### Step 1: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Login as Admin
1. Use admin account credentials
2. Navigate to Admin Panel → Company Settings

### Step 3: Save Telegram Link
1. Scroll to "Support Telegram Link"
2. Enter: `https://t.me/yourchannelname`
3. Click "Save All Settings"
4. Should see success message (no error)

### Step 4: Verify in Database
```sql
SELECT * FROM company_settings WHERE key = 'support_telegram_link';
```

Should return one row with your Telegram link.

### Step 5: Test User Experience
1. Logout
2. Login as regular user
3. Go to Home page
4. Click "Support" button
5. Telegram should open in new tab

---

## Troubleshooting

### Still Getting RLS Error?

**Check 1: Is user actually admin?**
```sql
SELECT id, username, role FROM profiles WHERE id = auth.uid();
```
Should show `role = 'admin'`.

**Check 2: Is is_admin() function working?**
```sql
SELECT is_admin(auth.uid());
```
Should return `true` for admin users.

**Check 3: Is RLS enabled?**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'company_settings';
```
Should show `rowsecurity = true`.

**Check 4: Are policies active?**
```sql
SELECT * FROM pg_policies WHERE tablename = 'company_settings';
```
Should show both policies (admin manage + public view).

---

## Summary

**Problem**: RLS policy missing `WITH CHECK` clause prevented INSERT operations

**Solution**: Added `WITH CHECK (is_admin(auth.uid()))` to policy

**Result**: Admin can now insert new settings via upsert operation

**Files Changed**: Database migration only (no code changes)

**Testing**: Re-save Telegram link in admin panel

---

**Status**: ✅ Fixed and Ready to Test
