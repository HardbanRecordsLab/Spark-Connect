// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '❌ Missing Supabase env vars. Create a .env file with:\n' +
    'VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'spark-connect-auth-token',
    // Disable multi-tab locking to prevent "auth-token was released because another request stole it"
    storage: window.localStorage,
    lockType: 'custom',
  },
});
