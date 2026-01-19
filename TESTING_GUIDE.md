# Complete Testing Guide - Investment Product Platform

## 🎯 Pre-Testing Checklist

Before starting tests, ensure:
- [ ] Browser is open (Chrome, Firefox, or Edge recommended)
- [ ] Hard refresh completed (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Browser console is open (F12 → Console tab)
- [ ] You have admin access (first registered user)

---

## 🧪 Test Suite 1: Authentication & Profile

### Test 1.1: User Registration
1. Go to signup page
2. Enter username: `testuser1`
3. Enter password: `Test123!`
4. Optional: Enter referral code (if testing referrals)
5. Click "Sign Up"
6. **Expected**: Redirect to dashboard, user logged in

### Test 1.2: User Login
1. Go to login page
2. Enter username: `testuser1`
3. Enter password: `Test123!`
4. Click "Login"
5. **Expected**: Redirect to dashboard, user logged in

### Test 1.3: Profile Access
1. Click Profile tab (bottom navigation)
2. **Expected**: See user information, balance, tabs (Orders, Transactions, Requests, KYC)

---

## 🧪 Test Suite 2: Admin Panel Access

### Test 2.1: Admin Panel Entry
1. Go to Profile page
2. Look for "Admin Panel" button (only visible to admins)
3. Click "Admin Panel"
4. **Expected**: Redirect to `/admin`, see admin dashboard with sidebar

### Test 2.2: Admin Navigation
1. In admin panel, click each menu item:
   - Dashboard
   - Users
   - Products
   - Recharges
   - Withdrawals
   - KYC Verification
   - Lucky Draw
   - Daily Earnings
   - Settings
2. **Expected**: Each page loads without errors

---

## 🧪 Test Suite 3: Recharge Flow (CRITICAL)

### Test 3.1: User Submits Recharge
1. **As User**: Go to Profile → Recharge button
2. Enter amount: `500`
3. See QR code displayed
4. Upload payment screenshot (any image file <1MB)
5. Click "Submit Request"
6. **Expected**: Success message, request shows as "pending"

### Test 3.2: Admin Views Recharge
1. **As Admin**: Go to Admin → Recharges
2. **Expected**: See pending request with:
   - Username
   - Amount ($500.00)
   - Timestamp
   - Status badge (pending)
3. Click "View" button
4. **Expected**: Dialog opens showing:
   - Payment screenshot
   - User details
   - Amount

### Test 3.3: Admin Approves Recharge
1. In the view dialog, click "Approve"
2. **Expected**: 
   - Success message
   - Request status changes to "approved"
   - Request moves from pending to all requests
3. **As User**: Check dashboard
4. **Expected**: Balance increased by $500

### Test 3.4: Console Verification
1. Open browser console (F12)
2. Look for logs:
   ```
   Loading recharge requests...
   Pending requests: [{...}]
   All requests: [{...}]
   ```
3. **Expected**: No errors, data arrays populated

---

## 🧪 Test Suite 4: Withdrawal Flow

### Test 4.1: User Submits Withdrawal
1. **As User**: Ensure balance > 0 (complete recharge first)
2. Go to Profile → Withdrawal button
3. Enter amount: `100`
4. Enter bank details:
   - Bank Name: `Test Bank`
   - Account Number: `1234567890`
   - Account Holder: `Test User`
5. Click "Submit Request"
6. **Expected**: Success message, request shows as "pending"

### Test 4.2: Admin Views Withdrawal
1. **As Admin**: Go to Admin → Withdrawals
2. **Expected**: See pending request with:
   - Username
   - Amount ($100.00)
   - Bank details
   - Status badge (pending)

### Test 4.3: Admin Approves Withdrawal
1. Click "View" on the request
2. Review bank details
3. Click "Approve"
4. **Expected**:
   - Success message
   - Request status changes to "approved"
5. **As User**: Check dashboard
6. **Expected**: Balance decreased by $100

---

## 🧪 Test Suite 5: KYC Flow

### Test 5.1: User Submits KYC
1. **As User**: Go to Profile → KYC tab
2. Click "Submit KYC" (if not already submitted)
3. Upload ID front (any image <1MB)
4. Upload ID back (any image <1MB)
5. Enter bank details:
   - Bank Name: `Test Bank`
   - Account Number: `1234567890`
   - Account Holder: `Test User`
6. Click "Submit"
7. **Expected**: Success message, status shows "pending"

### Test 5.2: Admin Views KYC
1. **As Admin**: Go to Admin → KYC Verification
2. **Expected**: See pending submission with:
   - Username
   - Submission date
   - Status badge (pending)

### Test 5.3: Admin Approves KYC
1. Click "View" on the submission
2. Review ID documents (click to view full size)
3. Review bank details
4. Optional: Add admin note
5. Click "Approve"
6. **Expected**:
   - Success message
   - Submission status changes to "approved"
7. **As User**: Check Profile → KYC tab
8. **Expected**: Status shows "Approved"

---

## 🧪 Test Suite 6: Products & Investment

### Test 6.1: Admin Creates Product
1. **As Admin**: Go to Admin → Products
2. Click "Create Product"
3. Fill in details:
   - Name: `Starter Investment Plan`
   - Description: `Perfect for beginners`
   - Price: `1000`
   - Daily Earning: `50`
   - Contract Days: `30`
4. Upload product image (optional)
5. Click "Create Product"
6. **Expected**: Success message, product appears in list

### Test 6.2: User Views Products
1. **As User**: Go to Products tab (bottom navigation)
2. **Expected**: See product card with:
   - Product image
   - Name
   - Price
   - Daily earning
   - Contract duration
   - "Buy" button

### Test 6.3: User Purchases Product
1. Ensure user has sufficient balance (≥ $1000)
2. Click "Buy" on the product
3. Confirm purchase
4. **Expected**:
   - Success message
   - Balance deducted by $1000
   - Product appears in Profile → Orders tab

### Test 6.4: Verify Purchase Record
1. Go to Profile → Orders tab
2. **Expected**: See purchased product with:
   - Product name
   - Purchase date
   - Daily earning
   - Days remaining
   - Total earned (initially $0)
   - Status: Active

---

## 🧪 Test Suite 7: Daily Earnings

### Test 7.1: Manual Trigger (Admin)
1. **As Admin**: Go to Admin → Daily Earnings
2. Click "Trigger Daily Earnings"
3. Wait for processing
4. **Expected**: Results show:
   - Processed: 1 (or number of active products)
   - Deactivated: 0 (unless product completed)
   - No errors

### Test 7.2: Verify Earnings Applied
1. **As User**: Go to Profile → Orders tab
2. **Expected**: 
   - Total earned increased by daily earning amount
   - Days remaining decreased by 1
3. Go to Dashboard
4. **Expected**: Balance increased by daily earning amount
5. Go to Profile → Transactions tab
6. **Expected**: New transaction record with type "earning"

### Test 7.3: Console Verification
1. Open browser console
2. Look for edge function response
3. **Expected**: No errors, successful processing message

---

## 🧪 Test Suite 8: Lucky Draw

### Test 8.1: Admin Configures Rewards
1. **As Admin**: Go to Admin → Lucky Draw
2. Add rewards:
   - Reward 1: Amount `5`, Probability `40`
   - Reward 2: Amount `10`, Probability `30`
   - Reward 3: Amount `20`, Probability `20`
   - Reward 4: Amount `50`, Probability `10`
3. Click "Save All Rewards"
4. **Expected**: Success message, total probability = 100%

### Test 8.2: User Spins Lucky Draw
1. **As User**: Go to Lucky Draw tab (bottom navigation)
2. Click "Spin" button
3. **Expected**:
   - Spinning animation
   - Random reward displayed
   - Success message with amount won
   - Balance increased by reward amount

### Test 8.3: Daily Limit Check
1. Try to spin again immediately
2. **Expected**: Error message "You can only spin once per day"

### Test 8.4: Verify Lucky Draw Record
1. Go to Profile → Transactions tab
2. **Expected**: New transaction with type "lucky_draw"

---

## 🧪 Test Suite 9: Referral System

### Test 9.1: Get Referral Code
1. **As User**: Go to Team tab (bottom navigation)
2. **Expected**: See unique referral code
3. Copy referral code

### Test 9.2: Register with Referral
1. Log out
2. Go to signup page
3. Register new user with referral code
4. **Expected**: Registration successful

### Test 9.3: Verify Referral Tracking
1. Log in as original user
2. Go to Team tab
3. **Expected**: See referred user in team list

---

## 🧪 Test Suite 10: Company Settings

### Test 10.1: Update Company Banner
1. **As Admin**: Go to Admin → Settings
2. Upload banner image
3. Click "Save Settings"
4. **Expected**: Success message
5. **As User**: Go to Dashboard
6. **Expected**: New banner displayed at top

### Test 10.2: Update Company Notice
1. **As Admin**: Go to Admin → Settings
2. Update notice text: `Welcome to our platform!`
3. Click "Save Settings"
4. **Expected**: Success message
5. **As User**: Go to Dashboard
6. **Expected**: Notice displayed

### Test 10.3: Update Recharge QR Code
1. **As Admin**: Go to Admin → Settings
2. Upload new QR code image
3. Click "Save Settings"
4. **Expected**: Success message
5. **As User**: Go to Recharge page
6. **Expected**: New QR code displayed

---

## 🧪 Test Suite 11: User Management (Admin)

### Test 11.1: View All Users
1. **As Admin**: Go to Admin → Users
2. **Expected**: See list of all registered users with:
   - Username
   - Email
   - Role
   - Balance
   - Registration date

### Test 11.2: Edit User Role
1. Click "Edit" on a user
2. Change role to "admin"
3. Click "Save"
4. **Expected**: Success message, user role updated

### Test 11.3: View User Details
1. Click "View" on a user
2. **Expected**: See detailed user information:
   - Profile details
   - Balance breakdown
   - Recent activity

---

## 🧪 Test Suite 12: Transaction History

### Test 12.1: View All Transactions
1. **As User**: Go to Profile → Transactions tab
2. **Expected**: See list of all transactions with:
   - Type (recharge, withdrawal, purchase, earning, lucky_draw)
   - Amount
   - Date
   - Status

### Test 12.2: Filter by Type
1. Look for different transaction types
2. **Expected**: Each type has appropriate icon and color

---

## 🧪 Test Suite 13: Mobile Responsiveness

### Test 13.1: Mobile View
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone, Android)
4. **Expected**: 
   - Bottom navigation visible
   - Layout adapts to mobile
   - All features accessible

### Test 13.2: Navigation
1. Click each bottom nav item
2. **Expected**: Smooth navigation, no layout issues

---

## 🧪 Test Suite 14: Error Handling

### Test 14.1: Insufficient Balance
1. **As User**: Try to purchase product with insufficient balance
2. **Expected**: Error message "Insufficient balance"

### Test 14.2: Invalid Input
1. Try to submit recharge with amount `0`
2. **Expected**: Validation error

### Test 14.3: Duplicate Submission
1. Submit a request
2. Try to submit again immediately
3. **Expected**: Appropriate handling (depends on business logic)

---

## 📊 Test Results Checklist

After completing all tests, verify:

### Core Functionality
- [ ] User registration and login work
- [ ] Admin panel accessible and functional
- [ ] Recharge flow complete (submit → approve → balance update)
- [ ] Withdrawal flow complete (submit → approve → balance deduct)
- [ ] KYC flow complete (submit → approve → status update)
- [ ] Product purchase works correctly
- [ ] Daily earnings calculation works
- [ ] Lucky draw works with daily limit
- [ ] Referral system tracks correctly

### Admin Features
- [ ] All admin pages load without errors
- [ ] User management works
- [ ] Product CRUD operations work
- [ ] Request approvals work
- [ ] Company settings update correctly
- [ ] Lucky draw configuration works
- [ ] Daily earnings trigger works

### Data Display
- [ ] No "more than one relationship" errors
- [ ] All lists show data correctly
- [ ] User information displays in admin views
- [ ] Console logs show data (not empty arrays)
- [ ] No JavaScript errors in console

### UI/UX
- [ ] Mobile responsive design works
- [ ] Bottom navigation functions correctly
- [ ] All buttons and links work
- [ ] Images load correctly
- [ ] Forms validate input
- [ ] Success/error messages display

---

## 🐛 If Tests Fail

### Common Issues:

1. **Data not showing in admin panel**
   - Hard refresh browser (Ctrl+Shift+R)
   - Check console for errors
   - Verify you're logged in as admin

2. **Balance not updating**
   - Check transaction records
   - Verify RPC functions executed
   - Check Supabase logs

3. **Images not uploading**
   - Verify file size <1MB
   - Check file format (jpg, png, webp)
   - Check storage bucket permissions

4. **Daily earnings not working**
   - Verify edge function deployed
   - Check edge function logs
   - Ensure products are active

---

## ✅ Success Criteria

All tests pass when:
- ✅ No console errors
- ✅ All data displays correctly
- ✅ All CRUD operations work
- ✅ Balance calculations are accurate
- ✅ User experience is smooth
- ✅ Admin panel fully functional
- ✅ Mobile responsive
- ✅ No broken features

---

**Testing Completed**: ___________
**Tested By**: ___________
**Result**: ⬜ PASS  ⬜ FAIL
**Notes**: ___________

---

**Version**: 1.0
**Last Updated**: 2025-12-29
**Status**: Ready for Production Testing
