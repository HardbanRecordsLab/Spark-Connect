import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserSettings {
  // Notifications
  notif_matches: boolean;
  notif_messages: boolean;
  notif_likes: boolean;
  notif_stories: boolean;
  notif_live: boolean;
  notif_promotions: boolean;
  // Privacy
  show_last_seen: boolean;
  show_online: boolean;
  show_distance: boolean;
  read_receipts: boolean;
  invisible_mode: boolean;
  hide_from_search: boolean;
  blur_for_unverified: boolean;
  secured_mode: boolean;
}

const DEFAULTS: UserSettings = {
  notif_matches: true,
  notif_messages: true,
  notif_likes: true,
  notif_stories: false,
  notif_live: false,
  notif_promotions: false,
  show_last_seen: true,
  show_online: true,
  show_distance: true,
  read_receipts: true,
  invisible_mode: false,
  hide_from_search: false,
  blur_for_unverified: false,
  secured_mode: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useUserSettings(user: User | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from Supabase on mount
  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await db
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        // Merge with defaults so new fields always have values
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch { /* table may not exist yet — use defaults */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Update a single setting and persist to Supabase
  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (!user) return;
    setSaving(true);
    try {
      await db.from('user_settings').upsert(
        { user_id: user.id, [key]: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch { /* silently fail — local state still updated */ }
    setSaving(false);
  }, [user]);

  // Batch update
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    if (!user) return;
    setSaving(true);
    try {
      await db.from('user_settings').upsert(
        { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch { /* silently fail */ }
    setSaving(false);
  }, [user]);

  return { settings, loading, saving, updateSetting, updateSettings };
}
