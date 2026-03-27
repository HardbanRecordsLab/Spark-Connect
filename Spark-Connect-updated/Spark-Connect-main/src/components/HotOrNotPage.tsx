import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

const PROFILES = [
  { img: 49, name: 'Sofia', age: 24, meta: '📍 350m · 🔥 Szukam dziś', ver: true },
  { img: 47, name: 'Mia', age: 22, meta: '📍 820m · ☕ Randka', ver: false },
  { img: 45, name: 'Natalia', age: 27, meta: '📍 1.2km · 💬 Rozmowa', ver: true },
  { img: 44, name: 'Zara', age: 23, meta: '📍 1.5km · 🔥 Szukam dziś', ver: false },
  { img: 43, name: 'Julia', age: 25, meta: '📍 2.1km · ☕ Randka', ver: true },
  { img: 41, name: 'Emma', age: 26, meta: '📍 2.8km · 💬 Rozmowa', ver: false },
  { img: 46, name: 'Karolina', age: 28, meta: '📍 3.1km · 🔥 Szukam dziś', ver: true },
];

export default function HotOrNotPage() {
  const [idx, setIdx] = useState(0);
  const [vote, setVote] = useState<'hot' | 'not' | null>(null);
  const [count, setCount] = useState(47);
  const [streak, setStreak] = useState(12);
  const [exiting, setExiting] = useState(false);

  const profile = PROFILES[idx % PROFILES.length];

  function doVote(v: 'hot' | 'not') {
    if (exiting) return;
    setVote(v);
    setExiting(true);
    setCount(c => c + 1);
    setStreak(s => v === 'hot' ? s + 1 : 0);
    setTimeout(() => {
      setIdx(i => i + 1);
      setVote(null);
      setExiting(false);
    }, 400);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'serif' }}>Hot or Not</h1>
        <div className="text-sm font-semibold" style={{ color: '#c9a84c' }}>
          🔥 <span>{streak}</span> z rzędu
        </div>
      </div>

      {/* Card */}
      <div className="mx-5 mb-4 relative flex-shrink-0" style={{ height: 400 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={vote === 'hot'
              ? { x: '120%', rotate: 12, opacity: 0 }
              : { x: '-120%', rotate: -12, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <img src={`https://i.pravatar.cc/420?img=${profile.img}`} alt={profile.name}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(5,5,12,.95) 0%,rgba(5,5,12,.3) 50%,transparent 75%)' }} />
            {/* Photo dots */}
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-0.5 rounded-full" style={{ background: i === 0 ? '#c9a84c' : 'rgba(255,255,255,.3)' }} />
              ))}
            </div>
            {/* Verified badge */}
            {profile.ver && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0a0a0f', fontSize: 10 }}>
                ✦ Zweryfikowana
              </div>
            )}
            {/* Labels */}
            {vote === 'hot' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-3xl px-6 py-2.5 rounded-xl -rotate-6"
                style={{ fontFamily: 'serif', color: '#ff6b6b', border: '3px solid #ff6b6b', background: 'rgba(255,107,107,.1)' }}>
                HOT 🔥
              </motion.div>
            )}
            {vote === 'not' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-3xl px-6 py-2.5 rounded-xl rotate-6"
                style={{ fontFamily: 'serif', color: '#7aaaf5', border: '3px solid #7aaaf5', background: 'rgba(91,141,240,.1)' }}>
                NOT ❄️
              </motion.div>
            )}
            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ fontFamily: 'serif' }}>{profile.name}</span>
                <span className="text-xl text-muted-foreground" style={{ fontFamily: 'serif' }}>{profile.age}</span>
              </div>
              <div className="text-xs text-muted-foreground">{profile.meta}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-5 mb-3">
        <button onClick={() => doVote('not')}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95"
          style={{ background: 'hsl(240 10% 12%)', border: '2px solid rgba(91,141,240,.3)' }}>
          ❄️
        </button>
        <button onClick={() => { }}
          className="w-11 h-11 rounded-full glass flex items-center justify-center text-muted-foreground">
          <Info className="w-4 h-4" />
        </button>
        <button onClick={() => doVote('hot')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#d4607a,#e87898)', boxShadow: '0 4px 18px rgba(212,96,122,.4)' }}>
          🔥
        </button>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Oceniono dziś: <span style={{ color: '#c9a84c', fontWeight: 600 }}>{count}</span>
      </div>
    </div>
  );
}
