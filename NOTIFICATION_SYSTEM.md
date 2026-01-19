# Notification System Documentation

## Overview
The Investment Product Platform now includes a comprehensive notification system that allows admins to send announcements to all users. The system supports two types of notifications: **General** and **Important**.

## Features

### User Features
1. **Header Notification Icon**
   - Located on the right side of the header
   - Shows unread notification count badge
   - Click to open notification panel

2. **Notification Panel**
   - Slide-out sheet from the left side
   - Displays all notifications with read/unread status
   - Shows notification type (General/Important)
   - Displays relative timestamps (e.g., "2h ago", "3d ago")
   - Click on unread notification to mark as read
   - "Mark all as read" button for bulk action

3. **Important Notification Banner**
   - Displayed on home page below "My Wallet" section
   - Scrolling marquee animation (left to right)
   - Only shows important notifications
   - Pauses on hover for easy reading
   - Red/destructive theme for visibility

4. **User Greeting**
   - Located on the left side of the header
   - Displays "Welcome back, [Username]"

### Admin Features
1. **Notification Management Page**
   - Accessible from admin sidebar (Bell icon)
   - Create new notifications
   - View all sent notifications
   - Delete notifications (marks as inactive)
   - View notification statistics (total, read, unread)

2. **Create Notification**
   - Title field (required)
   - Message field (required)
   - Type selection: General or Important
   - Sends to all users automatically
   - Shows success confirmation with user count

3. **Notification Statistics**
   - Total users notified
   - Read count (green)
   - Unread count (red)
   - Real-time tracking

## Database Schema

### Tables

#### `notifications`
Stores all system notifications created by admins.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| type | TEXT | 'general' or 'important' |
| created_by | UUID | Admin user ID (FK to profiles) |
| is_active | BOOLEAN | Active status (false = deleted) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `user_notifications`
Tracks read status for each user-notification pair.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID (FK to profiles) |
| notification_id | UUID | Notification ID (FK to notifications) |
| is_read | BOOLEAN | Read status |
| read_at | TIMESTAMPTZ | When marked as read |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Unique Constraint**: (user_id, notification_id)

### RPC Functions

#### `create_notification_for_all_users()`
Creates a notification and automatically creates user_notification records for all users.

**Parameters**:
- `p_title` (TEXT): Notification title
- `p_message` (TEXT): Notification message
- `p_type` (TEXT): 'general' or 'important'
- `p_created_by` (UUID): Admin user ID

**Returns**: JSON object with success status, notification_id, and users_notified count

**Security**: Only admins can execute

#### `mark_notification_as_read()`
Marks a notification as read for a specific user.

**Parameters**:
- `p_user_id` (UUID): User ID
- `p_notification_id` (UUID): Notification ID

**Returns**: VOID

**Security**: Users can only mark their own notifications

#### `get_unread_notification_count()`
Gets the count of unread notifications for a user.

**Parameters**:
- `p_user_id` (UUID): User ID

**Returns**: INTEGER (unread count)

**Security**: Users can only get their own count

### Row Level Security (RLS)

#### Notifications Table
- **Admins**: Full access (SELECT, INSERT, UPDATE, DELETE)
- **Users**: SELECT only for active notifications

#### User Notifications Table
- **Users**: SELECT, INSERT, UPDATE for their own records
- **Admins**: SELECT for all records

## API Functions

### User API (`notificationApi`)

```typescript
// Get all notifications with read status
getUserNotifications(userId: string): Promise<NotificationWithReadStatus[]>

// Get important notifications only
getImportantNotifications(userId: string): Promise<NotificationWithReadStatus[]>

// Get unread notification count
getUnreadCount(userId: string): Promise<number>

// Mark notification as read
markAsRead(userId: string, notificationId: string): Promise<void>

// Mark all notifications as read
markAllAsRead(userId: string): Promise<void>
```

### Admin API (`adminNotificationApi`)

```typescript
// Get all notifications (admin view)
getAllNotifications(): Promise<Notification[]>

// Create notification for all users
createNotification(
  title: string,
  message: string,
  type: NotificationType,
  createdBy: string
): Promise<any>

// Update notification
updateNotification(
  notificationId: string,
  updates: Partial<Notification>
): Promise<Notification>

// Delete notification (set inactive)
deleteNotification(notificationId: string): Promise<void>

// Get notification statistics
getNotificationStats(notificationId: string): Promise<{
  total: number;
  read: number;
  unread: number;
}>
```

## Components

### Header Component
**Location**: `src/components/layouts/Header.tsx`

**Features**:
- Notification bell icon with unread badge
- User greeting on the right
- Slide-out notification panel
- Real-time unread count updates

**Usage**:
```tsx
import { Header } from '@/components/layouts/Header';

<Header />
```

### ImportantNotificationBanner Component
**Location**: `src/components/layouts/ImportantNotificationBanner.tsx`

**Features**:
- Displays important notifications only
- Marquee scrolling animation
- Pauses on hover
- Destructive theme for visibility

**Usage**:
```tsx
import { ImportantNotificationBanner } from '@/components/layouts/ImportantNotificationBanner';

<ImportantNotificationBanner />
```

### AdminNotificationsPage
**Location**: `src/pages/admin/AdminNotificationsPage.tsx`

**Features**:
- Create new notifications
- View all notifications with statistics
- Delete notifications
- Type badges (General/Important)
- Read/unread statistics

## User Flow

### Viewing Notifications
1. User sees notification badge on bell icon in header
2. User clicks bell icon
3. Notification panel slides out from left
4. User sees list of all notifications (newest first)
5. Unread notifications have blue dot indicator
6. User clicks on unread notification
7. Notification is marked as read
8. Badge count updates automatically

### Important Notifications
1. Admin creates notification with type "Important"
2. Notification appears in user's notification panel
3. Notification also appears as scrolling banner on home page
4. Banner scrolls continuously from right to left
5. User can hover to pause and read
6. Banner remains until notification is deleted by admin

## Admin Flow

### Creating Notifications
1. Admin navigates to Admin Panel → Notifications
2. Admin clicks "Create Notification" button
3. Admin fills in:
   - Title (e.g., "System Maintenance")
   - Message (e.g., "Platform will be down for maintenance on...")
   - Type (General or Important)
4. Admin clicks "Send Notification"
5. System creates notification and sends to all users
6. Success message shows number of users notified

### Managing Notifications
1. Admin views list of all sent notifications
2. Each notification shows:
   - Title and message
   - Type badge
   - Creation date
   - Statistics (total, read, unread)
3. Admin can delete notifications (marks as inactive)
4. Deleted notifications no longer appear to users

## Notification Types

### General Notifications
- **Purpose**: Regular announcements, updates, news
- **Display**: Notification panel only
- **Theme**: Secondary/neutral colors
- **Icon**: Info icon
- **Examples**:
  - "New products added to the platform"
  - "Weekly earnings summary available"
  - "Referral bonus program launched"

### Important Notifications
- **Purpose**: Critical announcements, urgent updates
- **Display**: Notification panel + Home page banner
- **Theme**: Destructive/red colors
- **Icon**: Alert circle icon
- **Examples**:
  - "System maintenance scheduled"
  - "Important policy changes"
  - "Security updates required"
  - "Payment processing delays"

## Styling

### Marquee Animation
**Location**: `src/index.css`

```css
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 20s linear infinite;
}

.animate-marquee:hover {
  animation-play-state: paused;
}
```

**Customization**:
- Speed: Change `20s` to adjust scroll speed (lower = faster)
- Direction: Reverse animation for right-to-left
- Pause: Remove `:hover` rule to disable pause on hover

## Best Practices

### For Admins
1. **Use Important Sparingly**: Only for critical announcements
2. **Keep Messages Concise**: Users see notifications on mobile
3. **Clear Titles**: Make the subject immediately clear
4. **Timely Deletion**: Remove outdated notifications
5. **Test First**: Create a test notification to verify appearance

### For Developers
1. **Error Handling**: All API calls include try-catch blocks
2. **Loading States**: Show loading indicators during data fetch
3. **Optimistic Updates**: Update UI before server confirmation
4. **Real-time Updates**: Refresh counts after marking as read
5. **Performance**: Use pagination for large notification lists

## Troubleshooting

### Notifications Not Appearing
1. Check if notification is active (`is_active = true`)
2. Verify user has record in `user_notifications` table
3. Check RLS policies are correctly configured
4. Verify user is authenticated

### Unread Count Not Updating
1. Hard refresh browser (Ctrl+Shift+R)
2. Check `get_unread_notification_count` RPC function
3. Verify `mark_notification_as_read` is being called
4. Check browser console for errors

### Marquee Not Scrolling
1. Verify CSS animation is loaded
2. Check if notification type is "important"
3. Inspect element for `animate-marquee` class
4. Verify no CSS conflicts

### Admin Can't Create Notifications
1. Verify user role is "admin"
2. Check `create_notification_for_all_users` RPC function
3. Verify RLS policy allows admin access
4. Check for database errors in console

## Future Enhancements

### Potential Features
1. **Notification Categories**: Finance, Products, System, etc.
2. **Scheduled Notifications**: Send at specific date/time
3. **User Preferences**: Allow users to mute certain types
4. **Rich Content**: Support images, links, formatting
5. **Push Notifications**: Browser push notifications
6. **Notification History**: Archive old notifications
7. **Targeted Notifications**: Send to specific user groups
8. **Email Integration**: Send important notifications via email
9. **Read Receipts**: Track when users read notifications
10. **Notification Templates**: Pre-defined message templates

## Testing Checklist

### User Testing
- [ ] Notification badge shows correct unread count
- [ ] Clicking bell icon opens notification panel
- [ ] Notifications display with correct type badges
- [ ] Clicking unread notification marks it as read
- [ ] Badge count updates after marking as read
- [ ] "Mark all as read" button works correctly
- [ ] Important notifications appear on home page
- [ ] Marquee animation scrolls smoothly
- [ ] Marquee pauses on hover
- [ ] User greeting displays correct username

### Admin Testing
- [ ] Admin can access notifications page
- [ ] Create notification dialog opens correctly
- [ ] All form fields are required
- [ ] Type selection works (General/Important)
- [ ] Notification sends to all users
- [ ] Success message shows user count
- [ ] Notification list displays all notifications
- [ ] Statistics show correct counts
- [ ] Delete button marks notification as inactive
- [ ] Deleted notifications don't appear to users

## Security Considerations

1. **RLS Policies**: Ensure users can only access their own notification status
2. **Admin Verification**: Only admins can create/delete notifications
3. **SQL Injection**: Use parameterized queries (handled by Supabase)
4. **XSS Prevention**: React automatically escapes content
5. **Rate Limiting**: Consider limiting notification creation frequency
6. **Input Validation**: Validate title and message length
7. **Authorization**: Verify admin role before sensitive operations

---

**Version**: 1.0
**Last Updated**: 2025-12-29
**Status**: Production Ready

**Related Documentation**:
- STATUS.md - Overall project status
- TODO.md - Development progress
- FINAL_SUMMARY.md - Complete feature list
