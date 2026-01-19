# Admin Purchase Report Feature

## Overview
Created a comprehensive Purchase Report page in the admin panel that displays all product purchases made by users with detailed information including user details, product information, purchase dates, financial metrics, and contract progress.

---

## Features

### 1. Complete Purchase List
- Displays all user product purchases in chronological order (newest first)
- Shows comprehensive details for each purchase
- Real-time data from database

### 2. Search Functionality
- Search by username
- Search by product name
- Real-time filtering as you type
- Case-insensitive search

### 3. Detailed Purchase Information

#### User Information:
- Username
- Email address (if available)

#### Product Information:
- Product name
- Purchase date (formatted: Month Day, Year)
- Status badge (Active/Inactive/Expired)

#### Financial Details:
- Purchase price (₹)
- Daily earning amount (₹)
- Total earned so far (₹)
- Expected total earnings (₹)

#### Contract Progress:
- Visual progress bar
- Days completed / Total contract days
- Days remaining
- Expiration date
- Last earning date

### 4. Summary Statistics
- Total number of purchases
- Total revenue generated
- Total earnings distributed to users
- Number of active contracts

---

## Implementation Details

### 1. API Function

**File:** `src/db/api.ts`

Added `getAllUserProducts` function to fetch all purchases with user and product details:

```typescript
getAllUserProducts: async () => {
  const { data, error } = await supabase
    .from('user_products')
    .select('*, product:products(*), user:profiles!user_products_user_id_fkey(id, username, email)')
    .order('purchased_at', { ascending: false });
  
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as UserProduct[];
}
```

**Features:**
- Fetches all user_products records
- Joins with products table for product details
- Joins with profiles table for user details
- Orders by purchase date (newest first)
- Returns typed UserProduct array

---

### 2. TypeScript Interface Update

**File:** `src/types/types.ts`

Added `user` field to `UserProduct` interface:

```typescript
export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  purchase_price: number;
  daily_earning: number;
  contract_days: number;
  days_remaining: number;
  total_earned: number;
  is_active: boolean;
  purchased_at: string;
  expires_at: string;
  last_earning_date: string | null;
  product?: Product;
  user?: Profile;  // NEW: User information
}
```

---

### 3. Admin Purchase Report Page

**File:** `src/pages/admin/AdminPurchaseReportPage.tsx`

#### Component Structure:

**State Management:**
```typescript
const [purchases, setPurchases] = useState<UserProduct[]>([]);
const [filteredPurchases, setFilteredPurchases] = useState<UserProduct[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
```

**Key Functions:**

1. **loadPurchases()**: Fetches all purchases from API
2. **filterPurchases()**: Filters purchases based on search term
3. **getStatusBadge()**: Returns appropriate status badge
4. **calculateProgress()**: Calculates contract completion percentage

#### UI Components:

**Header Section:**
- Page title and description
- Total purchases count with icon

**Search Card:**
- Search input with icon
- Real-time filtering

**Purchase Cards:**
- Two-column layout (responsive)
- Left column: User & Product info
- Right column: Financial details & progress
- Status badges
- Progress bars
- Date formatting

**Summary Statistics Card:**
- 4-column grid (responsive)
- Total purchases
- Total revenue
- Total earnings
- Active contracts

---

### 4. Routing Configuration

**File:** `src/routes.tsx`

Added route to admin children:

```typescript
{
  name: 'Purchase Report',
  path: 'purchase-report',
  element: <AdminPurchaseReportPage />,
}
```

**Full Path:** `/admin/purchase-report`

---

### 5. Navigation Integration

**File:** `src/components/layouts/AdminLayout.tsx`

Added navigation item:

```typescript
{ 
  path: '/admin/purchase-report', 
  label: 'Purchase Report', 
  icon: ShoppingBag 
}
```

**Position:** After "Products", before "Recharges"

---

## User Interface

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Purchase Report                    🛍️ 156               │
│ View all product purchases by users  Total Purchases    │
├─────────────────────────────────────────────────────────┤
│ Search Purchases                                        │
│ 🔍 Search by username or product name...               │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ User: john_doe                                      │ │
│ │ john@example.com                                    │ │
│ │                                                     │ │
│ │ Product: Premium Investment Plan                   │ │
│ │                                                     │ │
│ │ 📅 Purchase Date: December 27, 2025                │ │
│ │ Status: [Active]                                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ₹ Purchase Price: ₹10,000.00                       │ │
│ │ 📈 Daily Earning: ₹150.00                          │ │
│ │                                                     │ │
│ │ Total Earned: ₹3,000.00                            │ │
│ │ Expected Total: ₹9,000.00                          │ │
│ │                                                     │ │
│ │ Contract Progress: 20 / 60 days                    │ │
│ │ [████████░░░░░░░░░░░░░░░░░░░░] 33%                │ │
│ │ 40 days remaining                                  │ │
│ │                                                     │ │
│ │ Expires On: February 25, 2026                      │ │
│ │ Last Earning Date: December 26, 2025               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Summary Statistics                                      │
│ ┌──────────┬──────────┬──────────┬──────────┐          │
│ │ Total    │ Total    │ Total    │ Active   │          │
│ │ Purchases│ Revenue  │ Earned   │ Contracts│          │
│ │   156    │₹1,560,000│₹468,000  │   89     │          │
│ └──────────┴──────────┴──────────┴──────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## Status Badges

### Active
- **Color:** Blue (default variant)
- **Condition:** `is_active = true` AND not expired
- **Meaning:** Contract is currently active and earning

### Inactive
- **Color:** Gray (secondary variant)
- **Condition:** `is_active = false` AND not expired
- **Meaning:** Contract was manually deactivated

### Expired
- **Color:** Gray outline (outline variant)
- **Condition:** `expires_at < current date`
- **Meaning:** Contract period has ended

---

## Progress Calculation

### Formula:
```typescript
const daysCompleted = contract_days - days_remaining;
const progress = (daysCompleted / contract_days) * 100;
```

### Example:
- Contract Days: 60
- Days Remaining: 40
- Days Completed: 20
- Progress: 33%

### Visual Representation:
```
[████████░░░░░░░░░░░░░░░░░░░░] 33%
20 / 60 days
40 days remaining
```

---

## Search Functionality

### Search Criteria:
1. **Username:** Searches in `user.username` field
2. **Product Name:** Searches in `product.name` field

### Search Behavior:
- Case-insensitive
- Partial matching
- Real-time filtering
- Updates as you type

### Examples:

**Search: "john"**
- Matches: john_doe, johnny123, john.smith

**Search: "premium"**
- Matches: Premium Plan, Premium Investment, Super Premium

**Search: "invest"**
- Matches: Investment Plan, Investor Package, Smart Invest

---

## Summary Statistics

### 1. Total Purchases
- **Calculation:** Count of all purchases
- **Display:** Number
- **Example:** 156

### 2. Total Revenue
- **Calculation:** Sum of all `purchase_price`
- **Display:** Currency (₹)
- **Example:** ₹1,560,000.00
- **Color:** Green (success)

### 3. Total Earned by Users
- **Calculation:** Sum of all `total_earned`
- **Display:** Currency (₹)
- **Example:** ₹468,000.00
- **Color:** Blue (primary)

### 4. Active Contracts
- **Calculation:** Count where `is_active = true`
- **Display:** Number
- **Example:** 89

---

## Date Formatting

All dates are formatted using `toLocaleDateString` with options:

```typescript
{
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}
```

### Examples:
- `2025-12-27` → December 27, 2025
- `2026-02-25` → February 25, 2026

---

## Responsive Design

### Desktop (≥1280px):
- Two-column layout for purchase cards
- Four-column summary statistics
- Full sidebar navigation

### Tablet (768px - 1279px):
- Single-column layout for purchase cards
- Two-column summary statistics
- Collapsible sidebar

### Mobile (<768px):
- Single-column layout
- Stacked summary statistics
- Mobile navigation menu

---

## Access Control

### Admin Only
- Page is only accessible to users with `role = 'admin'`
- Protected by AdminLayout component
- Redirects non-admin users

### Navigation
- Link appears in admin sidebar
- Position: 4th item (after Products)
- Icon: ShoppingBag (🛍️)

---

## Performance Considerations

### Data Loading:
- Fetches all purchases on mount
- Stores in component state
- No pagination (suitable for moderate data)

### Search Performance:
- Client-side filtering
- Efficient array filtering
- No API calls during search

### Future Optimizations:
1. **Pagination:** For large datasets (>1000 records)
2. **Server-side Search:** For better performance
3. **Caching:** Store frequently accessed data
4. **Virtual Scrolling:** For very long lists

---

## Use Cases

### 1. Monitor Sales
- View all product purchases
- Track revenue generation
- Identify popular products

### 2. User Activity
- See which users are investing
- Track user purchase patterns
- Identify high-value customers

### 3. Contract Management
- Monitor active contracts
- Track contract progress
- Identify expiring contracts

### 4. Financial Analysis
- Calculate total revenue
- Track earnings distribution
- Analyze profit margins

### 5. Customer Support
- Look up user purchases
- Verify purchase details
- Check contract status

---

## Testing Checklist

### Functionality:
- [ ] Page loads without errors
- [ ] All purchases display correctly
- [ ] Search filters work properly
- [ ] Status badges show correct colors
- [ ] Progress bars calculate correctly
- [ ] Summary statistics are accurate
- [ ] Dates format properly

### UI/UX:
- [ ] Layout is responsive
- [ ] Cards are properly styled
- [ ] Icons display correctly
- [ ] Colors match theme
- [ ] Text is readable
- [ ] Spacing is consistent

### Data:
- [ ] User information displays
- [ ] Product information displays
- [ ] Financial data is accurate
- [ ] Dates are correct
- [ ] Status reflects actual state

### Edge Cases:
- [ ] No purchases (empty state)
- [ ] No search results
- [ ] Missing user data
- [ ] Missing product data
- [ ] Expired contracts
- [ ] Very long usernames/product names

---

## Future Enhancements

### 1. Export Functionality
- Export to CSV
- Export to PDF
- Export to Excel

### 2. Advanced Filtering
- Filter by status (Active/Inactive/Expired)
- Filter by date range
- Filter by product
- Filter by user

### 3. Sorting Options
- Sort by purchase date
- Sort by amount
- Sort by earnings
- Sort by expiration date

### 4. Detailed View
- Click to view full purchase details
- Transaction history
- Earning history
- User profile link

### 5. Analytics
- Charts and graphs
- Trend analysis
- Revenue forecasting
- User retention metrics

### 6. Bulk Actions
- Deactivate multiple contracts
- Export selected purchases
- Send notifications

---

## Status
✅ **Implemented and Deployed**

The Purchase Report page is fully functional and accessible to admin users at `/admin/purchase-report`.

---

**Date Implemented:** 2025-12-27  
**Files Created:**
- `src/pages/admin/AdminPurchaseReportPage.tsx`

**Files Modified:**
- `src/db/api.ts` (added getAllUserProducts function)
- `src/types/types.ts` (added user field to UserProduct)
- `src/routes.tsx` (added purchase-report route)
- `src/components/layouts/AdminLayout.tsx` (added navigation link)
