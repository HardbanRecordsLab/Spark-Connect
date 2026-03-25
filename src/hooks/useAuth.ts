import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    async function checkAdmin(userId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data } = await db
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    }

    // Set up auth listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let isAdmin = false;
      if (session?.user) {
        isAdmin = await checkAdmin(session.user.id);
        // Fallback for hardcoded admin emails
        const ADMIN_EMAILS = ['hardbanrecordslab.pl@gmail.com', 'spark-connect@hardbanrecordslab.online'];
        if (!isAdmin && session.user.email && ADMIN_EMAILS.includes(session.user.email)) {
          isAdmin = true;
        }
      }
      setState({ user: session?.user ?? null, session, loading: false, isAdmin });
    });

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let isAdmin = false;
      if (session?.user) {
        isAdmin = await checkAdmin(session.user.id);
        const ADMIN_EMAILS = ['hardbanrecordslab.pl@gmail.com', 'spark-connect@hardbanrecordslab.online'];
        if (!isAdmin && session.user.email && ADMIN_EMAILS.includes(session.user.email)) {
          isAdmin = true;
        }
      }
      setState({ user: session?.user ?? null, session, loading: false, isAdmin });
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
