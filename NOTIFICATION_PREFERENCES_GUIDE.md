# Emergency Booking System - Notification Preferences Integration

## ✅ WHAT'S BEEN IMPLEMENTED

### 1. **Database Schema** (Updated)
```sql
-- In profiles table
send_whatsapp boolean NULL DEFAULT true
send_email boolean NULL DEFAULT true
```

These flags allow users to opt-in/opt-out of notification channels.

---

## 📱 **Frontend: Notifications.tsx**

### Updated Features:
- ✅ Fetches user preferences from profiles table on load
- ✅ Filters notifications based on `notification_method` and user preferences
- ✅ Respects user choices for WhatsApp and Email notifications
- ✅ Shows only notifications the user has enabled

### Key Changes:
```typescript
// NEW: UserPreferences interface
interface UserPreferences {
  send_whatsapp: boolean;
  send_email: boolean;
}

// NEW: Fetch preferences on component mount
const fetchUserPreferences = async () => {
  const { data } = await supabase
    .from("profiles")
    .select("send_whatsapp, send_email")
    .eq("id", userId)
    .single();
  
  setUserPreferences(data);
};

// NEW: Filter notifications based on preferences
const visibleNotifications = notifications.filter((n) => {
  if (!n.notification_method) return true; // in-app always shown
  if (n.notification_method === 'email' && !userPreferences.send_email) return false;
  if (n.notification_method === 'whatsapp' && !userPreferences.send_whatsapp) return false;
  return true;
});
```

---

## 🔄 **n8n Workflow: With Preference Checking**

### Critical Changes:

#### **1. Doctor Query Now Fetches Preferences**
```sql
SELECT
  dp.user_id AS doctor_id,
  p.phone,
  p.send_whatsapp,     -- ✨ NEW
  p.send_email,        -- ✨ NEW
  dp.specialization
FROM doctor_profiles dp
JOIN profiles p ON p.id = dp.user_id
WHERE ...
```

#### **2. Conditional WhatsApp Notification**
```
If: $('Postgres - Find Alternate Doctor').item.json.send_whatsapp == true
  → Twilio - Call Doctor
Else: Skip (respect user preference)
```

#### **3. Conditional Email Notification**
```
If: $('Postgres - Find Alternate Doctor').item.json.send_email == true
  → SendGrid - Email Doctor
Else: Skip (respect user preference)
```

---

## 🎯 **Complete User Journey**

### **For Doctors:**

1. **Doctor A** receives emergency request
   - Workflow checks: `send_whatsapp = true`? → Sends WhatsApp/Call
   - Workflow checks: `send_email = true`? → Sends Email

2. **Doctor Doesn't Respond** (2 minute SLA)
   - Lock row with `FOR UPDATE`
   - Find alternative doctor with same specialization
   - Check alternative doctor's `send_whatsapp` and `send_email` preferences
   - Send notifications according to their preferences

3. **No Doctor Available**
   - Set `needs_manual_attention = true`
   - Set status to `manual_attention`
   - Alert admin via Slack
   - Log escalation in audit trail

### **For Patients:**

1. Patient sees notifications in app
2. Patient can control how notifications reach them:
   - WhatsApp notifications: Settings → Toggle `send_whatsapp`
   - Email notifications: Settings → Toggle `send_email`
   - In-app notifications: Always enabled

---

## 📊 **Database Audit Trail**

### escalation_history JSONB Example:
```json
[
  {
    "escalation_number": 1,
    "escalated_to_doctor_id": "doctor-2-id",
    "reason": "original_doctor_no_response",
    "timestamp": "2025-12-15T10:30:00Z",
    "specialization": "Cardiology",
    "doctor_preferences": {
      "send_whatsapp": true,
      "send_email": false
    }
  },
  {
    "escalation_number": 2,
    "escalated_to_doctor_id": "doctor-3-id",
    "reason": "second_doctor_no_response",
    "timestamp": "2025-12-15T10:35:00Z",
    "doctor_preferences": {
      "send_whatsapp": false,
      "send_email": true
    }
  }
]
```

---

## ⚙️ **How to Use the n8n Workflow**

### **Import Steps:**
1. Open n8n workspace
2. Create new workflow
3. Import JSON from: `n8n-emergency-workflow-with-preferences.json`
4. Update credentials:
   - Postgres account ID
   - Twilio account ID
   - SendGrid account ID
   - Slack webhook URL

### **Key Nodes:**
| Node | Purpose | Preferences Used |
|------|---------|------------------|
| Postgres - Find Alternate Doctor | Gets doctor + preferences | `send_whatsapp`, `send_email` |
| If - Send WhatsApp? | Checks `send_whatsapp` flag | Conditional |
| If - Send Email? | Checks `send_email` flag | Conditional |
| Twilio - Call Doctor | Only runs if WhatsApp enabled | send_whatsapp |
| SendGrid - Email Doctor | Only runs if Email enabled | send_email |

---

## 🔐 **Safety Features**

✅ **Row Locking**: `FOR UPDATE` prevents race conditions  
✅ **Escalation Cap**: `escalation_count < 3` prevents infinite loops  
✅ **Audit Trail**: Complete history in `escalation_history` JSONB  
✅ **Admin Fallback**: `manual_attention` flag for human review  
✅ **Preference Respect**: No unsolicited notifications  

---

## 📋 **Testing Checklist**

- [ ] Doctor with `send_whatsapp = true` receives Twilio call
- [ ] Doctor with `send_whatsapp = false` does NOT receive Twilio call
- [ ] Doctor with `send_email = true` receives SendGrid email
- [ ] Doctor with `send_email = false` does NOT receive email
- [ ] Patient sees notifications only for enabled channels
- [ ] Escalation history records doctor preferences at time of escalation
- [ ] Manual attention triggers when no doctor available
- [ ] Admin gets Slack alert on manual attention
- [ ] Row locking prevents double escalation under load

---

## 🚀 **Next Steps**

1. **Migrate the database** with the preference columns
2. **Update Notifications.tsx** with the changes (already done ✅)
3. **Import n8n workflow** and test with your Postgres/Twilio/SendGrid credentials
4. **Create user settings UI** to toggle preferences
5. **Monitor audit logs** for escalation patterns

---

## 📞 **Support Notification Methods**

Currently Supported:
- ✅ WhatsApp (via Twilio)
- ✅ Email (via SendGrid)
- ✅ In-App (via Realtime)

Future Enhancements:
- SMS (via Twilio)
- Push notifications (via Firebase)
- Slack (via webhook)
