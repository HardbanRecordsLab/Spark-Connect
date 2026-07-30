import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

// Keeps profiles.last_online_at fresh while the user has the app open,
// so "online" badges and the public online-count are based on real
// activity instead of the row-creation timestamp.
export function usePresenceHeartbeat(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;

    const beat = () => { supabase.rpc('heartbeat_presence').then(() => {}); };
    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    const onVisible = () => { if (document.visibilityState === 'visible') beat(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);
}
