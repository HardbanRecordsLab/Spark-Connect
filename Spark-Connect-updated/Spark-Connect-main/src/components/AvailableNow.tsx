import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const AVAILABLE_DURATION_MINUTES = 180; // 3 hours

// ── Hook: manage own availability ─────────────────────────────
export function useAvailability(userId: string | null) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  const loadStatus = useCallback(async () => {
    if (!userId) return;
    const { data } = await db
      .from('availability')
      .select('expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (data) {
      setIsAvailable(true);
      setExpiresAt(new Date(data.expires_at));
    } else {
      setIsAvailable(false);
      setExpiresAt(null);
    }
  }, [userId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = expiresAt.getTime() - Date.now();
      if (ms <= 0) { setIsAvailable(false); setExpiresAt(null); setTimeLeft(''); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m} min`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const setAvailable = async (available: boolean) => {
    if (!userId) return;
    if (available) {
      const expires = new Date(Date.now() + AVAILABLE_DURATION_MINUTES * 60000);
      await db.from('availability').upsert({ user_id: userId, expires_at: expires.toISOString() }, { onConflict: 'user_id' });
      setIsAvailable(true);
      setExpiresAt(expires);
    } else {
      await db.from('availability').delete().eq('user_id', userId);
      setIsAvailable(false);
      setExpiresAt(null);
      setTimeLeft('');
    }
  };

  return { isAvailable, timeLeft, setAvailable };
}

// ── AvailableNowToggle — shown in ProfilePage ──────────────────
export function AvailableNowToggle() {
  const { user } = useAuth();
  const { isAvailable, timeLeft, setAvailable } = useAvailability(user?.id ?? null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    await setAvailable(!isAvailable);
    setLoading(false);
  };

  return (
    <motion.div
      animate={isAvailable ? { boxShadow: ['0 0 0 0 rgba(255,26,78,0)', '0 0 0 8px rgba(255,26,78,0.15)', '0 0 0 0 rgba(255,26,78,0)'] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`glass rounded-2xl p-4 border transition-all ${isAvailable ? 'border-primary/40' : 'border-border'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAvailable ? 'gradient-fire' : 'bg-secondary'}`}>
            <Zap className={`w-5 h-5 ${isAvailable ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">
                {isAvailable ? 'Dostępny/a TERAZ 🟢' : 'Tryb spontaniczny'}
              </p>
              {isAvailable && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-green-500"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAvailable
                ? `Widoczny/a jako dostępny/a przez ${timeLeft}`
                : 'Pokaż że szukasz kogoś dziś wieczór'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-all ${isAvailable ? 'bg-primary' : 'bg-secondary'}`}
        >
          <motion.div
            animate={{ x: isAvailable ? 24 : 2 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full shadow"
          />
        </button>
      </div>

      <AnimatePresence>
        {isAvailable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground flex-1">
                Twój profil pojawi się w sekcji "Dostępni teraz". Wygasa automatycznie.
              </p>
              <button onClick={() => setAvailable(false)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Wyłącz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── AvailableNowSection — shown in DiscoverPage ────────────────
interface AvailableNowSectionProps {
  onSelectProfile: (profileId: string) => void;
}

export function AvailableNowSection({ onSelectProfile }: AvailableNowSectionProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<{ id: string; displayName: string; age: number; photo: string; city: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadAvailable();
    // Refresh every 2 minutes
    const t = setInterval(loadAvailable, 120000);
    return () => clearInterval(t);
  }, [user]);

  const loadAvailable = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await db
      .from('availability')
      .select('user_id, profiles!user_id(id, display_name, age, avatar_url, photos, city)')
      .gt('expires_at', now)
      .neq('user_id', user.id)
      .limit(10);

    if (!data) return;
    setProfiles(data.map((row: {user_id: string; profiles: {id: string; display_name: string; age: number; avatar_url: string; photos: string[]; city: string}}) => {
      const p = row.profiles;
      const photos = (p.photos ?? []).filter((ph: string) => !ph.startsWith('video:'));
      return {
        id: p.id,
        displayName: p.display_name || 'User',
        age: p.age ?? 25,
        photo: photos[0] ?? p.avatar_url ?? '',
        city: p.city ?? '',
      };
    }));
  };

  if (profiles.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-2.5 h-2.5 rounded-full bg-green-500"
        />
        <p className="text-sm font-semibold">Dostępni teraz</p>
        <span className="text-xs text-muted-foreground">({profiles.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hidden">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectProfile(p.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500/60">
                <img src={p.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background"
              />
            </div>
            <p className="text-xs font-medium">{p.displayName.split(' ')[0]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
