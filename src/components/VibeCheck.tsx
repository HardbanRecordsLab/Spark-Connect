import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, SkipForward } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VibeCheckProps {
  profileName: string;
  profilePhoto: string;
  onMatch: () => void;
  onSkip: () => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VibeCheck({ profileName, profilePhoto, onMatch, onSkip, onClose }: VibeCheckProps) {
  const [phase, setPhase] = useState<'intro' | 'call' | 'result'>('intro');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const [bothFeelingIt, setBothFeelingIt] = useState(false);
  const [iFeelIt, setIFeelIt] = useState(false);
  const [theyFeelIt, setTheyFeelIt] = useState(false);

  // countdown during call
  useEffect(() => {
    if (phase !== 'call') return;
    if (timeLeft <= 0) { setPhase('result'); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // simulate other person pressing "feeling it" at ~30s
  useEffect(() => {
    if (phase !== 'call') return;
    const t = setTimeout(() => setTheyFeelIt(true), 30000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (iFeelIt && theyFeelIt) {
      setBothFeelingIt(true);
      setTimeout(() => { setPhase('result'); }, 1800);
    }
  }, [iFeelIt, theyFeelIt]);

  const progressPct = ((60 - timeLeft) / 60) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-background flex flex-col"
    >
      {/* ── Intro ── */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6"
          >
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary">
                <img src={profilePhoto} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(14px)' }} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 gradient-fire text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                Blurred
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black gradient-text mb-2">Vibe Check 👁️</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                60-second <strong>anonymous</strong> audio + blurred video with <strong>{profileName}</strong>. No names, no photos. If you both feel it — it's a match!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { emoji: '🎭', label: 'Blurred video', desc: 'Identity hidden' },
                { emoji: '🔊', label: 'Voice only mode', desc: 'Real chemistry' },
                { emoji: '⏱️', label: '60 seconds', desc: 'Quick & fun' },
                { emoji: '💫', label: 'Mutual match', desc: 'Both must agree' },
              ].map(f => (
                <div key={f.label} className="glass rounded-2xl p-3 text-center">
                  <div className="text-xl mb-1">{f.emoji}</div>
                  <div className="text-xs font-semibold">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 glass py-3.5 rounded-2xl text-muted-foreground font-medium">
                Cancel
              </button>
              <button
                onClick={() => setPhase('call')}
                className="flex-1 gradient-fire text-primary-foreground py-3.5 rounded-2xl font-bold glow-red"
              >
                Start Vibe Check ⚡
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Call ── */}
        {phase === 'call' && (
          <motion.div
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Remote blurred video */}
            <div className="relative flex-1">
              <img
                src={profilePhoto}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'blur(24px) brightness(0.6)' }}
              />
              <div className="absolute inset-0 bg-background/30" />

              {/* Timer arc */}
              <div className="absolute top-5 left-0 right-0 flex flex-col items-center gap-2">
                <div className="glass px-5 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-bold">{timeLeft}s</span>
                </div>
                <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-fire rounded-full"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Blurred profile silhouette label */}
              <div className="absolute top-24 left-0 right-0 flex justify-center">
                <div className="glass px-4 py-2 rounded-2xl text-center">
                  <p className="text-sm font-bold">Anonymous match</p>
                  <p className="text-xs text-muted-foreground">Voice + blurred video</p>
                </div>
              </div>

              {/* Self view */}
              <div className="absolute top-4 right-4 w-24 h-32 rounded-2xl overflow-hidden glass border border-border">
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl">{isMuted ? '🔇' : '🎙️'}</span>
                </div>
              </div>

              {/* They feel it indicator */}
              <AnimatePresence>
                {theyFeelIt && !bothFeelingIt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-48 left-0 right-0 flex justify-center"
                  >
                    <div className="glass border border-primary/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                      <span className="text-lg">💖</span>
                      <span className="text-sm font-semibold text-primary">They're feeling it!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Both feeling it flash */}
              <AnimatePresence>
                {bothFeelingIt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'radial-gradient(ellipse at center, hsl(347 100% 65% / 0.3) 0%, transparent 70%)' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
                      transition={{ repeat: 3 }}
                      className="text-8xl"
                    >🔥</motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="glass-strong border-t border-border px-6 py-5 space-y-4">
              {/* Feeling it button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setIFeelIt(true)}
                disabled={iFeelIt}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                  iFeelIt ? 'bg-primary/20 border border-primary/40 text-primary' : 'gradient-fire text-primary-foreground glow-red'
                }`}
              >
                {iFeelIt ? '💖 You\'re feeling it! Waiting...' : 'I\'m feeling it 💖'}
              </motion.button>

              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-destructive' : 'glass'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 text-primary-foreground" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={onSkip}
                  className="glass px-5 py-2.5 rounded-xl text-sm text-muted-foreground flex items-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>

                <button
                  onClick={onClose}
                  className="w-12 h-12 bg-destructive/20 border border-destructive/30 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-destructive" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Result ── */}
        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6"
          >
            {iFeelIt && theyFeelIt ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: 2 }}
                  className="text-7xl"
                >🔥</motion.div>
                <div>
                  <h2 className="text-3xl font-black gradient-text mb-2">Chemistry Detected!</h2>
                  <p className="text-muted-foreground text-sm">Both of you felt the vibe. Now see who you matched with!</p>
                </div>
                <button onClick={onMatch} className="w-full gradient-fire text-primary-foreground py-4 rounded-2xl font-bold glow-red text-lg">
                  Reveal & Match 💥
                </button>
                <button onClick={onClose} className="text-sm text-muted-foreground">Skip reveal</button>
              </>
            ) : (
              <>
                <div className="text-7xl">😅</div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Time's up!</h2>
                  <p className="text-muted-foreground text-sm">
                    {!iFeelIt ? "You didn't press 'feeling it' — maybe next one!" : "The other person wasn't feeling it this time."}
                  </p>
                </div>
                <button onClick={onSkip} className="w-full gradient-fire text-primary-foreground py-4 rounded-2xl font-bold">
                  Next Vibe Check ⚡
                </button>
                <button onClick={onClose} className="text-sm text-muted-foreground">Back to discover</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
