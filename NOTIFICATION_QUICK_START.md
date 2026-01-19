# Notification System - Quick Start Guide

## 🎯 Overview
The notification system allows admins to send announcements to all users with two types: **General** and **Important**.

## 👤 For Users

### Viewing Notifications
1. Look for the **bell icon** 🔔 in the header (right side)
2. **Badge** shows unread count
3. **Click** bell icon to open notification panel
4. **Click** on unread notification to mark as read
5. Use **"Mark all as read"** button to clear all

### Important Notifications
- Appear as **scrolling banner** on home page (below wallet)
- Red/destructive theme for visibility
- **Hover** to pause and read
- Scroll continuously until admin deletes

### User Greeting
- **Left side** of header shows "Welcome back, [Your Name]"

## 👨‍💼 For Admins

### Creating Notifications

1. **Navigate**: Admin Panel → Notifications (Bell icon)
2. **Click**: "Create Notification" button
3. **Fill in**:
   - **Title**: Short, clear subject
   - **Message**: Detailed announcement
   - **Type**: Choose General or Important
4. **Send**: Click "Send Notification"
5. **Confirm**: Success message shows user count

### Notification Types

#### General 📋
- Regular announcements
- Shows in notification panel only
- Blue/neutral theme
- Examples: New products, updates, news

#### Important ⚠️
- Critical announcements
- Shows in panel + home page banner
- Red/destructive theme
- Examples: Maintenance, policy changes, urgent updates

### Managing Notifications

**View Statistics**:
- Total users notified
- Read count (green)
- Unread count (red)

**Delete Notification**:
- Click trash icon
- Confirm deletion
- Notification becomes inactive (hidden from users)

## 🎨 Visual Guide

### User View
```
┌─────────────────────────────────────┐
│  Welcome back, John Doe       🔔 (3) │  ← Header
├─────────────────────────────────────┤
│  [Company Banner]                   │
├─────────────────────────────────────┤
│  💰 My Wallet                       │
│  Balance | Earnings | Withdrawable  │
├─────────────────────────────────────┤
│  ⚠️ Important: System maintenance... │  ← Scrolling Banner
│     (scrolls left to right)         │
└─────────────────────────────────────┘
```

### Notification Panel
```
┌─────────────────────────┐
│  Notifications          │
│  ─────────────────────  │
│  [Mark all as read]     │
│                         │
│  ⚠️ System Maintenance  │
│  Platform will be...    │
│  2h ago              🔵 │  ← Unread indicator
│                         │
│  📋 New Products        │
│  Check out our...       │
│  1d ago                 │
└─────────────────────────┘
```

### Admin Panel
```
┌─────────────────────────────────────┐
│  Notifications                      │
│  [+ Create Notification]            │
├─────────────────────────────────────┤
│  ⚠️ System Maintenance [Important]  │
│  Platform will be down for...       │
│  Created: 2025-12-29 10:00 AM       │
│  📊 100 Total | 75 Read | 25 Unread │
│                              [🗑️]   │
├─────────────────────────────────────┤
│  📋 New Products [General]          │
│  Check out our latest...            │
│  Created: 2025-12-28 3:00 PM        │
│  📊 100 Total | 90 Read | 10 Unread │
│                              [🗑️]   │
└─────────────────────────────────────┘
```

## 📝 Example Notifications

### General Notifications
```
Title: New Investment Products Available
Message: We've added 5 new investment products with competitive daily returns. Check them out in the Products section!
Type: General
```

```
Title: Weekly Earnings Summary
Message: Your weekly earnings report is now available in your profile. Total earnings this week: ₹1,250.
Type: General
```

### Important Notifications
```
Title: Scheduled Maintenance
Message: Platform will be unavailable on Dec 30, 2025 from 2:00 AM to 4:00 AM for system upgrades. Please plan accordingly.
Type: Important
```

```
Title: Payment Processing Update
Message: Due to bank maintenance, withdrawal processing may be delayed by 24 hours. We apologize for the inconvenience.
Type: Important
```

## ⚡ Quick Tips

### For Admins
✅ **DO**:
- Use clear, concise titles
- Keep messages under 200 characters for mobile
- Use Important type only for critical announcements
- Delete outdated notifications regularly
- Test notification appearance before sending

❌ **DON'T**:
- Overuse Important type (causes alert fatigue)
- Send too many notifications (spam users)
- Use technical jargon
- Leave old notifications active
- Forget to proofread before sending

### For Users
✅ **DO**:
- Check notifications regularly
- Read important notifications immediately
- Mark notifications as read after viewing
- Report any issues to admin

## 🔧 Troubleshooting

### Issue: Notifications not showing
**Solution**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Unread count not updating
**Solution**: Click on notification to mark as read, then refresh

### Issue: Marquee not scrolling
**Solution**: Check if notification type is "Important", refresh page

### Issue: Can't create notification (Admin)
**Solution**: Verify you're logged in as admin, check all fields are filled

## 📊 Notification Statistics

Admins can track:
- **Total**: Number of users who received the notification
- **Read**: Number of users who opened the notification
- **Unread**: Number of users who haven't opened it yet

**Engagement Rate** = (Read / Total) × 100%

## 🎯 Best Practices

### Timing
- Send during business hours (9 AM - 6 PM)
- Avoid weekends for non-urgent notifications
- Schedule important notifications in advance

### Content
- **Title**: 5-10 words, action-oriented
- **Message**: 1-2 sentences, clear and direct
- **Tone**: Professional but friendly

### Frequency
- **General**: Max 2-3 per week
- **Important**: Only when truly necessary
- **Total**: Aim for less than 5 notifications per week

## 📱 Mobile Experience

### Header
- Bell icon clearly visible
- Badge shows on top-right of icon
- User greeting may truncate on small screens

### Notification Panel
- Full-screen on mobile
- Swipe from left to open
- Tap outside to close

### Marquee Banner
- Scrolls smoothly on all devices
- Touch to pause (mobile)
- Hover to pause (desktop)

## 🚀 Getting Started

### First Time Setup (Admin)
1. Login as admin
2. Navigate to Admin Panel → Notifications
3. Click "Create Notification"
4. Send a test notification:
   - Title: "Welcome to the Platform"
   - Message: "Thank you for joining us!"
   - Type: General
5. Check user view to verify appearance

### First Time Use (User)
1. Look for bell icon in header
2. Click to open notification panel
3. Read notifications
4. Click to mark as read
5. Check home page for important notifications

---

**Need Help?**
- Check NOTIFICATION_SYSTEM.md for detailed documentation
- Contact admin for support
- Report bugs via profile page

**Version**: 1.0
**Last Updated**: 2025-12-29
