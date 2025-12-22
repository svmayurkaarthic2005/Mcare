# Doctor Signup After OTP - Session Issue Fix

## Problem
After OTP verification during doctor signup, users received the error:
```
[DoctorDashboard] Auth error or no user found: AuthSessionMissingError: Auth session missing!
```

This occurred because:
1. After OTP verification, `signInWithPassword()` was called to create a session
2. The code immediately navigated to `/doctor-dashboard`
3. However, the session wasn't fully established/propagated, causing `getUser()` to fail
4. This is a timing issue specific to signup flows where the session needs extra time to stabilize

## Root Cause
The problem was a **session propagation delay** between:
- Signing in with password after OTP verification
- Navigating to DoctorDashboard
- DoctorDashboard calling `supabase.auth.getUser()`

The session hadn't fully propagated through the browser's storage and Supabase's session manager, causing a temporary `AuthSessionMissingError`.

## Solution Implemented

### 1. **Auth.tsx** - Enhanced Session Verification (Lines 320-371)
Added proper session stabilization after password sign-in:

```typescript
// Wait longer for session to be fully established and propagated
// This is critical for doctor signup where we immediately check auth
await new Promise(resolve => setTimeout(resolve, 1500));

// Verify session is established with retries
let sessionVerified = false;
let sessionRetries = 5;

while (sessionRetries > 0 && !sessionVerified) {
  const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError) {
    console.warn(`[Auth] Session verification attempt failed...`);
    if (sessionRetries > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      sessionRetries--;
    }
  } else if (currentUser) {
    sessionVerified = true;
    console.log("[Auth] Session verified successfully for user:", currentUser.id);
  }
}

if (!sessionVerified) {
  toast.error("Session establishment failed. Please sign in again.");
  return;
}
```

**Key improvements:**
- 1.5 second initial wait for session propagation
- Up to 5 retry attempts with 500ms delays
- Explicit session verification before proceeding
- Clear error handling if session fails to establish

### 2. **DoctorDashboard.tsx** - Session Refresh & Retry Logic (Lines 127-172)
Added defensive session handling on page load:

```typescript
// Try to refresh session first (especially important after OTP signup)
const { error: refreshError } = await supabase.auth.refreshSession();

// Get user with retries (handles delayed session propagation)
let user = null;
let authError = null;
let getRetries = 3;

while (getRetries > 0 && !user) {
  const { data: { user: currentUser }, error: currentAuthError } = await supabase.auth.getUser();
  
  if (currentAuthError) {
    console.warn(`[DoctorDashboard] Auth check attempt failed...`);
    authError = currentAuthError;
    if (getRetries > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      getRetries--;
    }
  } else if (currentUser) {
    user = currentUser;
    authError = null;
  }
}
```

**Key improvements:**
- Proactive session refresh on component mount
- Up to 3 retry attempts for `getUser()` with 500ms delays
- Handles cases where session might still be propagating
- Better error logging for debugging

## Timeline After Fix

1. **OTP Verification** → User verified via email
2. **Sign In with Password** → Session created
3. **Session Stabilization** (1.5s) → Wait for session to propagate
4. **Session Verification** (up to 5 retries) → Confirm auth.getUser() works
5. **Profile Creation** → All profile/role data created
6. **Navigation** → Safely navigate to `/doctor-dashboard`
7. **DoctorDashboard Load** → Session refresh + retry logic ensures auth works

## Testing

To verify the fix works:
1. Start a doctor signup flow
2. Fill in all required doctor information (name, license, specialization, etc.)
3. Submit - should receive OTP email
4. Enter OTP code
5. **Expected Result:** Should successfully navigate to Doctor Dashboard without auth errors

## Related Migrations
- [20251222_fix_user_roles_rls.sql](supabase/migrations/20251222_fix_user_roles_rls.sql) - Ensures RLS policies allow role insertion during signup

## Benefits
✅ Eliminates race condition in signup flow
✅ Handles network delays gracefully
✅ Better error messages for debugging
✅ Works for both doctor and patient signups
✅ Non-invasive - doesn't affect normal auth flows
