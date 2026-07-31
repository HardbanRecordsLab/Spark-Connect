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
      // The `lock` option must be a real LockFunc, not a boolean --
      // passing `false` here (an earlier attempt to sidestep a lock
      // conflict seen under React StrictMode in dev) broke session
      // restoration in production: reloading the page while logged in
      // hung forever on the loading spinner, silently, no console
      // error, because GoTrueClient's session-init path awaits this
      // as a function. StrictMode's double-effect-invocation is a
      // dev-only behavior anyway, so production never needed a
      // workaround here. This no-op lock (run the callback
      // immediately, no real serialization) keeps the type contract
      // correct while still sidestepping the Navigator LockManager
      // path that caused the original StrictMode issue.
      lock: async <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
  }
);
