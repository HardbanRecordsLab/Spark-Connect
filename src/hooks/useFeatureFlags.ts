import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await db.from('app_feature_flags').select('key, enabled');
    setFlags(Object.fromEntries((data ?? []).map((r: { key: string; enabled: boolean }) => [r.key, r.enabled])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setFlag = useCallback(async (key: string, enabled: boolean) => {
    const prev = flags[key];
    setFlags(f => ({ ...f, [key]: enabled }));
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await db.from('app_feature_flags')
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('key', key);
    if (error) setFlags(f => ({ ...f, [key]: prev }));
    return { error };
  }, [flags]);

  return { flags, loading, setFlag, refetch: load };
}
