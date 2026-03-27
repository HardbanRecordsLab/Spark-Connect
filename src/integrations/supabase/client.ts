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
      storageKey: 'spark-connect-auth',
      // Disable locking to prevent lock conflicts in React Strict Mode
      lock: false as boolean | undefined,
      // Add timeout to prevent hanging locks
      db: {
        save: (data: unknown) => {
          // Custom save with timeout to prevent lock issues
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              try {
                localStorage.setItem('spark-connect-auth', JSON.stringify(data));
                resolve();
              } catch (error) {
                console.warn('Failed to save auth data:', error);
                resolve();
              }
            }, 100);
          });
        },
        load: () => {
          try {
            const item = localStorage.getItem('spark-connect-auth');
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.warn('Failed to load auth data:', error);
            return null;
          }
        },
        remove: () => {
          try {
            localStorage.removeItem('spark-connect-auth');
          } catch (error) {
            console.warn('Failed to remove auth data:', error);
          }
        }
      }
    },
  }
);

console.log('⚡ Supabase client initialized');
