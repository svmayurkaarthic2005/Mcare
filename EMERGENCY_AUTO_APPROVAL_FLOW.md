# Emergency Appointment Auto-Approval Flow

## Overview
Emergency appointments in MCare follow an automated approval process managed by n8n workflow and database schema. Here's how it works:

---

## 1. Database Schema (Migration: `20251129_add_emergency_bookings_table.sql`)

### Table: `emergency_bookings`

```sql
- id (UUID) - Primary key
- patient_id (UUID) - Who requested emergency appointment
- doctor_id (UUID) - Assigned doctor
- appointment_id (UUID) - Link to regular appointments table
- reason (TEXT) - Why emergency booking is needed
- urgency_level (TEXT) - 'low', 'medium', 'high', 'critical'
- status (TEXT) - DEFAULT 'pending'
  ✓ pending      - Initial state, waiting for doctor
  ✓ approved     - Doctor assigned and accepted
  ✓ rejected     - Doctor rejected
  ✓ cancelled    - Patient cancelled
  ✓ completed    - Appointment done
  ✓ manual_attention - Escalation needed (no doctor available)
- doctor_notes (TEXT) - Doctor's comments
- requested_at - When patient requested emergency
- responded_at - When doctor accepted
- scheduled_date - Appointment scheduled time
```

### Escalation Tracking (Migration: `20251214_add_escalation_tracking_to_emergency_bookings.sql`)

```sql
- escalation_count (INT) - How many times reassigned to different doctor
- needs_manual_attention (BOOLEAN) - Flag for admin review
- last_escalated_at (TIMESTAMP) - When last escalation happened
- escalation_history (JSONB) - Log of all escalations
```

---

## 2. N8N Workflow Auto-Approval Process

### Trigger: `Postgres Trigger1`
```
Listens to emergency_bookings table changes
→ When INSERT or UPDATE occurs
→ Triggers n8n workflow
```

---

## 3. Workflow Steps

### Step 1: Find Next Available Doctor (`Postgres1`)

```sql
WITH locked AS (
  SELECT * FROM emergency_bookings
  WHERE id = '{{ $json.payload.id }}'
    AND status = 'pending'
    AND escalation_count < 3  -- Max 3 escalations
  FOR UPDATE
)

SELECT next_doctor AS (
  SELECT dp.user_id AS doctor_id, p.phone
  FROM doctor_profiles dp
  JOIN profiles p ON p.id = dp.user_id
  WHERE dp.specialization = (current_doctor's_specialization)
    AND dp.available_for_consultation = true
    AND dp.user_id <> current_doctor_id
  ORDER BY dp.updated_at ASC
  LIMIT 1
)

UPDATE emergency_bookings eb
SET doctor_id = next_doctor.doctor_id,
    escalation_count = escalation_count + 1,
    updated_at = now()
```

**Logic:**
- Finds doctors with SAME SPECIALIZATION
- Only available doctors (`available_for_consultation = true`)
- Skips current doctor
- Orders by `updated_at` (oldest = least recently used)
- Maximum 3 escalation attempts

---

### Step 2: Check if Doctor Found (`If1`)

```
Condition: doctor_id NOT EMPTY AND phone NOT EMPTY
```

**IF TRUE (Doctor Found):**
- Go to `Postgres2` → AUTO-APPROVE

**IF FALSE (No Doctor Available):**
- Go to `Postgres3` → MANUAL ATTENTION

---

### Step 3A: AUTO-APPROVE (`Postgres2`)

```sql
BEGIN;

UPDATE emergency_bookings
SET doctor_id = '{{ doctor_id }}',
    escalation_count = escalation_count + 1,
    status = 'approved',  -- ✅ AUTO-APPROVED
    updated_at = now()
WHERE id = '{{ booking_id }}'
  AND status = 'pending';

COMMIT;
```

**Result:**
- Status changed from `pending` → `approved`
- Doctor assigned automatically
- Appointment becomes LIVE for this doctor

Then triggers:
- `HTTP Request` → Calls doctor via Twilio with voice API
- Doctor gets automatic call about emergency booking

---

### Step 3B: MANUAL ATTENTION (`Postgres3`)

```sql
UPDATE emergency_bookings
SET status = 'manual_attention',
    updated_at = now()
WHERE id = '{{ booking_id }}';
```

**Conditions when this happens:**
- Escalation count reached 3
- No available doctors with same specialization
- System exhausted automatic matching

Then triggers:
- `Make a call1` → Admin gets SMS/Call about case

---

## 4. Complete Auto-Approval Timeline

```
1. Patient requests emergency appointment
   ↓
2. Database INSERT → emergency_bookings (status='pending')
   ↓
3. Postgres Trigger1 fires → n8n workflow starts
   ↓
4. Postgres1: Search for available doctor with same specialization
   ↓
5. If1: Check results
   ├─ DOCTOR FOUND (If1 = TRUE)
   │  ↓
   │  Postgres2: Set status='approved' + escalation_count++
   │  ↓
   │  ✅ EMERGENCY BOOKING AUTO-APPROVED
   │  ↓
   │  HTTP Request: Make Twilio voice call to doctor
   │
   └─ NO DOCTOR FOUND (If1 = FALSE)
      ↓
      Postgres3: Set status='manual_attention'
      ↓
      Make a call1: Alert admin via Twilio
      ↓
      🔔 MANUAL HANDLING REQUIRED
```

---

## 5. Key Configuration Points

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Max Escalations | 3 | Prevents infinite loops |
| Specialization Match | YES | Find same-specialty doctor |
| Availability Check | `available_for_consultation=true` | Only active doctors |
| Status Transition | pending → approved | Automatic booking |
| Doctor Selection | `updated_at ASC` | Load balancing (round-robin style) |
| Call Type | Voice API | Real-time doctor notification |

---

## 6. Emergency Approval Scenarios

### ✅ Scenario 1: Instant Auto-Approval
```
Patient: "I need emergency cardiology consultation"
  ↓
n8n finds: Dr. Sharma (Cardiology, Available)
  ↓
Status: APPROVED
  ↓
Dr. Sharma receives voice call
  ↓
Patient sees: "Approved - Dr. Sharma assigned"
```

### ⚠️ Scenario 2: Escalation (Doctor Busy)
```
Patient: "I need emergency cardiology"
  ↓
n8n finds: Dr. Sharma (BUSY)
  ↓
n8n finds: Dr. Patel (Cardiology, Available) [1st escalation]
  ↓
Status: APPROVED
  ↓
Dr. Patel receives voice call
```

### 🔴 Scenario 3: Manual Attention (No Doctors)
```
Patient: "I need emergency cardiology at 3AM"
  ↓
n8n finds: No available cardiologists [escalation_count=3]
  ↓
Status: MANUAL_ATTENTION
  ↓
Admin receives: SMS/Call alert
  ↓
Admin manually: Reassign or reject
```

---

## 7. RLS Policies (Row Level Security)

### Patients Can:
- View own emergency bookings
- Create emergency bookings
- Update own emergency bookings

### Doctors Can:
- View emergency bookings assigned to them
- Update status (approve/reject)
- Add doctor_notes

### Admin (Future):
- Override manual_attention cases
- Force reassignment

---

## 8. Indexes for Performance

```sql
idx_emergency_bookings_patient_id        -- Find bookings by patient
idx_emergency_bookings_doctor_id          -- Find bookings by doctor
idx_emergency_bookings_status             -- Find pending/approved
idx_emergency_bookings_escalation_count   -- Monitor escalation attempts
idx_emergency_bookings_needs_manual_attention -- Find failed automations
idx_emergency_bookings_pending_escalation -- Combined query optimization
```

---

## 9. Integration Points

### Database → N8N
- PostgreSQL Trigger detects INSERT/UPDATE
- Real-time workflow execution

### N8N → Twilio
- Voice calls to doctors
- SMS alerts to admin

### N8N → Database
- Update status
- Log escalation attempts

---

## 10. Failure Handling

| Failure Point | Handling |
|---------------|----------|
| No doctors available | Status → manual_attention |
| Twilio call fails | Retry logic in n8n |
| Doctor rejects | Can escalate to next doctor |
| Max escalations reached | Admin manual review |
| Doctor offline | Next available doctor tried |

---

## Summary

**Emergency appointments are auto-approved when:**
1. ✅ System finds available doctor with same specialization
2. ✅ Doctor confirms acceptance via voice call
3. ✅ Database status updated to 'approved'
4. ✅ Patient sees instant confirmation

**Manual approval needed when:**
1. ❌ No available doctors (status → manual_attention)
2. ❌ Max escalations exceeded
3. ❌ Doctor explicitly rejects

This ensures **24/7 emergency coverage** with **automatic load balancing** and **human fallback** for edge cases.
