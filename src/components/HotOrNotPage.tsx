import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { useDiscoverProfiles } from '@/hooks/useDiscoverProfiles';
import { triggerPush } from '@/hooks/useConversations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function HotOrNotPage() {
  const { user } = useAuth();
  const { triggerMatch } = useAppStore();
  const { profiles, loading, fetchMoreIfNeeded, recordSwipe } = useDiscoverProfiles(user?.id ?? null);
  const [idx, setIdx] = useState(0);
  const [vote, setVote] = useState<'hot' | 'not' | null>(null);
  const [ratedToday, setRatedToday] = useState<number | null>(null);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    db.from('swipes').select('id', { count: 'exact', head: true })
      .eq('swiper_id', user.id).gte('created_at', new Date().toISOString().slice(0, 10))
      .then(({ count }: { count: number | null }) => setRatedToday(count ?? 0));
  }, [user?.id]);

  const profile = profiles[idx];

  async function doVote(v: 'hot' | 'not') {
    if (!profile || voting) return;
    setVoting(true);
    setVote(v);
    setExiting(true);

    const { data } = await db.rpc('record_swipe', {
      p_swiped_id: profile.id,
      p_direction: v === 'hot' ? 'right' : 'left',
    });
    recordSwipe(profile.id);
    setRatedToday(c => (c ?? 0) + 1);
    setSessionStreak(s => v === 'hot' ? s + 1 : 0);

    const result = Array.isArray(data) ? data[0] : data;
    if (result?.matched) {
      triggerMatch(profile);
      triggerPush(profile.id, 'Nowe dopasowanie 🔥', 'Masz nowe dopasowanie! Napisz pierwszy/a.', '/');
    }

    setTimeout(() => {
      setIdx(i => i + 1);
      fetchMoreIfNeeded(profiles.length - idx - 1);
      setVote(null);
      setExiting(false);
      setVoting(false);
    }, 300);
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'serif' }}>Hot or Not</h1>
        <div className="text-sm font-semibold" style={{ color: '#c9a84c' }}>
          🔥 <span>{sessionStreak}</span> z rzędu
        </div>
      </div>

      {loading && profiles.length === 0 ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !profile ? (
        <div className="text-center py-24 px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold mb-2">To wszystkie profile w Twojej okolicy</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Wróć później, gdy dołączy więcej osób — budujemy społeczność od zera, bez botów.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-4" style={{ aspectRatio: '3/4' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: exiting ? 0 : 1,
                  scale: exiting ? 0.9 : 1,
                  x: exiting ? (vote === 'hot' ? 80 : -80) : 0,
                  rotate: exiting ? (vote === 'hot' ? 8 : -8) : 0,
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-2xl overflow-hidden bg-secondary"
              >
                <img src={profile.photos[0]} alt={profile.displayName} className="w-full h-full object-cover" />
                {profile.isVerified && (
                  <div className="absolute top-3 right-3 glass-strong px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-white">Zweryfikowana</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg">{profile.displayName}, {profile.age}</span>
                  </div>
                  {profile.city && (
                    <div className="text-white/70 text-sm">📍 {profile.distance != null ? `${profile.distance} km` : profile.city}</div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-6 py-6">
            <button
              onClick={() => doVote('not')}
              disabled={voting}
              className="w-16 h-16 rounded-full glass border border-border flex items-center justify-center text-2xl disabled:opacity-50"
            >
              ❄️
            </button>
            <button
              onClick={() => doVote('hot')}
              disabled={voting}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl gradient-fire disabled:opacity-50"
            >
              🔥
            </button>
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-1.5 pb-6 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5" />
        Oceniono dziś: <span style={{ color: '#c9a84c', fontWeight: 600 }}>{ratedToday ?? '—'}</span>
      </div>
    </div>
  );
}
