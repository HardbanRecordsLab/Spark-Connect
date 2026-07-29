// @ts-ignore
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/store/appStore';

const PAGE_SIZE = 10;
const PREFETCH_THRESHOLD = 3; // fetch next page when this many cards remain

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Calculates distance between two points using Haversine formula
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

function mapRow(p: Record<string, unknown>, myLocation?: { lat: number; lng: number }): Profile {
  const photos = ((p.photos as string[] | null) ?? []).filter(ph => !ph.startsWith('video:'));
  
  // Calculate distance if coordinates are available
  let distance: number | null = null;
  if (myLocation && typeof p.lat === 'number' && typeof p.lng === 'number') {
    distance = getDistance(myLocation.lat, myLocation.lng, p.lat, p.lng);
  }

  return {
    id: p.id as string,
    displayName: (p.display_name as string) || 'User',
    age: (p.age as number) ?? 25,
    city: (p.city as string) ?? '',
    bio: (p.bio as string) ?? '',
    photos: photos.length > 0 ? photos : [(p.avatar_url as string) ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'],
    interests: (p.interests as string[]) ?? [],
    relationshipType: (p.relationship_type as string) ?? 'both',
    moodStatus: (p.mood_status as string) || 'Just chatting',
    distance,
    isVerified: (p.is_verified as boolean) ?? false,
    donorBadge: (p.donor_badge as boolean) ?? (p.is_donor as boolean) ?? false,
    chemistryScore: (p.chemistry_score as number) ?? Math.floor(Math.random() * 30) + 70,
    gender: (p.gender as string) ?? '',
    orientation: (p.orientation as string) ?? '',
    // Enhanced attributes
    height: (p.height as number) ?? undefined,
    bodyType: (p.body_type as string) ?? undefined,
    eyeColor: (p.eye_color as string) ?? undefined,
    hairColor: (p.hair_color as string) ?? undefined,
    smoking: (p.smoking as string) ?? undefined,
    drinking: (p.drinking as string) ?? undefined,
    children: (p.children as string) ?? undefined,
    education: (p.education as string) ?? undefined,
    occupation: (p.occupation as string) ?? undefined,
    languages: (p.languages as string[]) ?? undefined,
    lookingFor: (p.looking_for as string[]) ?? undefined,
    lastOnlineAt: (p.last_online_at as string) ?? undefined,
    profileViews: (p.profile_views as number) ?? 0,
    totalLikes: (p.total_likes as number) ?? 0,
    breastSize: (p.breast_size as string) ?? undefined,
    pubicHair: (p.pubic_hair as string) ?? undefined,
    sexualRole: (p.sexual_role as string) ?? undefined,
    safeSex: (p.safe_sex as string) ?? undefined,
    likes: (p.likes as string[]) ?? undefined,
    dislikes: (p.dislikes as string[]) ?? undefined,
    relationshipGoal: (p.relationship_goal as string) ?? undefined,
    lookingForGender: (p.looking_for_gender as string) ?? undefined,
    lifestyle18: (p.lifestyle_18 as string) ?? undefined,
    tattoos: (p.tattoos as string) ?? undefined,
    piercing: (p.piercing as string) ?? undefined,
  };
}

export function useDiscoverProfiles(userId: string | null) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Cursor: last fetched profile ID for stable pagination
  const cursorRef = useRef<string | null>(null);
  const swipedIdsRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef(false);
  const myLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Load already-swiped IDs once
  const loadSwipedIds = useCallback(async () => {
    if (!userId) return;
    const { data } = await db.from('swipes').select('swiped_id').eq('swiper_id', userId);
    swipedIdsRef.current = new Set((data ?? []).map((r: { swiped_id: string }) => r.swiped_id));
  }, [userId]);

  const recordSwipe = useCallback((swipedId: string) => {
    swipedIdsRef.current.add(swipedId);
  }, []);

  const fetchPage = useCallback(async (reset = false) => {
    if (!userId || fetchingRef.current || (!reset && !hasMore)) return;
    fetchingRef.current = true;
    if (reset) {
      setLoading(true);
      cursorRef.current = null;
    }

    try {
      const excludeIds = [userId, ...Array.from(swipedIdsRef.current)];

      // Get user location for spatial query and distance calculation
      if (!myLocationRef.current) {
        const { data: myProfile } = await db
          .from('profiles').select('lat,lng').eq('id', userId).maybeSingle();
        if (myProfile?.lat && myProfile?.lng) {
          myLocationRef.current = { lat: myProfile.lat, lng: myProfile.lng };
        }
      }

      let rows: any[] | null = null;

      // 1. Try PostGIS spatial query first
      if (myLocationRef.current) {
        const { data: geoData, error: geoErr } = await db.rpc('profiles_near_point', {
          ref_lat: myLocationRef.current.lat,
          ref_lng: myLocationRef.current.lng,
          radius_m: 100000, // 100km default
          exclude_ids: excludeIds,
        });
        
        if (!geoErr && geoData) {
          rows = (geoData as any[]).slice(0, PAGE_SIZE);
        }
      }

      // 2. Fallback: standard query without distance if geo results are exhausted.
      // Explicit column whitelist — NOT select('*') — so internal/admin-only
      // columns (bot_score, coin_balance, admin_rejected, rejection_reason,
      // is_bot_blocked, raw lat/lng, ...) never reach other users' clients.
      if (!rows || rows.length === 0) {
        let query = db
          .from('profiles')
          .select(`id, display_name, age, city, bio, photos, avatar_url, interests,
            relationship_type, mood_status, is_verified, donor_badge, chemistry_score,
            gender, orientation, height, body_type, eye_color, hair_color, smoking,
            drinking, children, education, occupation, languages, looking_for,
            last_online_at, profile_views, total_likes, breast_size, pubic_hair,
            sexual_role, safe_sex, likes, dislikes, relationship_goal,
            looking_for_gender, lifestyle_18, tattoos, piercing, created_at`)
          .eq('profile_complete', true)
          .eq('admin_approved', true)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        if (!reset && cursorRef.current) {
          query = query.lt('created_at', cursorRef.current);
        }

        const { data: fallbackRows, error } = await query;
        if (error) throw error;
        rows = fallbackRows ?? [];
      }

      if (!rows || rows.length === 0) {
        setHasMore(false);
        return;
      }

      const mapped = rows.map(r => mapRow(r, myLocationRef.current || undefined));
      setProfiles((prev: Profile[]) => reset ? mapped : [...prev, ...mapped]);

      // Update cursor for pagination (only for fallback query)
      const lastRow = rows[rows.length - 1] as { created_at?: string };
      cursorRef.current = lastRow.created_at ?? null;
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchPage error:', err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [userId, hasMore]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    swipedIdsRef.current = new Set();
    myLocationRef.current = null;
    setHasMore(true);
    loadSwipedIds().then(() => fetchPage(true));
  }, [userId]);

  // Called by DiscoverPage when cardIndex nears the end
  const fetchMoreIfNeeded = useCallback((remainingCards: number) => {
    if (remainingCards <= PREFETCH_THRESHOLD && hasMore && !fetchingRef.current) {
      fetchPage(false);
    }
  }, [fetchPage, hasMore]);

  const refetch = useCallback(() => {
    swipedIdsRef.current = new Set();
    setHasMore(true);
    loadSwipedIds().then(() => fetchPage(true));
  }, [loadSwipedIds, fetchPage]);

  return { profiles, loading, hasMore, refetch, fetchMoreIfNeeded, recordSwipe };
}
