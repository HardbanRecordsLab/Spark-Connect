import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Full profile shape matching the DB schema
export interface Profile {
  // identity
  id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  photos: string[] | null;
  // appearance
  height: number | null;
  body_type: string | null;
  eye_color: string | null;
  hair_color: string | null;
  tattoos: string | null;
  piercing: string | null;
  // lifestyle
  smoking: string | null;
  drinking: string | null;
  diet: string | null;
  activity_level: string | null;
  day_rhythm: string | null;
  pets: string | null;
  housing: string | null;
  education: string | null;
  occupation: string | null;
  mbti: string | null;
  zodiac: string | null;
  personality_tags: string[] | null;
  personality_text: string | null;
  religion: string | null;
  politics: string | null;
  values_tags: string[] | null;
  dealbreakers: string | null;
  // passions
  passions_art: string[] | null;
  passions_sport: string[] | null;
  passions_travel: string[] | null;
  passions_food: string[] | null;
  passions_tech: string[] | null;
  passions_text: string | null;
  interests: string[] | null;
  // intentions
  intentions: string[] | null;
  children_preference: string | null;
  marriage_plans: string | null;
  relocation_readiness: string | null;
  relationship_style: string | null;
  communication_style: string[] | null;
  relationship_goal: string | null;
  // orientation
  orientation: string | null;
  gender_identity: string | null;
  pronouns: string | null;
  attracted_to: string[] | null;
  open_relationship: string | null;
  disclosure_level: string | null;
  // intimate 18+
  intimate_style: string[] | null;
  role_play_prefs: string[] | null;
  bdsm_prefs: string[] | null;
  exhib_prefs: string[] | null;
  group_prefs: string[] | null;
  other_prefs_18: string[] | null;
  sex_description: string | null;
  sexual_preferences: string[] | null;
  safe_sex: string | null;
  likes_list: string[] | null;
  dislikes_list: string[] | null;
  // looking for
  target_age_min: number | null;
  target_age_max: number | null;
  target_gender: string[] | null;
  target_location: string | null;
  looking_for: string[] | null;
  personality_match: string[] | null;
  dealbreakers_partner: string | null;
  // privacy
  profile_visibility: string | null;
  show_age: boolean | null;
  show_city: boolean | null;
  show_intimate: boolean | null;
  allow_messages: string | null;
  incognito_mode: boolean | null;
  // stats & social
  mood: string | null;
  mood_status: string | null;
  face_verified: boolean | null;
  is_verified: boolean | null;
  donor_badge: boolean | null;
  coin_balance: number | null;
  profile_views: number | null;
  total_likes: number | null;
  matches_count: number | null;
  last_online_at: string | null;
  profile_complete: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // legacy compat
  relationship_type?: string | null;
  likes?: string[] | null;
  dislikes?: string[] | null;
}

const db = supabase as any;

export function useProfile(userOrId?: User | string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const getId = () => {
    if (!userOrId) return null;
    if (typeof userOrId === 'string') return userOrId;
    return (userOrId as User).id;
  };

  const fetchProfile = useCallback(async () => {
    const id = getId();
    if (!id) { setProfile(null); return; }
    setLoading(true);
    try {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) setProfile(data as Profile);
    } catch (e) {
      console.warn('useProfile fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [typeof userOrId === 'string' ? userOrId : (userOrId as User)?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const id = getId();
    if (!id) return { data: null, error: new Error('Not authenticated') };
    try {
      const { data, error } = await db
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        setProfile(data as Profile);
        return { data, error: null };
      }
      return { data: null, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  // Quick field save helper
  const saveField = async (field: keyof Profile, value: any) => {
    return updateProfile({ [field]: value } as Partial<Profile>);
  };

  return { profile, loading, updateProfile, saveField, refetch: fetchProfile };
}
