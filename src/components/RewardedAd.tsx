import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, CheckCircle2 } from 'lucide-react';

export type RewardType =
  | 'incognito_1h'
  | 'who_liked_me_24h'
  | 'super_like_x5'
  | 'boost_24h'
  | 'unlock_blur';

const REWARD_LABELS: Record<RewardType, { title: string; desc: string; icon: string }> = {
  incognito_1h:      { title: 'Tryb Incognito — 1 godzina',       desc: 'Przeglądaj profile anonimowo',          icon: '👻' },
  who_liked_me_24h:  { title: 'Kto mnie polubił — 24h',           desc: 'Zobacz wszystkie osoby które Cię lubią', icon: '💚' },
  super_like_x5:     { title: '5 Super Like\'ów',                  desc: 'Wyróżnij się w talii kart',             icon: '⭐' },
  boost_24h:         { title: 'Boost profilu — 24 godziny',        desc: '10× więcej wyświetleń',                 icon: '🚀' },
  unlock_blur:       { title: 'Odblokuj zdjęcie',                  desc: 'Zobacz kto Cię polubił',                icon: '🔓' },
};

// Mock ad content — in production swap with AdMob / Unity Ads / IronSource SDK
const MOCK_ADS = [
  { brand: 'Zalando', headline: 'Letnia wyprzedaż — do -60%', cta: 'Zobacz ofertę', color: '#FF6900' },
  { brand: 'Bolt Food', headline: 'Zamów jedzenie — 30% rabatu', cta: 'Zamów teraz', color: '#34D186' },
  { brand: 'Spotify', headline: '3 miesiące Premium za darmo', cta: 'Aktywuj', color: '#1DB954' },
  { brand: 'Ryanair', headline: 'Loty od 9 EUR — tylko dziś!', cta: 'Zarezerwuj', color: '#073590' },
];

interface RewardedAdProps {
  reward: RewardType;
  onComplete: (reward: RewardType) => void;
  onSkip: () => void;
}

export default function RewardedAd({ reward, onComplete, onSkip }: RewardedAdProps) {
  const [phase, setPhase] = useState<'watching' | 'done'>('watching');
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(0);
  const ad = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
  const rewardInfo = REWARD_LABELS[reward];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const total = 5000;
    const tick = 50;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(100, Math.round((elapsed / total) * 100)));
      setCountdown(Math.max(0, Math.ceil((total - elapsed) / 1000)));
      if (elapsed >= total) {
        clearInterval(intervalRef.current!);
        setPhase('done');
      }
    }, tick);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
    >
      {/* Skip button — only after watching */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
          <span className="text-sm">{rewardInfo.icon}</span>
          <span className="text-xs font-medium text-primary">{rewardInfo.title}</span>
        </div>
        {phase === 'done' ? (
          <button onClick={onSkip} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="glass px-3 py-1.5 rounded-full">
            <span className="text-xs text-muted-foreground">Pomiń za {countdown}s</span>
          </div>
        )}
      </div>

      {/* Ad content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'watching' ? (
            <motion.div key="ad" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-sm">
              {/* Mock ad visual */}
              <div className="w-full aspect-video rounded-2xl mb-6 flex flex-col items-center justify-center gap-3 border border-border/50"
                style={{ background: `${ad.color}18` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${ad.color}30` }}>
                  🛍️
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{ad.brand}</p>
                <p className="text-lg font-bold text-center px-4">{ad.headline}</p>
                <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: ad.color }}>
                  {ad.cta}
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'tween', duration: 0.05 }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-3 h-3" />
                    <span>Oglądasz reklamę...</span>
                  </div>
                  <span>{countdown}s</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-5 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-24 h-24 rounded-full gradient-fire flex items-center justify-center text-4xl"
              >
                {rewardInfo.icon}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Odblokowano! 🎉</h2>
                <p className="text-muted-foreground">{rewardInfo.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{rewardInfo.desc}</p>
              </div>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => onComplete(reward)}
                className="w-full max-w-xs gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red"
              >
                <CheckCircle2 className="w-5 h-5 inline mr-2" />
                Użyj teraz!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ad label */}
      <div className="text-center pb-6">
        <span className="text-xs text-muted-foreground/50 border border-border/30 rounded px-2 py-0.5">Reklama</span>
      </div>
    </motion.div>
  );
}
