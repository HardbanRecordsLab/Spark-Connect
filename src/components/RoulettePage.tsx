import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Video, Wifi } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import AdBanner from '@/components/AdBanner';

type RouletteState = 'idle' | 'searching' | 'preview' | 'connected' | 'ended';

export default function RoulettePage() {
  const { swipeRight } = useAppStore();
  const [state, setState] = useState<RouletteState>('idle');
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [previewCountdown, setPreviewCountdown] = useState(30);
  const [callDuration, setCallDuration] = useState(0);
  const [matchedUser] = useState({
    displayName: 'Sofia',
    age: 26,
    city: 'Warsaw',
    photos: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'],
    isVerified: true,
  });

  // Search timer
  useEffect(() => {
    if (state !== 'searching') return;
    setSearchTime(0);
    const interval = setInterval(() => {
      setSearchTime(t => {
        if (t >= 3) { clearInterval(interval); setState('preview'); return t; }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Preview countdown
  useEffect(() => {
    if (state !== 'preview') return;
    setPreviewCountdown(30);
    const interval = setInterval(() => {
      setPreviewCountdown(t => {
        if (t <= 1) { clearInterval(interval); setState('idle'); return 30; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Call duration
  useEffect(() => {
    if (state !== 'connected') return;
    setCallDuration(0);
    const interval = setInterval(() => setCallDuration(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startSearch = () => setState('searching');
  const connect = () => setState('connected');
  const skip = () => setState('searching');
  const end = () => { setState('ended'); setShowInterstitial(true); };

  return (
    <div className="h-full flex flex-col bg-radial-glow">
      {/* Interstitial ad after call ends */}
      <AnimatePresence>
        {showInterstitial && (
          <AdBanner placement="interstitial" onClose={() => setShowInterstitial(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ── Idle ── */}
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8"
          >
            <div className="relative">
              <motion.div className="w-32 h-32 rounded-full gradient-fire flex items-center justify-center text-6xl"
                animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>⚡</motion.div>
              <div className="absolute -inset-2 rounded-full gradient-fire opacity-20 blur-xl" />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Spark Roulette</h1>
              <p className="text-muted-foreground leading-relaxed">
                30-second blind video preview. Both press "Connect" to match. 100% free, 100% spontaneous.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
              {[
                { emoji: '👁️', label: 'Blurred preview', desc: '30 sec' },
                { emoji: '🎯', label: 'Smart match', desc: 'By preferences' },
                { emoji: '💫', label: 'Instant match', desc: 'If both connect' },
              ].map(f => (
                <div key={f.label} className="glass rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">{f.emoji}</div>
                  <div className="text-xs font-semibold">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={startSearch}
              className="w-full gradient-fire text-primary-foreground font-bold text-lg py-4 rounded-2xl glow-red active:scale-95 transition-transform">
              Start Roulette ⚡
            </button>

            {/* Ad strip on idle screen */}
            <AdBanner placement="roulette" />
          </motion.div>
        )}

        {/* ── Searching ── */}
        {state === 'searching' && (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
          >
            <div className="relative">
              <motion.div className="w-28 h-28 rounded-full border-4 border-primary/30"
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              <motion.div className="absolute inset-3 rounded-full border-4 border-primary"
                animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
              <div className="absolute inset-0 flex items-center justify-center text-4xl">⚡</div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Finding your match...</h2>
              <p className="text-muted-foreground text-sm">{searchTime}s · Looking for someone compatible</p>
            </div>
            {/* Fake waiting users */}
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(i => (
                <motion.div key={i} className="w-8 h-8 rounded-full overflow-hidden opacity-40"
                  animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, delay: i * 0.3, duration: 1.5 }}>
                  <div className="w-full h-full gradient-fire" />
                </motion.div>
              ))}
              <span className="text-xs text-muted-foreground ml-2">247 online now</span>
            </div>
            <button onClick={() => setState('idle')} className="glass px-6 py-3 rounded-xl text-sm text-muted-foreground">
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Preview ── */}
        {state === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="relative flex-1">
              <img src={matchedUser.photos[0]} alt="" className="w-full h-full object-cover"
                style={{ filter: 'blur(20px) brightness(0.7)' }} />
              <div className="absolute inset-0 bg-background/40" />

              {/* Countdown ring */}
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold">Preview: {previewCountdown}s</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute top-14 left-8 right-8">
                <div className="h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full"
                    style={{ width: `${((30 - previewCountdown) / 30) * 100}%` }} />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{matchedUser.displayName}, {matchedUser.age}</h3>
                  {matchedUser.isVerified && <span className="text-blue-400 text-lg">✓</span>}
                </div>
                <p className="text-muted-foreground text-sm">{matchedUser.city}</p>
                <div className="flex gap-3 w-full">
                  <button onClick={skip} className="flex-1 glass py-3.5 rounded-2xl font-semibold text-muted-foreground">
                    Next ➡️
                  </button>
                  <button onClick={connect} className="flex-1 gradient-fire text-primary-foreground py-3.5 rounded-2xl font-bold glow-red">
                    Connect 🔥
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Connected ── */}
        {state === 'connected' && (
          <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 relative">
            <img src={matchedUser.photos[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />

            {/* Self view */}
            <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden glass border border-primary-foreground/10">
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>

            {/* Info bar */}
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium">{formatDur(callDuration)}</span>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-sm">Connected with {matchedUser.displayName}</span>
              </div>
              <button onClick={end} className="bg-destructive text-destructive-foreground px-8 py-3 rounded-full font-semibold">
                End Call
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Ended ── */}
        {state === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }} transition={{ repeat: 2 }} className="text-6xl">🔥</motion.div>
            <h2 className="text-2xl font-bold">Great chemistry!</h2>
            <p className="text-muted-foreground">You chatted for {formatDur(callDuration)} with {matchedUser.displayName}</p>
            <div className="glass rounded-2xl p-4 w-full text-center">
              <p className="text-sm text-muted-foreground mb-1">Chemistry score with {matchedUser.displayName}</p>
              <p className="text-3xl font-black gradient-text">87%</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setState('idle')} className="flex-1 glass py-3.5 rounded-2xl font-semibold">
                Next Roulette ⚡
              </button>
              <button onClick={swipeRight} className="flex-1 gradient-fire text-primary-foreground py-3.5 rounded-2xl font-bold glow-red">
                Send Like 💚
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
