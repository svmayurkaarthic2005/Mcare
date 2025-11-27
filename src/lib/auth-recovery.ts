/**
 * Authentication Recovery Utility
 * Handles authentication state recovery and session management
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Setup authentication recovery mechanisms
 * Monitors and recovers from auth failures
 */
export function setupAuthRecovery() {
  console.log('[AuthRecovery] Setting up authentication recovery...');

  // Subscribe to auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('[AuthRecovery] Auth event:', event);

      if (event === 'SIGNED_OUT') {
        // Clear any stored auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }

      if (event === 'TOKEN_REFRESHED') {
        if (!session) {
          // Token refresh failed
          console.warn('[AuthRecovery] Token refresh failed, signing out...');
          await supabase.auth.signOut();
        } else {
          console.log('[AuthRecovery] Token refreshed successfully');
        }
      }

      if (event === 'SIGNED_IN' && session) {
        // Successfully signed in
        console.log('[AuthRecovery] User signed in successfully');
      }
    }
  );

  // Setup periodic session validation (every 5 minutes)
  const validationInterval = setInterval(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthRecovery] Session validation error:', error);
        return;
      }

      if (!session) {
        console.log('[AuthRecovery] No active session found');
        return;
      }

      // Check if refresh token exists
      if (!session.refresh_token) {
        console.warn('[AuthRecovery] Refresh token missing, signing out...');
        await supabase.auth.signOut();
        return;
      }

      // Verify user still exists
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.warn('[AuthRecovery] User verification error:', userError);
        
        // Try to recover with refresh
        const recovered = await recoverSession();
        if (!recovered) {
          await supabase.auth.signOut();
        }
        return;
      }

      if (!user) {
        console.warn('[AuthRecovery] User not found, clearing session');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('[AuthRecovery] Validation error:', error);
    }
  }, 5 * 60 * 1000); // Run every 5 minutes

  // Return cleanup function
  return () => {
    subscription?.unsubscribe();
    clearInterval(validationInterval);
  };
}

/**
 * Attempt to recover an invalid session
 */
export async function recoverSession(): Promise<boolean> {
  try {
    console.log('[AuthRecovery] Attempting to recover session...');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[AuthRecovery] Failed to get session:', sessionError);
      await supabase.auth.signOut();
      return false;
    }

    if (!session) {
      console.log('[AuthRecovery] No active session to recover');
      return false;
    }

    // Check if refresh token exists
    if (!session.refresh_token) {
      console.warn('[AuthRecovery] Refresh token missing, signing out...');
      await supabase.auth.signOut();
      return false;
    }

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[AuthRecovery] Session refresh failed:', error.message);
      
      // If refresh token error, clear session
      if (error.message?.includes('Refresh Token') || error.message?.includes('Not Found')) {
        console.log('[AuthRecovery] Refresh token invalid, clearing session...');
        await supabase.auth.signOut();
      }
      return false;
    }

    if (!data.session) {
      console.error('[AuthRecovery] Session refresh returned no session');
      await supabase.auth.signOut();
      return false;
    }

    console.log('[AuthRecovery] Session recovered successfully');
    return true;
  } catch (error) {
    console.error('[AuthRecovery] Unexpected error during recovery:', error);
    await supabase.auth.signOut();
    return false;
  }
}

/**
 * Verify authentication is working
 */
export async function verifyAuth(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[AuthRecovery] Auth verification failed:', error.message);
      
      // If refresh token error, attempt recovery
      if (error.message?.includes('Refresh Token') || error.message?.includes('Not Found')) {
        console.log('[AuthRecovery] Refresh token error detected, attempting recovery...');
        const recovered = await recoverSession();
        return recovered;
      }
      
      return false;
    }

    if (!user) {
      console.log('[AuthRecovery] No authenticated user');
      return false;
    }

    console.log('[AuthRecovery] Auth verification successful, user:', user.id);
    return true;
  } catch (error) {
    console.error('[AuthRecovery] Unexpected error verifying auth:', error);
    return false;
  }
}

/**
 * Force sign out and cleanup
 */
export async function forceSignOut(): Promise<void> {
  try {
    console.log('[AuthRecovery] Force signing out...');
    
    // Clear all auth-related storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('supabase.auth.token');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    console.log('[AuthRecovery] Sign out completed');
  } catch (error) {
    console.error('[AuthRecovery] Error during sign out:', error);
  }
}
