# Telegram Support Link Feature

## Overview
Added Telegram support channel link configuration to allow users to easily access support through Telegram.

---

## Feature Details

### Admin Configuration

**Location**: Admin Panel → Company Settings

**Field**: Support Telegram Link
- **Label**: Telegram Channel/Group Link
- **Type**: URL input
- **Placeholder**: `https://t.me/yoursupport`
- **Description**: This link will be displayed in the user dashboard support section. Users can click to join your Telegram support channel.

**How to Configure**:
1. Login as admin
2. Navigate to Admin Panel → Company Settings
3. Scroll to "Support Telegram Link" section
4. Enter your Telegram channel or group link (e.g., `https://t.me/yourchannelname`)
5. Click "Save All Settings"

---

### User Experience

**Location**: User Dashboard (Home Page) → Quick Actions Section

**Support Button**:
- Icon: Headphones icon
- Label: "Support"
- Action: Opens Telegram link in new tab

**Behavior**:
- **If link configured**: Opens Telegram channel/group in new browser tab
- **If link not configured**: Shows alert message "Support link not configured. Please contact admin."

**Security**: Link opens with `noopener,noreferrer` attributes for security

---

## Implementation Details

### Files Modified

1. **src/pages/admin/AdminSettingsPage.tsx**
   - Added `supportTelegramLink` state variable
   - Added field to load settings from database
   - Added field to save settings to database
   - Added UI card with input field for Telegram link

2. **src/pages/HomePage.tsx**
   - Added `supportTelegramLink` state variable
   - Load Telegram link from company settings
   - Updated support button onClick handler to open Telegram link
   - Added fallback message when link not configured

### Database

**Table**: `company_settings`

**New Setting**:
- **Key**: `support_telegram_link`
- **Value**: Telegram channel/group URL
- **Type**: String (URL)

---

## Usage Examples

### Example Telegram Links

**Public Channel**:
```
https://t.me/yourchannelname
```

**Public Group**:
```
https://t.me/yourgroupname
```

**Private Channel/Group** (with invite link):
```
https://t.me/joinchat/XXXXXXXXXXXXX
```

**Bot**:
```
https://t.me/yourbotname
```

---

## Testing Checklist

### Admin Testing
- [ ] Login as admin
- [ ] Navigate to Company Settings
- [ ] Verify "Support Telegram Link" field is visible
- [ ] Enter a Telegram link
- [ ] Click "Save All Settings"
- [ ] Verify success message appears
- [ ] Refresh page and verify link is saved

### User Testing
- [ ] Login as regular user
- [ ] Navigate to Home page
- [ ] Locate "Support" button in quick actions
- [ ] Click support button
- [ ] Verify Telegram opens in new tab
- [ ] Verify correct channel/group opens

### Edge Cases
- [ ] Test with empty link (should show alert)
- [ ] Test with invalid URL (should still attempt to open)
- [ ] Test with different Telegram link formats
- [ ] Test that link opens in new tab (not same tab)

---

## User Guide

### For Admins

**Setting Up Support Channel**:

1. **Create Telegram Channel/Group** (if not already created):
   - Open Telegram app
   - Create a new channel or group for support
   - Make it public or generate an invite link

2. **Get the Link**:
   - For public channels: `https://t.me/yourchannelname`
   - For private channels: Share link → Copy invite link

3. **Configure in Admin Panel**:
   - Login to admin panel
   - Go to Company Settings
   - Paste Telegram link in "Support Telegram Link" field
   - Save settings

4. **Test**:
   - Login as regular user
   - Click support button
   - Verify it opens your Telegram channel

### For Users

**Getting Support**:

1. **Access Support**:
   - Login to your account
   - Go to Home page
   - Find "Support" button (headphones icon)
   - Click the button

2. **Join Telegram**:
   - Telegram will open in new tab
   - Click "Join Channel" or "Join Group"
   - Start chatting with support team

---

## Benefits

✅ **Easy Access**: One-click access to support channel
✅ **Real-time Support**: Users can get instant help via Telegram
✅ **Community Building**: Users can interact with each other
✅ **Flexible**: Admin can change link anytime
✅ **Secure**: Opens in new tab with security attributes
✅ **User-Friendly**: Clear fallback message if not configured

---

## Future Enhancements

Possible improvements for future versions:

1. **Multiple Support Channels**:
   - Add WhatsApp support link
   - Add Discord support link
   - Add Email support option

2. **Support Hours**:
   - Display support availability hours
   - Show online/offline status

3. **In-App Chat**:
   - Integrate Telegram widget for in-app chat
   - No need to leave the application

4. **Support Tickets**:
   - Create support ticket system
   - Track support requests

5. **FAQ Section**:
   - Add frequently asked questions
   - Reduce support load

---

## Troubleshooting

### Issue: Link Not Opening

**Possible Causes**:
- Pop-up blocker enabled
- Invalid Telegram link
- Browser security settings

**Solutions**:
- Disable pop-up blocker for this site
- Verify Telegram link is correct
- Try different browser

### Issue: Wrong Channel Opens

**Cause**: Incorrect link configured

**Solution**:
- Admin should verify and update the link in settings
- Make sure to copy the complete Telegram link

### Issue: "Link Not Configured" Message

**Cause**: Admin hasn't set up the Telegram link yet

**Solution**:
- Admin needs to configure the link in Company Settings
- Users should contact admin to set it up

---

## Summary

- ✅ Admin can configure Telegram support link in Company Settings
- ✅ Users can click support button to open Telegram in new tab
- ✅ Fallback message shown when link not configured
- ✅ Secure implementation with proper link attributes
- ✅ Easy to use and maintain

**Status**: ✅ Complete and Ready to Use
