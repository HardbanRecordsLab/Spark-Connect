import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageCircle } from 'lucide-react';

type MapUser = { name: string; age: number; dist: string; mood: string; img: number; top: string; left: string; ver: boolean };
const MAP_USERS: MapUser[] = [];

const MOODS = ['Wszyscy', '🔥 Szukam dziś', '☕ Randka', '💬 Rozmowa', '✦ Zweryfikowani'];
const HOT_ZONES: { name: string; count: number; dist: string; pct: number; color: string }[] = [];

interface MapPageProps {
  onOpenChat: (name: string) => void;
  onSafety: () => void;
}

export default function MapPage({ onOpenChat, onSafety }: MapPageProps) {
  const [activeMood, setActiveMood] = useState('Wszyscy');
  const [vibeOn, setVibeOn] = useState(false);
  const [tooltip, setTooltip] = useState<MapUser | null>(null);

  const visible = activeMood === 'Wszyscy'
    ? MAP_USERS
    : activeMood === '✦ Zweryfikowani'
    ? MAP_USERS.filter(u => u.ver)
    : MAP_USERS.filter(u => u.mood === activeMood);

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      {/* Vibe Tonight */}
      <div className="mx-5 mt-4 mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
        style={{ background: 'linear-gradient(135deg,rgba(212,96,122,.1),rgba(180,80,100,.06))', border: '1px solid rgba(212,96,122,.22)' }}
        onClick={() => setVibeOn(v => !v)}>
        <span className="text-2xl">🌙</span>
        <div className="flex-1">
          <div className="font-semibold text-sm text-primary">Vibe Tonight</div>
          <div className="text-xs text-muted-foreground">Pokaż się jako dostępna/y dziś wieczór</div>
        </div>
        <button className={`w-10 h-6 rounded-full relative transition-all ${vibeOn ? 'bg-primary' : 'bg-secondary'}`}
          onClick={e => { e.stopPropagation(); setVibeOn(v => !v); }}>
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${vibeOn ? 'left-5' : 'left-1'}`} />
        </button>
      </div>

      {/* Mood filter */}
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

      {/* Map */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 300, background: '#0d1520', border: '1px solid rgba(255,255,255,.1)' }}>
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(91,141,240,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(91,141,240,.06) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Me */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-3.5 h-3.5 rounded-full border-3 border-white shadow-lg" style={{ background: '#c9a84c', boxShadow: '0 0 0 6px rgba(201,168,76,.15), 0 0 0 12px rgba(201,168,76,.07)', borderWidth: 3 }} />
        </div>
        {/* Users */}
        <AnimatePresence>
          {visible.map(u => (
            <motion.div key={u.name}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              className="absolute cursor-pointer z-20"
              style={{ top: u.top, left: u.left, transform: 'translate(-50%,-50%)' }}
              onClick={() => setTooltip(tooltip?.name === u.name ? null : u)}>
              <img src={`https://i.pravatar.cc/36?img=${u.img}`} alt={u.name}
                className="w-9 h-9 rounded-full object-cover block mx-auto"
                style={{ border: `2px solid ${u.ver ? '#c9a84c' : '#d4607a'}` }} />
              <div className="text-center" style={{ fontSize: 9, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                {u.name}{u.ver ? ' ✦' : ''}
              </div>
              <div className="text-center" style={{ fontSize: 8, color: '#c9a84c', fontWeight: 600 }}>{u.dist}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Stats */}
        <div className="absolute top-3 left-3 rounded-xl px-3 py-2" style={{ background: 'rgba(10,10,15,.85)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}>
          <div className="font-bold text-lg leading-none" style={{ fontFamily: 'serif', color: '#c9a84c' }}>{visible.length}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,.4)', fontSize: 9 }}>aktywnych w pobliżu</div>
        </div>
        {visible.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center z-10">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>Jeszcze nikt aktywny w Twojej okolicy — budujemy społeczność od zera, bez botów.</p>
          </div>
        )}
        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-30 rounded-xl p-3"
              style={{ bottom: 12, left: '50%', transform: 'translateX(-50%)', minWidth: 160, background: 'rgba(10,10,15,.96)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-2">
                <img src={`https://i.pravatar.cc/36?img=${tooltip.img}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm">{tooltip.name}, {tooltip.age}</div>
                  <div className="text-xs text-muted-foreground">{tooltip.mood}</div>
                </div>
              </div>
              <div className="text-xs font-semibold mb-2" style={{ color: '#c9a84c' }}>📍 {tooltip.dist} od Ciebie</div>
              <button onClick={() => { onOpenChat(tooltip.name); setTooltip(null); }}
                className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 gradient-fire text-primary-foreground">
                <MessageCircle className="w-3 h-3" /> Napisz
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safety */}
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

      {/* Hot zones */}
      {HOT_ZONES.length > 0 && (
      <div className="px-5 mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Najaktywniejsze strefy</div>
        <div className="space-y-2">
          {HOT_ZONES.map(z => (
            <div key={z.name} className="flex items-center gap-3 p-3 rounded-xl glass">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(201,168,76,.1)' }}>
                {z.name === 'Śródmieście' ? '☕' : z.name === 'Praga' ? '🎵' : '🌿'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{z.name}</div>
                <div className="text-xs text-muted-foreground">{z.count} aktywnych · {z.dist}</div>
              </div>
              <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: z.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
