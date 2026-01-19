# Notification System - Visual Guide

## 📱 User Interface Components

### 1. Header with Notification Icon

```
┌─────────────────────────────────────────────────────────┐
│  Welcome back, John Doe                           🔔 (3) │
│  ↑                                                  ↑     │
│  User greeting                              Bell icon    │
│  (left side)                              with badge     │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Sticky header (stays visible while scrolling)
- User greeting on the left
- Bell icon on the right
- Red badge shows unread count
- Responsive design

---

### 2. Notification Panel (Slide-out Sheet)

```
┌──────────────────────────────┐
│  Notifications          [×]  │
│  Stay updated with the       │
│  latest announcements        │
│  ────────────────────────    │
│  [Mark all as read]          │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠️ System Maintenance  │  │
│  │ [Important]         🔵 │  │  ← Unread indicator
│  │ Platform will be down  │  │
│  │ for maintenance...     │  │
│  │ 2h ago                 │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ℹ️ New Products        │  │
│  │ [General]              │  │
│  │ Check out our latest   │  │
│  │ investment products    │  │
│  │ 1d ago                 │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ℹ️ Weekly Summary      │  │
│  │ [General]              │  │
│  │ Your earnings report   │  │
│  │ is now available       │  │
│  │ 3d ago                 │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

**Features**:
- Slides in from left side
- Shows all notifications (newest first)
- Type badges (Important/General)
- Unread indicator (blue dot)
- Relative timestamps
- Click to mark as read
- Scrollable list

---

### 3. Home Page with Important Notification Banner

```
┌─────────────────────────────────────────────────────────┐
│  Welcome back, John Doe                           🔔 (3) │  ← Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Company Banner Image]                                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ℹ️ Company Notice: Check out our new features!        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  💰 My Wallet                                   │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Total Balance    Total Earnings   Withdrawable │   │
│  │     ₹1,234.56        ₹456.78          ₹456.78   │   │
│  │                                                  │   │
│  │  [Recharge]  [Withdraw]                         │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ⚠️ Important: System maintenance scheduled for...  ←   │  ← Scrolling Banner
│     (scrolls continuously from right to left)           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 My Assets                                   │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Active Investments: 3                          │   │
│  │  Total Invested: ₹1,500.00                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Banner appears below "My Wallet"
- Red/destructive theme
- Scrolls continuously
- Pauses on hover
- Only shows important notifications

---

### 4. Admin Notifications Management Page

```
┌─────────────────────────────────────────────────────────┐
│  Notifications                                          │
│  Manage system-wide notifications                       │
│                                    [+ Create Notification] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⚠️ System Maintenance [Important] [Deleted]    │   │
│  │  Created: 2025-12-29 10:00 AM              [🗑️] │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Platform will be unavailable on Dec 30, 2025  │   │
│  │  from 2:00 AM to 4:00 AM for system upgrades.  │   │
│  │                                                  │   │
│  │  📊 100 Total | 75 Read | 25 Unread            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ℹ️ New Products [General]                      │   │
│  │  Created: 2025-12-28 3:00 PM               [🗑️] │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  We've added 5 new investment products with    │   │
│  │  competitive daily returns. Check them out!    │   │
│  │                                                  │   │
│  │  📊 100 Total | 90 Read | 10 Unread            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ℹ️ Weekly Summary [General]                    │   │
│  │  Created: 2025-12-27 9:00 AM               [🗑️] │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Your weekly earnings report is now available  │   │
│  │  in your profile section.                       │   │
│  │                                                  │   │
│  │  📊 100 Total | 95 Read | 5 Unread             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- List of all notifications
- Type badges (Important/General)
- Creation timestamps
- Statistics (total, read, unread)
- Delete button (trash icon)
- Create notification button

---

### 5. Create Notification Dialog

```
┌─────────────────────────────────────┐
│  Create New Notification       [×]  │
│  Send a notification to all users   │
│  ─────────────────────────────────  │
│                                     │
│  Title                              │
│  ┌─────────────────────────────┐   │
│  │ System Maintenance          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Message                            │
│  ┌─────────────────────────────┐   │
│  │ Platform will be down for   │   │
│  │ maintenance on Dec 30 from  │   │
│  │ 2:00 AM to 4:00 AM.         │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Type                               │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Important            ▼   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Important notifications will be    │
│  displayed as a scrolling banner    │
│  on the home page                   │
│                                     │
│  ─────────────────────────────────  │
│         [Cancel] [Send Notification]│
└─────────────────────────────────────┘
```

**Features**:
- Title input field
- Message textarea
- Type dropdown (General/Important)
- Helper text for important type
- Cancel and Send buttons

---

## 🎨 Color Scheme

### General Notifications
- **Background**: Secondary/neutral (light gray)
- **Border**: Muted border
- **Icon**: Info icon (ℹ️) in blue
- **Badge**: Secondary badge

### Important Notifications
- **Background**: Destructive/10 (light red)
- **Border**: Destructive/20 (red)
- **Icon**: Alert circle (⚠️) in red
- **Badge**: Destructive badge (red)
- **Text**: Destructive color for title

### Unread Indicator
- **Color**: Primary blue
- **Shape**: Small circle (dot)
- **Position**: Top-right of notification card

### Badge (Unread Count)
- **Background**: Destructive (red)
- **Text**: White
- **Shape**: Circle
- **Position**: Top-right of bell icon

---

## 📐 Layout Specifications

### Header
- **Height**: 64px (4rem)
- **Position**: Sticky top
- **Background**: Background with backdrop blur
- **Border**: Bottom border
- **Padding**: 16px horizontal

### Notification Panel
- **Width**: 100% on mobile, max 448px on desktop
- **Height**: Full screen
- **Animation**: Slide from left
- **Background**: Card background
- **Padding**: 24px

### Notification Banner
- **Height**: Auto (min 48px)
- **Background**: Destructive/10
- **Border**: 1px solid destructive/20
- **Border Radius**: 8px
- **Padding**: 8px 16px
- **Animation**: Marquee 20s linear infinite

### Notification Card
- **Border Radius**: 8px
- **Padding**: 16px
- **Margin**: 8px between cards
- **Background**: Accent/50 for unread, default for read

---

## 🎬 Animations

### Marquee Scroll
```css
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}
```

**Properties**:
- **Duration**: 20 seconds
- **Timing**: Linear
- **Iteration**: Infinite
- **Pause**: On hover

### Slide-in Panel
- **Direction**: From left
- **Duration**: 300ms
- **Easing**: Ease-in-out

### Badge Pulse (Optional)
- **Effect**: Subtle scale animation
- **Duration**: 2 seconds
- **Iteration**: Infinite

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
- Full-width notification panel
- Stacked layout
- Touch-friendly tap targets (min 44px)
- Simplified user greeting

### Tablet (768px - 1024px)
- Fixed-width notification panel (448px)
- Full layout visible
- Hover states enabled

### Desktop (> 1024px)
- Optimal spacing
- Full features visible
- Smooth animations
- Hover effects

---

## 🔔 Notification States

### Unread Notification
```
┌────────────────────────┐
│ ⚠️ System Maintenance  │
│ [Important]         🔵 │  ← Blue dot
│ Platform will be...    │
│ 2h ago                 │
└────────────────────────┘
Background: Accent/50 (highlighted)
```

### Read Notification
```
┌────────────────────────┐
│ ℹ️ New Products        │
│ [General]              │
│ Check out our...       │
│ 1d ago                 │
└────────────────────────┘
Background: Default (normal)
```

### Deleted Notification (Admin View)
```
┌────────────────────────┐
│ ℹ️ Old Announcement    │
│ [General] [Deleted]    │
│ This is an old...      │
│ 7d ago                 │
└────────────────────────┘
Opacity: Reduced
Badge: "Deleted" shown
```

---

## 🎯 Interactive Elements

### Clickable Areas
1. **Bell Icon**: Opens notification panel
2. **Notification Card**: Marks as read (if unread)
3. **Mark All as Read Button**: Marks all as read
4. **Create Notification Button**: Opens create dialog
5. **Delete Button**: Deletes notification
6. **Close Button**: Closes panel/dialog

### Hover Effects
1. **Bell Icon**: Slight scale up
2. **Notification Card**: Background color change
3. **Buttons**: Background color change
4. **Marquee Banner**: Pause animation

### Focus States
- All interactive elements have visible focus rings
- Keyboard navigation supported
- Tab order follows logical flow

---

## 📊 Statistics Display

### Format
```
📊 100 Total | 75 Read | 25 Unread
   ↑          ↑         ↑
   Total      Green     Red
   users      color     color
```

### Engagement Rate Calculation
```
Engagement Rate = (Read / Total) × 100%
Example: (75 / 100) × 100% = 75%
```

---

## 🌈 Theme Integration

### Light Mode
- Background: Light gray (#F8F9FA)
- Text: Dark gray (#1C1C1E)
- Primary: Blue (#2563EB)
- Destructive: Red (#EF4444)

### Dark Mode (Future)
- Background: Dark gray (#1C1C1E)
- Text: Light gray (#F8F9FA)
- Primary: Light blue (#60A5FA)
- Destructive: Light red (#F87171)

---

**Note**: All measurements are approximate and may vary slightly based on screen size and browser rendering.

**Version**: 1.0
**Last Updated**: 2025-12-29
