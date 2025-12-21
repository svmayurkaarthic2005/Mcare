# UI Implementation Guide - Offline/Online Consultations

## Request Appointment Dialog - Updated Form

```
┌─────────────────────────────────────────────┐
│  Request Appointment                      [×]│
│  Schedule a consultation with Dr. Ruyam      │
├─────────────────────────────────────────────┤
│                                             │
│  Date *                                     │
│  ┌─────────────────────────────────────┐   │
│  │  12/25/2025              📅         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Time * (8:00 AM - 8:30 PM)                │
│  ┌─────────────────────────────────────┐   │
│  │ ▼ Select appointment time           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Consultation Type *        [NEW FIELD]     │
│  ┌─────────────────────────────────────┐   │
│  │ ▼ Online (Video Call)  [SELECTED]   │   │
│  │   Offline (In-Person)               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Conditional: If Online Selected]          │
│  Meeting URL *              [NEW FIELD]     │
│  ┌─────────────────────────────────────┐   │
│  │ e.g., https://zoom.us/meeting/...  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Reason for Visit                           │
│  ┌─────────────────────────────────────┐   │
│  │ Describe your symptoms or reason... │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────────┬─────────────────────┐    │
│  │ Request Appt │       Cancel        │    │
│  └──────────────┴─────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Alternative: Offline Consultation Selected

```
┌─────────────────────────────────────────────┐
│  Consultation Type *                        │
│  ┌─────────────────────────────────────┐   │
│  │ ▼ Online (Video Call)               │   │
│  │   Offline (In-Person)  [SELECTED]   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Conditional: If Offline Selected]         │
│  Clinic Location *          [NEW FIELD]     │
│  ┌─────────────────────────────────────┐   │
│  │ Enter clinic address, room number,  │   │
│  │ or directions...                    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Reason for Visit                           │
│  ┌─────────────────────────────────────┐   │
│  │ Describe your symptoms or reason... │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────────┬─────────────────────┐    │
│  │ Request Appt │       Cancel        │    │
│  └──────────────┴─────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Appointment Display Card - Future Enhancement

```
┌───────────────────────────────────────────┐
│  Dr. Ruyam                           [Type]│
│  Cardiologist                         Tag  │
├───────────────────────────────────────────┤
│                                           │
│  📅 Dec 25, 2025 • 2:30 PM                │
│                                           │
│  Reason: General Checkup                  │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🎥 Online Consultation              │ │
│  │ Join: https://zoom.us/j/123456789   │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Status: Pending    [Approved button]     │
│                                           │
└───────────────────────────────────────────┘
```

## Appointment Display Card - Offline Example

```
┌───────────────────────────────────────────┐
│  Dr. Mayur                           [Type]│
│  Orthopedist                         Tag  │
├───────────────────────────────────────────┤
│                                           │
│  📅 Dec 26, 2025 • 10:00 AM               │
│                                           │
│  Reason: Knee Pain Consultation           │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🏥 Offline Consultation             │ │
│  │ Location:                           │ │
│  │ Healthcare Center, 3rd Floor        │ │
│  │ Room 301, Mumbai - 400001           │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Status: Approved    [Cancel button]      │
│                                           │
└───────────────────────────────────────────┘
```

## Database Record Examples

### Online Consultation Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_id": "patient-uuid-123",
  "doctor_id": "doctor-uuid-456",
  "appointment_date": "2025-12-25T14:30:00+05:30",
  "status": "pending",
  "reason": "General checkup and blood pressure monitoring",
  "notes": null,
  "created_at": "2025-12-21T10:15:00+05:30",
  "updated_at": "2025-12-21T10:15:00+05:30",
  "consultation_type": "online",
  "meeting_url": "https://zoom.us/j/123456789?pwd=abcdef",
  "clinic_location": null
}
```

### Offline Consultation Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "patient_id": "patient-uuid-123",
  "doctor_id": "doctor-uuid-456",
  "appointment_date": "2025-12-26T10:00:00+05:30",
  "status": "approved",
  "reason": "Knee pain and mobility assessment",
  "notes": "Bring recent X-ray reports if available",
  "created_at": "2025-12-21T10:20:00+05:30",
  "updated_at": "2025-12-21T11:45:00+05:30",
  "consultation_type": "offline",
  "meeting_url": null,
  "clinic_location": "Healthcare Center, 3rd Floor, Room 301, Mumbai - 400001"
}
```

## Emergency Booking - Consultation Type

Emergency bookings follow the same pattern:

```
┌─────────────────────────────────────────────┐
│  Emergency Booking                          │
│                                             │
│  Urgency: 🔴 CRITICAL                       │
│                                             │
│  Consultation Type *                        │
│  ┌─────────────────────────────────────┐   │
│  │ ▼ Online (Immediate Video Call)     │   │
│  │   Offline (Visit Clinic Now)        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Show conditional field based on selection]│
│                                             │
│  Reason for Emergency                       │
│  ┌─────────────────────────────────────┐   │
│  │ Describe urgent symptoms...         │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────────┬─────────────────────┐    │
│  │ Request      │       Cancel        │    │
│  │ Emergency    │                     │    │
│  └──────────────┴─────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Form Validation Flow

```
User Opens Dialog
    ↓
Fills Date & Time
    ↓
Selects Consultation Type
    ├─→ ONLINE
    │   ├─ Shows "Meeting URL" field
    │   ├─ User pastes URL
    │   └─ Validates URL format (optional)
    │
    └─→ OFFLINE
        ├─ Shows "Clinic Location" field
        ├─ User enters address
        └─ Validates text not empty

    ↓
User fills Reason (optional)
    ↓
Clicks "Request Appointment"
    ↓
Validation Check:
  ✓ Date selected
  ✓ Time selected
  ✓ Consultation type selected
  ✓ If Online: Meeting URL provided
  ✓ If Offline: Clinic Location provided
    ↓
  All Valid? YES → Submit to Database
             NO  → Show Error Toast
    ↓
Success Toast Shown
Dialog Closes
Form Resets
```

## Notification Message Examples

### Doctor Notification - Online
```
New appointment request

You have a new online appointment request for Dec 25, 2025 at 2:30 PM IST.
Reason: General Checkup

Meeting Link: [Will be shown in appointment details]
```

### Doctor Notification - Offline
```
New appointment request

You have a new offline appointment request for Dec 26, 2025 at 10:00 AM IST.
Reason: Knee Pain Consultation

Clinic Location: [Will be shown in appointment details]
```

## State Management

```typescript
// Consultation Type State
const [consultationType, setConsultationType] = useState<"online" | "offline">("online");

// Online-specific field
const [meetingUrl, setMeetingUrl] = useState("");

// Offline-specific field
const [clinicLocation, setClinicLocation] = useState("");

// Reset after successful submission
setMeetingUrl("");
setClinicLocation("");
setConsultationType("online");
```

## Conditional Rendering Logic

```typescript
{consultationType === "online" && (
  <div className="space-y-2">
    <Label htmlFor="meetingUrl">Meeting URL *</Label>
    <Input
      id="meetingUrl"
      placeholder="e.g., https://zoom.us/meeting/... or Google Meet link"
      value={meetingUrl}
      onChange={(e) => setMeetingUrl(e.target.value)}
    />
  </div>
)}

{consultationType === "offline" && (
  <div className="space-y-2">
    <Label htmlFor="clinicLocation">Clinic Location *</Label>
    <Textarea
      id="clinicLocation"
      placeholder="Enter clinic address, room number, or directions..."
      value={clinicLocation}
      onChange={(e) => setClinicLocation(e.target.value)}
      rows={2}
    />
  </div>
)}
```

## Testing Checklist

- [ ] Open Available Doctors dialog
- [ ] Select a doctor
- [ ] Click "Book"
- [ ] Fill in date and time
- [ ] Select "Online (Video Call)"
- [ ] Verify Meeting URL field appears
- [ ] Enter a meeting URL
- [ ] Submit - should succeed
- [ ] Open dialog again
- [ ] Select "Offline (In-Person)"
- [ ] Verify Clinic Location field appears (Meeting URL field hidden)
- [ ] Try to submit without clinic location - should show error
- [ ] Enter clinic location
- [ ] Submit - should succeed
- [ ] Check database - verify data saved correctly
