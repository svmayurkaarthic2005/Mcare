# Email Notification Preferences - Implementation Guide

## ✅ What's Been Implemented

Email notification preferences are now fully integrated and can be toggled in the **Settings page**.

---

## 📋 How It Works

### **1. Database Schema**
```sql
profiles table:
  send_email boolean DEFAULT true
  send_whatsapp boolean DEFAULT true
```

### **2. Settings UI** (In Settings page)
Users can toggle email notifications:
- **Location**: Settings → Notifications → Email Notifications
- **Toggle**: ON = receive emails | OFF = no emails
- **Updates**: `send_email` column in profiles table

### **3. User Flow**

```
User goes to Settings
    ↓
Clicks Settings in Profile Dropdown
    ↓
Scrolls to "Notifications" section
    ↓
Toggles "Email Notifications" switch
    ↓
System updates send_email in profiles table
    ↓
Toast confirmation: "Notification preference updated"
```

---

## 🔄 Backend Logic

### **Load Preferences**
```typescript
// On Settings page load:
const { data } = await supabase
  .from("profiles")
  .select("send_email, send_whatsapp")
  .eq("id", user.id)
  .single();

setEmailNotifications(data.send_email ?? true);
```

### **Update Preferences**
```typescript
// When toggle is switched:
const { error } = await supabase
  .from("profiles")
  .update({ send_email: value })
  .eq("id", user.id);
```

---

## 🔐 How n8n Uses This Flag

When an emergency booking is escalated, the n8n workflow checks the doctor's `send_email` preference:

```sql
-- Find doctors with same specialization
SELECT
  dp.user_id AS doctor_id,
  p.phone,
  p.send_email,        -- ✨ Check this
  p.send_whatsapp,
  dp.specialization
FROM doctor_profiles dp
JOIN profiles p ON p.id = dp.user_id
WHERE ...
```

**In n8n Workflow:**
```
If: doctor.send_email == true
  → SendGrid - Send email notification
Else: Skip email (respect user preference)
```

---

## 📊 Current Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| Toggle in Settings | ✅ | Settings page → Notifications |
| Database column | ✅ | profiles.send_email |
| Load preference | ✅ | loadNotificationPreferences() |
| Update preference | ✅ | updateNotificationPreference() |
| n8n integration | ✅ | n8n-emergency-workflow-with-preferences.json |
| UI feedback | ✅ | Toast notifications |

---

## 🎯 User Experience

### **Enabling Email Notifications**
```
1. User navigates to Settings
2. Finds "Email Notifications" toggle
3. Toggles it ON
4. See: "Notification preference updated"
5. send_email = true in database
6. Receives email notifications from now on
```

### **Disabling Email Notifications**
```
1. User navigates to Settings
2. Finds "Email Notifications" toggle
3. Toggles it OFF
4. See: "Notification preference updated"
5. send_email = false in database
6. Stops receiving email notifications
```

---

## 🧪 Testing Checklist

- [ ] User toggles email ON → `send_email = true` in DB
- [ ] User toggles email OFF → `send_email = false` in DB
- [ ] Settings page loads current preference correctly
- [ ] Toast shows on preference change
- [ ] n8n respects preference (sends email if ON, skips if OFF)
- [ ] Doctor receives email only when `send_email = true`

---

## 📝 Related Files

- [Settings.tsx](src/pages/Settings.tsx#L115-L250) - Email toggle UI & logic
- [Notifications.tsx](src/components/dashboard/Notifications.tsx#L46-L65) - Respects preferences
- [20251215_add_notification_preferences.sql](supabase/migrations/20251215_add_notification_preferences.sql) - Migration
- [n8n-emergency-workflow-with-preferences.json](n8n-emergency-workflow-with-preferences.json) - Workflow checks preferences

---

## 💡 How to Add More Notification Channels

To add SMS or other channels:

1. **Add column to profiles table** (migration)
   ```sql
   ALTER TABLE profiles ADD COLUMN send_sms boolean DEFAULT true;
   ```

2. **Update Settings UI**
   ```typescript
   <Switch
     checked={smsNotifications}
     onCheckedChange={(checked) => {
       setSmsNotifications(checked);
       updateNotificationPreference("sms_notifications", checked);
     }}
   />
   ```

3. **Update updateNotificationPreference()**
   ```typescript
   if (field === "sms_notifications") {
     updateData.send_sms = value;
   }
   ```

4. **Update n8n workflow** to check `send_sms` preference

---

## ✨ Summary

Email notifications are now **user-controlled** and **database-backed**. Users have full control over which notification channels they want to use, and the n8n workflow respects these preferences before sending notifications.
