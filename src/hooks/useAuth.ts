import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminRole: 'admin' | 'moderator' | 'support' | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    adminRole: null,
  });

  useEffect(() => {
    async function checkAdminStatus(session: Session | null) {
      if (!session?.user) {
        return { isAdmin: false, adminRole: null };
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          return { isAdmin: false, adminRole: null };
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-admin`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${currentSession.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error('Admin check failed:', response.status);
          return { isAdmin: false, adminRole: null };
        }

        const data = await response.json();
        return {
          isAdmin: data.isAdmin || false,
          adminRole: data.role || null,
        };
      } catch (err) {
        console.error('Admin check failed:', err);
        return { isAdmin: false, adminRole: null };
      }
    }

    // Set up auth listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const { isAdmin, adminRole } = await checkAdminStatus(session);
      setState({ user: session?.user ?? null, session, loading: false, isAdmin, adminRole });
    });

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const { isAdmin, adminRole } = await checkAdminStatus(session);
      setState({ user: session?.user ?? null, session, loading: false, isAdmin, adminRole });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signInWithApple() {
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}
