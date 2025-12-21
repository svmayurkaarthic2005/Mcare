# Offline/Online Consultation - Changes Summary

## 📋 Quick Overview

Added support for online and offline consultations with the following changes:

## 🗄️ Database Schema Changes

### `appointments` table
```sql
ALTER TABLE appointments ADD COLUMN consultation_type TEXT DEFAULT 'online' CHECK (consultation_type IN ('online', 'offline'));
ALTER TABLE appointments ADD COLUMN meeting_url TEXT;
ALTER TABLE appointments ADD COLUMN clinic_location TEXT;
```

### `emergency_bookings` table
```sql
ALTER TABLE emergency_bookings ADD COLUMN consultation_type TEXT DEFAULT 'online' CHECK (consultation_type IN ('online', 'offline'));
ALTER TABLE emergency_bookings ADD COLUMN meeting_url TEXT;
ALTER TABLE emergency_bookings ADD COLUMN clinic_location TEXT;
```

## 💻 Frontend Changes

### Request Appointment Dialog - NEW Fields

**Before:**
- Date picker
- Time selector
- Reason textarea

**After:**
- Date picker ✓
- Time selector ✓
- **Consultation Type Selector** ✨ NEW
  ```
  ○ Online (Video Call)
  ○ Offline (In-Person)
  ```
- **Conditional Fields** ✨ NEW
  - If Online: Meeting URL input
  - If Offline: Clinic Location textarea
- Reason textarea ✓

### Form Validation

| Field | Online | Offline |
|-------|--------|---------|
| Date | Required | Required |
| Time | Required | Required |
| Consultation Type | Required | Required |
| Meeting URL | Required | - |
| Clinic Location | - | Required |
| Reason | Optional | Optional |

## 📁 Files Modified

### 1. **Migration** (NEW)
```
supabase/migrations/20251221_add_consultation_type.sql
```
- Adds consultation_type, meeting_url, clinic_location to appointments
- Adds consultation_type, meeting_url, clinic_location to emergency_bookings
- Creates 6 new indexes for performance

### 2. **TypeScript Types** (UPDATED)
```
src/integrations/supabase/types.ts
```
- Updated `appointments` Row/Insert/Update types
- Updated `emergency_bookings` Row/Insert/Update types

### 3. **Component** (UPDATED)
```
src/components/dashboard/AvailableDoctors.tsx
```
- Added consultation type state variables
- Updated requestAppointment() function with validation
- Enhanced dialog form with consultation type selection
- Conditional rendering of meeting URL/clinic location fields

## 🔄 Data Flow

```
Patient Books Appointment
        ↓
Selects Consultation Type
        ├─→ ONLINE
        │   ├─ Pastes meeting URL
        │   └─ meeting_url saved to DB
        │
        └─→ OFFLINE
            ├─ Enters clinic location
            └─ clinic_location saved to DB
        ↓
Doctor receives notification with consultation type
        ↓
Doctor approves appointment
        ↓
Doctor has access to meeting URL or clinic location
```

## 🎯 Next Steps (Recommended)

### Immediate:
1. ✅ Apply migration to database
2. ✅ Test appointment booking with both types
3. ✅ Verify data saves correctly

### Short-term:
1. 📺 Update PatientAppointments component to show consultation type
2. 👨‍⚕️ Update AppointmentManagement to display meeting URL/location
3. 🔔 Update notification messages to include consultation details

### Long-term:
1. 🎥 Auto-generate Zoom/Google Meet links via API
2. 📱 Send meeting links/clinic info via SMS/Email
3. 💰 Different pricing for online vs offline
4. ⚙️ Doctor profile settings for consultation preferences

## 🗝️ Key Features

✨ **Type Safety:** Enforced at database level with CHECK constraint  
✨ **Performance:** Indexed columns for faster queries  
✨ **UX:** Conditional fields - only show what's needed  
✨ **Validation:** Required fields based on consultation type  
✨ **Flexibility:** Works with both regular and emergency appointments  

## 💾 Data Examples

### Online Appointment
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "appointment_date": "2025-12-25T14:30:00Z",
  "consultation_type": "online",
  "meeting_url": "https://zoom.us/j/123456789",
  "clinic_location": null,
  "reason": "General checkup",
  "status": "pending"
}
```

### Offline Appointment
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "appointment_date": "2025-12-25T14:30:00Z",
  "consultation_type": "offline",
  "meeting_url": null,
  "clinic_location": "Healthcare Center, 3rd Floor, Room 301, Mumbai",
  "reason": "General checkup",
  "status": "pending"
}
```
