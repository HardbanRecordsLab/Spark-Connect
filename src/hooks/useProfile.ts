import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  displayName: string;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  donorBadge: boolean;
  coinBalance: number;
  moodStatus: string;
  city: string;
  interests: string[];
  photos: string[];
  relationshipType: string;
  profileComplete: boolean;
  created_at: string;
  // Enhanced attributes
  height?: number;
  bodyType?: string;
  eyeColor?: string;
  hairColor?: string;
  smoking?: string;
  drinking?: string;
  children?: string;
  education?: string;
  occupation?: string;
  languages?: string[];
  lookingFor?: string[];
  lastOnlineAt?: string;
  profileViews?: number;
  totalLikes?: number;
  verificationVideoUrl?: string;
  stealthMode?: boolean;
  breastSize?: string;
  pubicHair?: string;
  sexualRole?: string;
  safeSex?: string;
  likes?: string[];
  dislikes?: string[];
  relationshipGoal?: string;
  lookingForGender?: string;
  lifestyle18?: string;
  tattoos?: string;
  piercing?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    setLoading(true);
    const { data } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    // Retry logic for failed updates
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await db
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();
        
        if (!error && data) {
          setProfile(data);
          return { data, error: null };
        }
        
        if (error) {
          if (attempt === maxRetries) {
            console.error(`Profile update failed after ${maxRetries} attempts:`, error);
            return { data: null, error };
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (err) {
        if (attempt === maxRetries) {
          console.error(`Profile update failed after ${maxRetries} attempts:`, err);
          return { data: null, error: err as Error };
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return { data: null, error: new Error('Max retries exceeded') };
  };

  const addCoins = async (amount: number) => {
    if (!user || !profile) return;
    const newBalance = Math.max(0, profile.coin_balance + amount);
    await updateProfile({ coin_balance: newBalance });
  };

  return { profile, loading, updateProfile, addCoins, refetch: fetchProfile };
}
