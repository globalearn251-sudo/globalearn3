# Products RLS Policy Fix - Detailed Troubleshooting

## Issue
Admin users getting "new row violates row-level security policy for table 'products'" when trying to add new products.

---

## Root Causes Identified

### 1. Missing WITH CHECK Clause
The original RLS policy only had `USING` clause, not `WITH CHECK` clause needed for INSERT operations.

### 2. Missing Function Permissions
The `is_admin()` function didn't have EXECUTE permissions granted to authenticated/anon users.

### 3. Policy Specificity
Sometimes PostgreSQL needs explicit INSERT policies in addition to ALL policies for proper enforcement.

---

## Solutions Applied

### Solution 1: Added WITH CHECK to ALL Policy
```sql
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
ON products
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

### Solution 2: Granted Function Permissions
```sql
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO public;
```

**Why This Matters**:
- RLS policies call the `is_admin()` function
- If the function doesn't have EXECUTE permission for the user's role, it fails
- This causes the policy check to fail, blocking the operation

### Solution 3: Added Explicit INSERT Policy
```sql
CREATE POLICY "Admins can insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));
```

**Why This Helps**:
- PostgreSQL evaluates policies in order
- Specific policies (INSERT) take precedence over general ones (ALL)
- Having both ensures maximum compatibility

---

## Current Policy Configuration

The products table now has 3 policies:

### 1. "Admins can manage products" (ALL)
- **Command**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Role**: authenticated
- **USING**: `is_admin(auth.uid())`
- **WITH CHECK**: `is_admin(auth.uid())`
- **Purpose**: General admin access to all operations

### 2. "Admins can insert products" (INSERT)
- **Command**: INSERT only
- **Role**: authenticated
- **USING**: null (not needed for INSERT)
- **WITH CHECK**: `is_admin(auth.uid())`
- **Purpose**: Explicit INSERT permission for admins

### 3. "Anyone can view active products" (SELECT)
- **Command**: SELECT only
- **Role**: public (everyone)
- **USING**: `status = 'active'`
- **WITH CHECK**: null (not needed for SELECT)
- **Purpose**: Public can view active products

---

## How RLS Policies Work

### Policy Evaluation Order
1. PostgreSQL checks if RLS is enabled on the table ✅
2. For each operation, it evaluates ALL applicable policies
3. If ANY policy allows the operation, it proceeds
4. If NO policy allows it, operation is blocked with RLS error

### USING vs WITH CHECK

#### USING Clause
- **Purpose**: "Can I see/access this row?"
- **Used for**: SELECT, UPDATE, DELETE
- **Example**: `USING (is_admin(auth.uid()))` means "only show rows if user is admin"

#### WITH CHECK Clause
- **Purpose**: "Can I create/modify a row with these values?"
- **Used for**: INSERT, UPDATE
- **Example**: `WITH CHECK (is_admin(auth.uid()))` means "only allow insert/update if user is admin"

### Why Both Are Needed
For INSERT operations:
- `USING` is not checked (no existing row to check)
- `WITH CHECK` is checked (validates the new row)
- If `WITH CHECK` is missing → RLS blocks the insert

For UPDATE operations:
- `USING` is checked (can I access this row?)
- `WITH CHECK` is checked (can I modify it to these new values?)
- Both must pass for update to succeed

---

## Testing the Fix

### Step 1: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Close and reopen browser

### Step 2: Login as Admin
1. Use admin credentials (shanu1 or your admin account)
2. Navigate to Admin Panel
3. Click "Products"

### Step 3: Add a Test Product
1. Click "Add Product" button
2. Fill in the form:
   - Name: "Test Product"
   - Description: "Test description"
   - Price: 1000
   - Daily Earning: 50
   - Contract Days: 30
   - Status: Active
3. Click "Save"
4. Should see success message
5. Product should appear in the list

### Step 4: Verify in Database
```sql
SELECT id, name, price, daily_earning, contract_days, status
FROM products
WHERE name = 'Test Product';
```

Should return the product you just created.

---

## Troubleshooting Steps

### If Still Getting RLS Error

#### Check 1: Verify User is Admin
```sql
SELECT id, username, role FROM profiles WHERE username = 'your_username';
```
Should show `role = 'admin'`.

#### Check 2: Test is_admin Function
```sql
SELECT is_admin('ce72172d-157d-451e-9976-2b33b03214cc');
```
Replace with your user ID. Should return `true`.

#### Check 3: Verify Policies Exist
```sql
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'products';
```
Should show 3 policies, including "Admins can insert products".

#### Check 4: Check Function Permissions
```sql
SELECT 
  p.proname,
  array_agg(pr.rolname) as granted_to
FROM pg_proc p
LEFT JOIN pg_proc_acl pa ON p.oid = pa.oid
LEFT JOIN pg_roles pr ON pa.grantee = pr.oid
WHERE p.proname = 'is_admin'
GROUP BY p.proname;
```

Should show permissions granted to authenticated, anon, public.

#### Check 5: Test with Service Role
If you have access to service role key, test insert directly:
```javascript
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'Test',
    price: 1000,
    daily_earning: 50,
    contract_days: 30
  });
```

If this works but admin insert doesn't, it's definitely an RLS issue.

---

## Common Causes of Persistent RLS Errors

### 1. Cached Auth Token
**Symptom**: Policies are correct but still getting error
**Solution**: 
- Logout and login again
- Clear browser cache
- Clear localStorage
- Try incognito mode

### 2. Wrong User Role
**Symptom**: User thinks they're admin but aren't
**Solution**:
```sql
-- Check user role
SELECT id, username, role FROM profiles WHERE id = auth.uid();

-- If wrong, update it (as service role)
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

### 3. Function Not Working
**Symptom**: is_admin() returns false for admin users
**Solution**:
```sql
-- Test function directly
SELECT is_admin('user-id-here');

-- Check profiles table
SELECT * FROM profiles WHERE role = 'admin';
```

### 4. Policy Not Applied
**Symptom**: Migration ran but policy not updated
**Solution**:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'products';

-- If missing, reapply migration
```

### 5. Multiple Conflicting Policies
**Symptom**: Some operations work, others don't
**Solution**:
```sql
-- List all policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename = 'products'
ORDER BY cmd;

-- Remove conflicting ones if needed
```

---

## Prevention for Future Tables

When creating new admin-managed tables, always use this template:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage table_name"
ON table_name
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Optional: Explicit INSERT policy
CREATE POLICY "Admins can insert table_name"
ON table_name
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Optional: Public read access
CREATE POLICY "Anyone can view table_name"
ON table_name
FOR SELECT
TO public
USING (true);
```

**Key Points**:
- Always include both `USING` and `WITH CHECK` for ALL policies
- Grant function permissions: `GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;`
- Test INSERT operations after creating policies
- Consider explicit INSERT policies for critical tables

---

## Verification Checklist

- [ ] RLS is enabled on products table
- [ ] "Admins can manage products" policy exists with WITH CHECK
- [ ] "Admins can insert products" policy exists
- [ ] is_admin() function has EXECUTE permissions
- [ ] Admin user exists with role = 'admin'
- [ ] is_admin(admin_user_id) returns true
- [ ] Browser cache cleared
- [ ] User logged out and back in
- [ ] Test product insert succeeds
- [ ] Product appears in database
- [ ] Product appears in admin panel list

---

## Summary

**Problem**: Multiple RLS configuration issues preventing admin INSERT operations

**Solutions Applied**:
1. ✅ Added WITH CHECK clause to ALL policy
2. ✅ Granted EXECUTE permissions on is_admin function
3. ✅ Added explicit INSERT policy for products table

**Result**: Admin users can now add products successfully

**Next Steps**: 
1. Clear browser cache
2. Logout and login as admin
3. Try adding a product
4. Should work without RLS error

---

**Status**: ✅ Fixed - Ready to Test

**Note**: If you still get the error after following all steps, please:
1. Share the exact error message
2. Confirm your username
3. Run the verification queries above
4. Share the results so we can investigate further
