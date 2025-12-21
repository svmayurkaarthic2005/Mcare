# Offline and Online Consultation Implementation Guide

## Overview
Added support for both online (video call) and offline (in-person) consultations to the healthcare platform. This includes database schema updates, TypeScript type definitions, and frontend UI components.

## Database Changes

### 1. Migration File: `20251221_add_consultation_type.sql`

#### New Columns Added:

**`appointments` table:**
- `consultation_type` (TEXT) - DEFAULT: 'online' - CHECK constraint: 'online', 'offline'
- `meeting_url` (TEXT, nullable) - Video call link for online consultations
- `clinic_location` (TEXT, nullable) - Physical clinic address for offline consultations

**`emergency_bookings` table:**
- `consultation_type` (TEXT) - DEFAULT: 'online' - CHECK constraint: 'online', 'offline'
- `meeting_url` (TEXT, nullable) - Video call link for online emergency bookings
- `clinic_location` (TEXT, nullable) - Physical clinic address for offline emergency bookings

#### Indexes Created:
- `idx_appointments_consultation_type` - For filtering by consultation type
- `idx_emergency_bookings_consultation_type` - For filtering emergency bookings by type
- `idx_appointments_doctor_type` - Composite index for doctor's online/offline appointments
- `idx_appointments_patient_type` - Composite index for patient's online/offline appointments
- `idx_emergency_bookings_doctor_type` - Composite index for doctor's emergency bookings by type
- `idx_emergency_bookings_patient_type` - Composite index for patient's emergency bookings by type

## TypeScript Type Updates

### File: `src/integrations/supabase/types.ts`

Updated the following table types to include new fields:

**appointments Row/Insert/Update:**
```typescript
consultation_type?: string
meeting_url?: string | null
clinic_location?: string | null
```

**emergency_bookings Row/Insert/Update:**
```typescript
consultation_type?: string
meeting_url?: string | null
clinic_location?: string | null
```

## Frontend Component Changes

### File: `src/components/dashboard/AvailableDoctors.tsx`

#### New State Variables:
```typescript
const [consultationType, setConsultationType] = useState<"online" | "offline">("online");
const [meetingUrl, setMeetingUrl] = useState("");
const [clinicLocation, setClinicLocation] = useState("");
```

#### Updated Dialog Form:
1. **Consultation Type Selector** - Radio-style dropdown to choose between:
   - Online (Video Call)
   - Offline (In-Person)

2. **Conditional Input Fields:**
   - **For Online:** Meeting URL input field with placeholder examples
   - **For Offline:** Clinic location textarea for address and directions

3. **Form Validation:**
   - Requires consultation type to be selected
   - For online consultations: requires a meeting URL
   - For offline consultations: requires a clinic location

#### Updated `requestAppointment()` Function:
- Validates consultation type-specific fields
- Saves `consultation_type`, `meeting_url`, or `clinic_location` based on selection
- Clears all fields after successful submission
- Includes consultation type in notification message to doctor

## How to Use

### For Patients:

1. **Book an Appointment:**
   - Select a doctor from the Available Doctors list
   - Click "Book" button
   - Fill in appointment date and time
   - **NEW:** Select consultation type:
     - **Online:** Paste your Zoom/Google Meet/Teams link
     - **Offline:** Enter clinic address and directions

2. **Submit Request:**
   - Click "Request Appointment"
   - System validates all required fields
   - Doctor receives notification with consultation type

### For Doctors:

1. **View Appointments:**
   - See consultation type (Online/Offline) in appointment details
   - View meeting URL or clinic location accordingly

2. **Emergency Bookings:**
   - Same consultation type selection applies
   - Specify meeting URL or clinic location when scheduling

## Database Query Examples

### Find all online appointments for a doctor:
```sql
SELECT * FROM appointments 
WHERE doctor_id = 'doctor_id' AND consultation_type = 'online';
```

### Find all offline appointments for a patient:
```sql
SELECT * FROM appointments 
WHERE patient_id = 'patient_id' AND consultation_type = 'offline';
```

### Get emergency bookings with consultation details:
```sql
SELECT id, reason, consultation_type, meeting_url, clinic_location 
FROM emergency_bookings 
WHERE doctor_id = 'doctor_id' AND status = 'approved';
```

## Future Enhancements

1. **Auto-generate Meeting Links:**
   - Integrate Zoom API or Google Meet API for automatic link generation
   - Automatically create and send meeting links when appointment is approved

2. **Doctor Profile Settings:**
   - Allow doctors to configure their clinic location
   - Set default consultation preferences (online/offline/both)

3. **Patient Preferences:**
   - Store patient consultation preferences
   - Auto-fill preferred consultation type

4. **Search & Filter:**
   - Filter doctors by available consultation types
   - Show only doctors offering online/offline consultations

5. **Calendar Integration:**
   - Color-code online (blue) vs offline (green) appointments
   - Better visual distinction in calendar views

6. **Notifications:**
   - Send meeting link via SMS/email for online consultations
   - Send clinic location via SMS/email for offline consultations

7. **Payment Integration:**
   - Different pricing for online vs offline consultations
   - Apply discounts for online consultations

## Migration Status
✅ Database schema updated
✅ TypeScript types updated
✅ Frontend form UI updated with consultation type selection
⏳ Components display updated (PatientAppointments, AppointmentManagement - recommended for UI enhancement)
⏳ Doctor dashboard display updates (showing consultation type and details)
⏳ Auto-generate meeting URLs (future enhancement)
⏳ Email/SMS notifications with consultation details (future enhancement)

## Files Modified
1. `supabase/migrations/20251221_add_consultation_type.sql` - NEW
2. `src/integrations/supabase/types.ts` - UPDATED
3. `src/components/dashboard/AvailableDoctors.tsx` - UPDATED

## Next Steps

1. **Run Migration:**
   - Apply the migration to your Supabase database
   - Verify all columns are created successfully

2. **Test Form:**
   - Create a test appointment with online consultation
   - Create a test appointment with offline consultation
   - Verify data is saved correctly in database

3. **Update Display Components:**
   - Update PatientAppointments to show consultation type
   - Update AppointmentManagement to display and allow editing
   - Add meeting URL/location to appointment detail views

4. **Add Doctor Settings:**
   - Allow doctors to set their clinic location in profile
   - Let doctors configure their default consultation type
