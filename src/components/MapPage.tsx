import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoverProfiles } from '@/hooks/useDiscoverProfiles';
import { useAvailability } from './AvailableNow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Profile } from '@/store/appStore';
import { useAppStore } from '@/store/appStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const MOODS = ['Wszyscy', '✦ Zweryfikowani'];

// Deterministic pseudo-random angle from a profile id so pins don't
// jump around on re-render, but never reveal a real bearing -- only
// real distance is shown, angle is decorative/privacy-preserving
// (same tradeoff real dating-app radar views make).
function angleFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 360) * (Math.PI / 180);
}

interface MapPageProps {
  onOpenChat: (name: string) => void;
  onSafety: () => void;
}

export default function MapPage({ onSafety }: MapPageProps) {
  const { user } = useAuth();
  const { triggerMatch } = useAppStore();
  const { profiles, loading } = useDiscoverProfiles(user?.id ?? null);
  const { isAvailable, setAvailable } = useAvailability(user?.id ?? null);
  const [activeMood, setActiveMood] = useState('Wszyscy');
  const [tooltip, setTooltip] = useState<Profile | null>(null);

  const nearby = useMemo(() => {
    return profiles
      .filter(p => p.distance != null)
      .filter(p => activeMood === 'Zweryfikowani' || activeMood === '✦ Zweryfikowani' ? p.isVerified : true)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 12);
  }, [profiles, activeMood]);

  const maxDist = Math.max(1, ...nearby.map(p => p.distance ?? 1));
  const positioned = nearby.map(p => {
    const angle = angleFromId(p.id);
    const r = Math.min(0.42, 0.12 + 0.3 * ((p.distance ?? 0) / maxDist));
    return { profile: p, top: `${50 - r * 100 * Math.sin(angle)}%`, left: `${50 + r * 100 * Math.cos(angle)}%` };
  });

  // Real zone aggregation from real nearby profiles' real cities --
  // no invented neighborhood activity numbers.
  const zones = useMemo(() => {
    const byCity = new Map<string, { count: number; minDist: number }>();
    for (const p of nearby) {
      if (!p.city) continue;
      const cur = byCity.get(p.city) ?? { count: 0, minDist: Infinity };
      byCity.set(p.city, { count: cur.count + 1, minDist: Math.min(cur.minDist, p.distance ?? Infinity) });
    }
    return Array.from(byCity.entries())
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [nearby]);

  const maxZoneCount = Math.max(1, ...zones.map(z => z.count));

  const handleLike = async (profile: Profile) => {
    const { data } = await db.rpc('record_swipe', { p_swiped_id: profile.id, p_direction: 'right' });
    const result = Array.isArray(data) ? data[0] : data;
    setTooltip(null);
    if (result?.matched) triggerMatch(profile);
    else toast.success(`Polubiono ${profile.displayName} 💚`);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      {/* Vibe Tonight -- real, backed by the same availability table AvailableNowToggle uses elsewhere */}
      <div className="mx-5 mt-4 mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
        style={{ background: 'linear-gradient(135deg,rgba(212,96,122,.1),rgba(180,80,100,.06))', border: '1px solid rgba(212,96,122,.22)' }}
        onClick={() => setAvailable(!isAvailable)}>
        <span className="text-2xl">🌙</span>
        <div className="flex-1">
          <div className="font-semibold text-sm text-primary">Vibe Tonight</div>
          <div className="text-xs text-muted-foreground">Pokaż się jako dostępna/y dziś wieczór</div>
        </div>
        <button className={`w-10 h-6 rounded-full relative transition-all ${isAvailable ? 'bg-primary' : 'bg-secondary'}`}
          onClick={e => { e.stopPropagation(); setAvailable(!isAvailable); }}>
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${isAvailable ? 'left-5' : 'left-1'}`} />
        </button>
      </div>

      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hidden">
        {MOODS.map(m => (
          <button key={m} onClick={() => setActiveMood(m)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeMood === m
              ? 'bg-primary/15 text-primary border border-primary/40'
              : 'glass text-muted-foreground border border-border'}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="mx-5 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 300, background: '#0d1520', border: '1px solid rgba(255,255,255,.1)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(91,141,240,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(91,141,240,.06) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-3.5 h-3.5 rounded-full border-3 border-white shadow-lg" style={{ background: '#c9a84c', boxShadow: '0 0 0 6px rgba(201,168,76,.15), 0 0 0 12px rgba(201,168,76,.07)', borderWidth: 3 }} />
        </div>
        <AnimatePresence>
          {positioned.map(({ profile: p, top, left }) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              className="absolute cursor-pointer z-20"
              style={{ top, left, transform: 'translate(-50%,-50%)' }}
              onClick={() => setTooltip(tooltip?.id === p.id ? null : p)}>
              <img src={p.photos[0]} alt={p.displayName}
                className="w-9 h-9 rounded-full object-cover block mx-auto"
                style={{ border: `2px solid ${p.isVerified ? '#c9a84c' : '#d4607a'}` }} />
              <div className="text-center" style={{ fontSize: 9, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                {p.displayName}{p.isVerified ? ' ✦' : ''}
              </div>
              <div className="text-center" style={{ fontSize: 8, color: '#c9a84c', fontWeight: 600 }}>{p.distance} km</div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="absolute top-3 left-3 rounded-xl px-3 py-2" style={{ background: 'rgba(10,10,15,.85)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}>
          <div className="font-bold text-lg leading-none" style={{ fontFamily: 'serif', color: '#c9a84c' }}>{loading ? '…' : nearby.length}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,.4)', fontSize: 9 }}>aktywnych w pobliżu</div>
        </div>
        {!loading && nearby.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center z-10">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>Jeszcze nikt aktywny w Twojej okolicy — budujemy społeczność od zera, bez botów.</p>
          </div>
        )}
        <AnimatePresence>
          {tooltip && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-30 rounded-xl p-3"
              style={{ bottom: 12, left: '50%', transform: 'translateX(-50%)', minWidth: 160, background: 'rgba(10,10,15,.96)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-2">
                <img src={tooltip.photos[0]} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm">{tooltip.displayName}, {tooltip.age}</div>
                  <div className="text-xs text-muted-foreground">{tooltip.moodStatus}</div>
                </div>
              </div>
              <div className="text-xs font-semibold mb-2" style={{ color: '#c9a84c' }}>📍 {tooltip.distance} km od Ciebie</div>
              <button onClick={() => handleLike(tooltip)}
                className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 gradient-fire text-primary-foreground">
                <MessageCircle className="w-3 h-3" /> Polub
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={onSafety}
        className="mx-5 mb-4 w-[calc(100%-40px)] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{ background: 'rgba(212,96,122,.05)', border: '1px solid rgba(212,96,122,.18)' }}>
        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <span className="text-xs font-semibold text-primary">Centrum bezpieczeństwa</span>
          <span className="text-xs text-muted-foreground"> — SOS, kontakt awaryjny, tryb ukryty</span>
        </div>
        <span className="text-primary text-lg">›</span>
      </button>

      {zones.length > 0 && (
      <div className="px-5 mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Najaktywniejsze strefy</div>
        <div className="space-y-2">
          {zones.map(z => (
            <div key={z.city} className="flex items-center gap-3 p-3 rounded-xl glass">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(201,168,76,.1)' }}>
                📍
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{z.city}</div>
                <div className="text-xs text-muted-foreground">{z.count} aktywnych · {z.minDist} km</div>
              </div>
              <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((z.count / maxZoneCount) * 100)}%`, background: 'var(--gradient-fire)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
