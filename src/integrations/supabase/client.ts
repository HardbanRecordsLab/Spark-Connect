// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;

// BUG FIX: zamiast rzucać wyjątek na poziomie modułu (co crashuje całą aplikację
// przed zamontowaniem React i uniemożliwia ErrorBoundary przechwycenie błędu),
// logujemy ostrzeżenie i tworzymy klienta z pustymi danymi — aplikacja załaduje
// się w trybie offline/demo, a błąd autentykacji pojawi się dopiero przy próbie logowania.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '❌ Brakujące zmienne środowiskowe Supabase. Dodaj do ustawień hostingu:\n' +
    'VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...'
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL  ?? 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'spark-connect-auth-token',
      // Włączamy null-locking, aby uniknąć błędów blokowania w Chrome/React Strict Mode
      lockType: 'null',
    },
  }
);

console.log('⚡ Supabase client initialized');
