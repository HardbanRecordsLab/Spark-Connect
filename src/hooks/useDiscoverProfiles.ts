import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/store/appStore';

const PAGE_SIZE = 10;
const PREFETCH_THRESHOLD = 3; // fetch next page when this many cards remain

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function mapRow(p: Record<string, unknown>): Profile {
  const photos = ((p.photos as string[] | null) ?? []).filter(ph => !ph.startsWith('video:'));
  return {
    id: p.id as string,
    displayName: (p.display_name as string) || 'User',
    age: (p.age as number) ?? 25,
    city: (p.city as string) ?? '',
    bio: (p.bio as string) ?? '',
    photos: photos.length > 0 ? photos : [(p.avatar_url as string) ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'],
    interests: (p.interests as string[]) ?? [],
    relationshipType: (p.relationship_type as string) ?? 'both',
    moodStatus: (p.mood_status as string) ?? 'Just chatting',
    // distance_m comes from profiles_near_point(), else null
    distance: p.distance_m ? Math.round((p.distance_m as number) / 1000) : null,
    isVerified: (p.is_verified as boolean) ?? false,
    donorBadge: false,
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

  // Load already-swiped IDs once
  const loadSwipedIds = useCallback(async () => {
    if (!userId) return;
    const { data } = await db.from('swipes').select('swiped_id').eq('swiper_id', userId);
    swipedIdsRef.current = new Set((data ?? []).map((r: { swiped_id: string }) => r.swiped_id));
  }, [userId]);

  const fetchPage = useCallback(async (reset = false) => {
    if (!userId || fetchingRef.current || (!reset && !hasMore)) return;
    fetchingRef.current = true;
    if (reset) setLoading(true);

    try {
      const excludeIds = [userId, ...swipedIdsRef.current];
      const filterStr = excludeIds.length > 0
        ? `(${excludeIds.map(id => `"${id}"`).join(',')})`
        : `("${userId}")`;

      // Try PostGIS spatial query first (requires profiles_near_point function + user location)
      const { data: myProfile } = await db
        .from('profiles').select('lat,lng').eq('id', userId).single();

      let rows: unknown[] | null = null;

      if (myProfile?.lat && myProfile?.lng) {
        // Real distance via PostGIS RPC
        const { data: geoData, error: geoErr } = await db.rpc('profiles_near_point', {
          ref_lat: myProfile.lat,
          ref_lng: myProfile.lng,
          radius_m: 100000, // 100km default
        });
        if (!geoErr && geoData) {
          rows = (geoData as unknown[])
            .filter((p: unknown) => {
              const profile = p as { id: string };
              return !excludeIds.includes(profile.id);
            })
            .slice(0, PAGE_SIZE);
        }
      }

      // Fallback: standard query without distance
      if (!rows) {
        let query = db
          .from('profiles')
          .select('*, chemistry_score')
          .not('id', 'in', filterStr)
          .eq('profile_complete', true)
          .eq('admin_approved', true)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

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

      const mapped = rows.map(mapRow);
      setProfiles(prev => reset ? mapped : [...prev, ...mapped]);

      // Update cursor to last item's created_at for next page
      cursorRef.current = rows[rows.length - 1].created_at ?? null;
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
    cursorRef.current = null;
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
    cursorRef.current = null;
    setHasMore(true);
    loadSwipedIds().then(() => fetchPage(true));
  }, [loadSwipedIds, fetchPage]);

  return { profiles, loading, hasMore, refetch, fetchMoreIfNeeded };
}
