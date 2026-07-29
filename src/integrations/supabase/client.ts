import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
      // Musi być stała wartość — losowy klucz przy każdym załadowaniu modułu
      // sprawiał, że sesja zapisana pod poprzednim kluczem stawała się
      // nieosiągalna i użytkownik był wylogowywany przy każdym odświeżeniu.
      storageKey: 'spark-connect-auth',
      // Disable locking to prevent lock conflicts in React Strict Mode
      lock: false as boolean | undefined,
    },
  }
);
