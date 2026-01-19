# Investment Product Web Application Requirements Document

## 1. Application Overview

### 1.1 Application Name
Investment Product Platform

### 1.2 Application Description
A full production-ready responsive web application for investment product management, featuring user investment, daily earnings, wallet management, referral system, lucky draw functionality, and comprehensive notification system.

### 1.3 Core Features
- Comprehensive admin panel\n- User authentication and profile management
- Investment product browsing and purchasing
- VIP product with instant earnings
- Wallet system with recharge and withdrawal\n- Daily automatic earnings distribution
- Referral team management
- Lucky draw system
- Mandatory KYC verification with access control
- Notification system with admin broadcast capability
- Product purchase report and analytics
- Referral report and analytics
- User balance and transaction report
- Withdrawal blocking control by admin
- Admin direct balance addition to user wallet

## 2. Admin Panel\n
### 2.1 Admin Dashboard
- Overview statistics (total users, active investments, pending requests)
- Quick access to all management modules
- Real-time transaction monitoring
\n### 2.2 User Management
- View all registered users
- User details and activity logs
- Wallet balance overview
- Edit user information
- Block user accounts (prevent login and access)
- Delete user accounts (permanently remove user data)
- Suspend or activate user accounts
- Block or unblock user withdrawal requests
- View withdrawal block status for each user
- Add balance directly to user wallet

### 2.3 Direct Balance Addition
- Select user from user management list
- Enter amount to add to user wallet
- Add amount directly to user's Total Balance
- Record transaction in user's wallet transaction logs
- Display transaction type as Admin Credit or Balance Addition
- Include admin name and timestamp in transaction record
- Optional: Add reason or note for balance addition
- Update user's Total Balance in real-time
- Display confirmation message after successful balance addition

### 2.4 Withdrawal Block Control
- Toggle withdrawal block status for individual users
- Block withdrawal: Prevent user from submitting withdrawal requests
- Unblock withdrawal: Allow user to submit withdrawal requests normally
- Display withdrawal block status in user management list
- View withdrawal block history and logs
- Add reason for blocking withdrawal (optional)
\n### 2.5 KYC Approval System
- Review submitted KYC documents
- View government ID uploads (front and back)
- Review bank details including bank IFSC code
- Review UPI ID (optional field)\n- Approve or reject KYC submissions
- Simple verification workflow
\n### 2.6 Product Management
- Add new investment products
- Edit existing products
- Delete products
- Set price, daily income, and duration
- Activate or deactivate products
- Upload product images
\n### 2.7 VIP Product Management
- Dedicated VIP Product Management section in admin panel
- Add new VIP products with form including:
  - Product name field
  - Product description field
  - Product price field
  - Instant earnings amount field
  - Product image upload
  - Activate/Deactivate toggle
- View list of all VIP products with details
- Edit existing VIP products
- Delete VIP products
- Activate or deactivate VIP products\n- Display VIP product status (Active/Inactive)

### 2.8 Product Purchase Report
- View comprehensive list of all product purchases
- Display purchase details including:
  - User name
  - Product name\n  - Purchase date
  - Product price
  - Daily income amount
  - Contract duration
  - Purchase status (Active/Completed/Expired)
  - Total earnings generated to date
- Filter purchases by:\n  - Date range
  - User name
  - Product name\n  - Purchase status
- Sort by purchase date, user name, or product name
- Export purchase report to CSV or Excel format
- View detailed purchase history for individual users
- Display total purchase statistics (total purchases, total investment amount, active contracts)

### 2.9 Referral Report
- View comprehensive list of all referral activities
- Display referral details including:
  - Referrer name
  - Referred user name
  - Referral date
  - Referral bonus amount
  - Referral status (Active/Inactive)
  - Total referrals per user
  - Total referral earnings per user
- Filter referrals by:
  - Date range\n  - Referrer name\n  - Referred user name\n  - Referral status\n- Sort by referral date, referrer name, or bonus amount
- Export referral report to CSV or Excel format
- View detailed referral history for individual users
- Display total referral statistics (total referrals, total referral bonuses paid, active referrals)

### 2.10 User Balance and Transaction Report
- Search functionality to find specific users by name or user ID
- Display comprehensive wallet transaction history for selected user
- Show all transaction types including:
  - Recharge transactions
  - Withdrawal transactions\n  - Daily earnings\n  - Referral rewards
  - Lucky draw rewards
  - Product purchases
  - VIP product purchases
  - VIP product instant earnings
  - Admin balance additions
  - Other wallet activities
- Day-wise transaction breakdown showing:
  - Transaction date
  - Transaction type\n  - Transaction amount (credit/debit)
  - Running balance after each transaction
  - Transaction description
  - Transaction status
- Filter transactions by:
  - Date range (from date to date)
  - Transaction type (recharge, withdrawal, daily earning, reward, admin credit, etc.)
  - Transaction status\n- Sort transactions by date (ascending/descending)
- Display daily balance summary for each day
- Show opening balance and closing balance for selected date range
- Export user transaction report to CSV or Excel format\n- View total transaction statistics for selected user:\n  - Total recharges\n  - Total withdrawals
  - Total earnings
  - Total rewards
  - Total admin credits
  - Current balance
\n### 2.11 Recharge Request Handling
- View pending recharge requests
- Review payment screenshots
- Approve requests (add balance to user wallet)
- Reject requests with reason
- Update payment QR code anytime

### 2.12 Withdrawal Request Processing
- View pending withdrawal requests\n- Manual transfer processing
- Approve or reject requests
- Update user wallet upon approval
- Maintain withdrawal history logs

### 2.13 Wallet Transaction Logs
- Complete transaction history\n- Filter by user, date, or transaction type
- Export transaction reports\n\n### 2.14 Company Information Updates
- Update company banner
- Edit company notice and information
- Manage company details displayed on dashboard

### 2.15 Banner Management
- Upload and update dashboard banners
- Set banner display order
- Activate or deactivate banners
\n### 2.16 Lucky Draw Reward Configuration
- Configure reward options
- Set reward amounts
- Manage reward probabilities
- View lucky draw history

### 2.17 Notification Management
- Create notifications for all users
- Set notification priority (Important or General)
- Edit notification content
- Delete notifications\n- View notification history
- Track notification delivery status

### 2.18 Withdrawal Settings
- Set minimum withdrawal amount limit
- Configure minimum balance threshold that users must reach before submitting withdrawal requests\n- Update withdrawal limit anytime

### 2.19 Support Channel Settings
- Add Telegram channel support link
- Update support channel link anytime
- Display support link in user dashboard support option

## 3. Technical Requirements

### 3.1 Database\nLocal database\n
### 3.2 Responsive Design
Mobile-first responsive design approach

## 4. User Interface Design

### 4.1 Theme
Light theme with clean financial app aesthetic
\n### 4.2 Navigation Structure
Fixed bottom navigation bar (mobile) with five sections:
- Home\n- Products
- Lucky Draw
- Team
- Profile
\n### 4.3 Design Style
- Color Scheme: Professional financial tones with primary blue (#2563eb) and accent green (#10b981) for positive actions, red badge (#ef4444) for notification indicators\n- Visual Details: Subtle shadows for card elevation, 8px rounded corners, minimalist icons, smooth transitions, marquee animation for important notifications
- Layout: Card-based layout with clear visual hierarchy and adequate white space

## 5. User Authentication

### 5.1 Login & Signup
- Simple phone number and password authentication
- Forgot password functionality
- No OTP verification required
- Redirect to KYC verification prompt if KYC is incomplete after login
- Redirect to dashboard after successful login if KYC is complete

## 6. KYC Verification Gate

### 6.1 KYC Completion Check
- System checks KYC status immediately after user login
- If KYC is not complete, display full-screen KYC prompt overlay on dashboard
- Block all app functionality until KYC is completed
- User cannot access any features including:
  - Product browsing and purchasing
  - VIP product browsing and purchasing
  - Wallet operations (recharge, withdrawal)
  - Lucky draw\n  - Referral team
  - Profile sections (except KYC submission)

### 6.2 KYC Prompt Display
- Full-screen overlay message: Please complete your KYC verification to access all features
- Prominent Complete Now button
- No close or dismiss option
- Clicking Complete Now redirects to KYC submission form\n\n### 6.3 KYC Submission Form
- Government ID upload (front and back)
- Bank details submission:\n  - Bank account number
  - Bank name
  - Bank IFSC code (required)\n  - UPI ID (optional field, not required)\n- Submit button to send for admin review
- After submission, show pending approval status
- User remains blocked from app features until admin approves KYC

### 6.4 Post-Approval Access
- Once admin approves KYC, user gains full access to all app features
- KYC prompt overlay is removed
- User can freely navigate and use all modules

## 7. User App Header

### 7.1 Header Layout
- Fixed top header bar across all user pages
- Left side: Notification bell icon with unread count badge
- Right side: Welcome back, [User Name] greeting text\n- Header only visible after KYC completion

### 7.2 Notification Icon
- Bell icon with red badge showing unread notification count
- Click to open notification center
- Badge disappears when all notifications are read

## 8. Notification Center

### 8.1 Notification List
- Display all notifications sent by admin
- Show notification title and content
- Display timestamp for each notification
- Mark notifications as Important or General with visual indicators
- Important notifications highlighted with distinct color or icon
- Mark individual notifications as read
- Mark all as read option

### 8.2 Notification Types
- Important: Highlighted with red or orange indicator
- General: Standard display style
\n## 9. User Dashboard

### 9.1 Top Section
- User app header (Welcome message and notification icon)
- Company banner (admin-updatable)
- Company notice and information display
\n### 9.2 Wallet Summary
- Total Balance display
- Earnings display
- Withdrawable Amount display
- Recharge button
- Withdraw button
\n### 9.3 Important Notification Marquee
- Positioned below My Wallet section
- Display important notifications in left-to-right scrolling style
- Continuous loop animation
- Click to view full notification details
- Only show notifications marked as Important by admin

### 9.4 Dashboard Sections
- My Assets overview
- Daily Check-in Bonus
- Company Details (admin-updatable)
- Support option with Telegram channel link (admin-configurable)
\n### 9.5 Access Control
- All dashboard features only accessible after KYC completion\n- If KYC incomplete, show KYC prompt overlay instead\n\n## 10. Products Module

### 10.1 Product Display
Each product shows:
- Product image
- Price
- Daily earnings amount
- Contract duration
- Buy button
\n### 10.2 Purchase Flow
- User can choose to pay from Total Balance or Withdrawable Amount
- System validates user has sufficient balance in selected payment source
- Deduct product price from selected balance (Total Balance or Withdrawable Amount)
- If paid from Withdrawable Amount, also deduct from Total Balance\n- Activate daily earning schedule
- Record transaction\n\n### 10.3 Access Control
- Products module only accessible after KYC completion
\n## 11. VIP Products Module

### 11.1 VIP Product Page
- Separate dedicated page for VIP products
- Accessible from bottom navigation bar Products section or dashboard
- Display all active VIP products in card layout
- Show VIP Products heading at top of page
- Empty state message when no VIP products are available

### 11.2 VIP Product Display
Each VIP product card shows:
- Product image
- Product name
- Product description
- Price
- Instant earnings amount (earnings user receives immediately upon purchase)
- Buy button
\n### 11.3 VIP Product Purchase Flow
1. User clicks Buy button on VIP product\n2. User can choose to pay from Total Balance or Withdrawable Amount
3. System validates user has sufficient balance in selected payment source
4. Deduct product price from selected balance (Total Balance or Withdrawable Amount)
5. If paid from Withdrawable Amount, also deduct from Total Balance\n6. Immediately add instant earnings amount to user's Total Balance
7. Immediately add instant earnings amount to user's Withdrawable Amount
8. Record purchase transaction in wallet transaction logs
9. Record instant earnings transaction in wallet transaction logs
10. Display purchase confirmation with earnings received
11. Update user's wallet balances in real-time

### 11.4 VIP Product Transaction Recording
- Record two separate transactions for each VIP product purchase:\n  - Purchase transaction (debit from selected balance)
  - Instant earnings transaction (credit to Total Balance and Withdrawable Amount)
- Display both transactions in user's transaction history
- Include VIP product name and details in transaction description

### 11.5 Access Control
- VIP products module only accessible after KYC completion

## 12. Recharge System

### 12.1 User Process
1. Enter recharge amount
2. View admin QR code\n3. Upload payment screenshot
4. Status shows as pending
\n### 12.2 Admin Management
- Approve recharge requests (add balance to user wallet)
- Reject recharge requests\n- Update QR code anytime
\n### 12.3 Access Control
- Recharge functionality only accessible after KYC completion\n
## 13. Daily Earning System

### 13.1 Automatic Distribution
- System runs daily at a fixed time (e.g., 00:00 UTC) to calculate earnings for all active investments
- For each active investment product:
  - Calculate daily earnings based on product's daily income rate
  - Add calculated earnings to user's Total Balance\n  - Add calculated earnings to user's Withdrawable Amount
  - Record earning transaction in wallet transaction logs
  - Update earning history for the user
- Automatically stop earnings distribution when contract period expires
- Mark expired investments as completed
- Maintain detailed earning logs with date, amount, and product information

### 13.2 Earning Calculation Logic
- Daily earnings = Product daily income amount (as configured by admin)
- Earnings are added to both Total Balance and Withdrawable Amount simultaneously
- Track number of days earnings have been distributed
- Compare with contract duration to determine when to stop\n\n### 13.3 Withdrawable Amount Management
- Withdrawable Amount consists exclusively of:\n  - Daily earnings from active investments
  - VIP product instant earnings
  - Referral bonuses
  - Lucky draw rewards
- Withdrawable Amount increases with:\n  - Daily earnings from active investments
  - VIP product instant earnings
  - Referral bonuses
  - Lucky draw rewards
- Withdrawable Amount decreases with:
  - Approved withdrawal requests
  - Product purchases paid from Withdrawable Amount
  - VIP product purchases paid from Withdrawable Amount
- Display Withdrawable Amount separately on dashboard
- Validate withdrawal requests against minimum withdrawal limit set by admin
- Only allow withdrawal requests when Withdrawable Amount meets or exceeds the minimum limit
- Show error message if withdrawal amount is below minimum limit

## 14. Withdrawal System

### 14.1 User Request
- Submit withdrawal request from available Withdrawable Amount
- System validates request amount does not exceed Withdrawable Amount
- System validates Withdrawable Amount meets minimum withdrawal limit set by admin
- System checks if user's withdrawal is blocked by admin
- Display error message if Withdrawable Amount is below minimum limit (e.g., if limit is 500 and user has less than 500, request cannot be submitted)
- Display error message if withdrawal is blocked: Your withdrawal is blocked due to violating the policy. Please contact the admin\n- Display pending status after successful submission

### 14.2 Withdrawal Block Validation
- Before allowing withdrawal request submission, check user's withdrawal block status
- If withdrawal is blocked by admin:\n  - Prevent withdrawal request submission
  - Display message: Your withdrawal is blocked due to violating the policy. Please contact the admin
  - Show support contact option (Telegram channel link)
- If withdrawal is not blocked:
  - Allow normal withdrawal request flow
\n### 14.3 Admin Processing
- Manual transfer processing\n- Approve or reject requests
- Upon approval:\n  - Deduct amount from user's Total Balance
  - Deduct amount from user's Withdrawable Amount
  - Record transaction in withdrawal history
- Upon rejection:
  - No changes to wallet balances
  - Notify user with rejection reason
\n### 14.4 Access Control
- Withdrawal functionality only accessible after KYC completion
- Withdrawal request submission blocked if admin has blocked user's withdrawal
\n## 15. Lucky Draw\n
### 15.1 User Features
- One spin per day limit
- Random bonus rewards
- Auto-add rewards to wallet
- Rewards added to both Total Balance and Withdrawable Amount\n\n### 15.2 Admin Management
- Configure reward options
- Manage reward probabilities
\n### 15.3 Access Control
- Lucky draw feature only accessible after KYC completion\n
## 16. Referral Team System

### 16.1 Features
- Unique referral link generation
- Display list of referred users
- Show referral earnings summary
- Single-level referral structure
- Referral bonuses added to both Total Balance and Withdrawable Amount\n
### 16.2 Access Control
- Referral team module only accessible after KYC completion\n
## 17. User Profile\n
### 17.1 Profile Sections
- Personal details\n- KYC status display
- Order history
- Transaction history
- Withdrawal history
- Change password functionality
\n### 17.2 Access Control
- Full profile access only available after KYC completion
- Only KYC submission section accessible before KYC approval

## 18. Security Requirements

### 18.1 Security Measures
- Secure login authentication
- Admin access protection
- Input validation
- Wallet transaction security
- Prevention of balance manipulation
- KYC verification enforcement at application level
- Withdrawal block enforcement at application level
- Admin balance addition audit trail

## 19. Development Goals

### 19.1 Core Objectives
- Simple and fast user experience
- Working investment features
- VIP product with instant earnings functionality
- Reliable wallet system
- Automated daily earnings distribution
- Manual recharge and withdrawal processes
- Admin-controlled withdrawal blocking functionality
- Admin direct balance addition functionality
- Basic referral functionality
- Lucky draw engagement feature
- Complete admin control\n- Real-time notification system
- Mandatory KYC verification with strict access control
- Comprehensive product purchase reporting and analytics
- Comprehensive referral reporting and analytics
- Comprehensive user balance and transaction reporting
- No OTP complexity
- Streamlined development approach