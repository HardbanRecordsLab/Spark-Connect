import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, CheckCircle2, ExternalLink, Timer, AlertCircle } from 'lucide-react';
import { ADSTERRA_KEY } from '@/lib/adConfig';

export type RewardType =
  | 'incognito_1h'
  | 'who_liked_me_24h'
  | 'super_like_x5'
  | 'boost_24h'
  | 'unlock_blur'
  | 'coins_ad';

const REWARD_LABELS: Record<RewardType, { title: string; desc: string; icon: string; durationS: number }> = {
  incognito_1h:      { title: 'Tryb Incognito — 1 godzina',       desc: 'Przeglądaj profile anonimowo',          icon: '👻', durationS: 30 },
  who_liked_me_24h:  { title: 'Kto mnie polubił — 24h',           desc: 'Zobacz wszystkie osoby które Cię lubią', icon: '💚', durationS: 45 },
  super_like_x5:     { title: '5 Super Like\'ów',                  desc: 'Wyróżnij się w talii kart',             icon: '⭐', durationS: 20 },
  boost_24h:         { title: 'Boost profilu — 24 godziny',        desc: '10× więcej wyświetleń',                 icon: '🚀', durationS: 60 },
  unlock_blur:       { title: 'Odblokuj zdjęcie',                  desc: 'Zobacz kto Cię polubił',                icon: '🔓', durationS: 15 },
  coins_ad:          { title: '+20 coinów',                        desc: 'Doładuj konto oglądając reklamę',       icon: '🪙', durationS: 20 },
};

// Adsterra Direct Link (Smartlink) for spark-connect.hardbanrecordslab.online
const ADSTERRA_DIRECT_LINK = `https://deductpursue.com/j5zvn6q8x8?key=5182b7f4b4521755690210440a0f4a83`;

interface RewardedAdProps {
  reward: RewardType;
  onComplete: (reward: RewardType) => void;
  onSkip: () => void;
  onClose?: () => void;
}

export default function RewardedAd({ reward, onComplete, onSkip, onClose }: RewardedAdProps) {
  const [phase, setPhase] = useState<'intro' | 'watching' | 'done'>('intro');
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const rewardInfo = REWARD_LABELS[reward];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adTabRef = useRef<Window | null>(null);

  const startAd = () => {
    // Open Adsterra Smartlink in a new tab
    const newTab = window.open(ADSTERRA_DIRECT_LINK, '_blank');
    if (!newTab) {
      setError(true); // Popup blocked
      return;
    }
    
    adTabRef.current = newTab;
    setPhase('watching');
    setCountdown(rewardInfo.durationS);
    
    const totalMs = rewardInfo.durationS * 1000;
    const tick = 100;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += tick;
      const p = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(p);
      setCountdown(Math.max(0, Math.ceil((totalMs - elapsed) / 1000)));
      
      if (elapsed >= totalMs) {
        clearInterval(intervalRef.current!);
        setPhase('done');
      }
    }, tick);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-2xl border border-white/10">
          <span className="text-xl">{rewardInfo.icon}</span>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Nagroda</p>
            <p className="text-xs font-bold text-primary leading-none">{rewardInfo.title}</p>
          </div>
        </div>
        <button onClick={onSkip} className="w-10 h-10 glass rounded-full flex items-center justify-center border border-white/5">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          {phase === 'intro' ? (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-sm space-y-8">
              <div className="w-24 h-24 rounded-[32px] gradient-fire mx-auto flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(255,26,78,0.5)]">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black italic">Obejrzyj i odblokuj</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Obejrzyj krótką reklamę od naszych partnerów (ok. {rewardInfo.durationS}s), aby otrzymać <span className="text-primary font-bold">{rewardInfo.title}</span> całkowicie za darmo.
                </p>
              </div>
              
              {error && (
                <div className="p-4 glass border border-destructive/30 rounded-2xl flex items-center gap-3 text-destructive text-sm bg-destructive/5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-left font-medium">Zablokowano okno pop-up. Zezwól na wyskakujące okienka w przeglądarce, aby kontynuować.</p>
                </div>
              )}

              <button 
                onClick={startAd}
                className="w-full py-5 gradient-luxury rounded-[24px] font-black text-lg shadow-xl glow-gold active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Uruchom reklamę <ExternalLink className="w-5 h-5" />
              </button>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Wspierane przez Adsterra Anti-Adblock</p>
            </motion.div>
          ) : phase === 'watching' ? (
            <motion.div key="watching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-sm space-y-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto">
                  <Timer className="w-12 h-12 text-primary animate-pulse" />
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="377" 
                      strokeDashoffset={377 - (377 * progress) / 100} className="text-primary transition-all duration-100" />
                  </svg>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black italic">
                  {countdown}s
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Reklama trwa...</h3>
                  <p className="text-sm text-muted-foreground">Nie zamykaj tej strony. Nagroda zostanie przyznana automatycznie po zakończeniu odliczania.</p>
                </div>
                
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="p-5 glass border border-white/5 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl gradient-fire flex items-center justify-center text-2xl shadow-lg">
                  {rewardInfo.icon}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-primary">Cierpliwości...</p>
                  <p className="text-[10px] text-muted-foreground">Zaraz otrzymasz: {rewardInfo.title}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8 text-center max-w-xs">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-32 h-32 rounded-full gradient-fire flex items-center justify-center text-5xl shadow-2xl relative z-10">
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic">Gotowe! 🎉</h2>
                <p className="text-muted-foreground font-medium">Nagroda została dopisana do Twojego profilu.</p>
              </div>
              <button
                onClick={() => onComplete(reward)}
                className="w-full py-5 gradient-fire text-primary-foreground font-black text-xl rounded-[24px] glow-red active:scale-95 transition-all shadow-2xl"
              >
                Odbierz nagrodę!
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
          Spark Connect Premium · Powered by Studio HRL Adult
        </p>
      </div>
    </motion.div>
  );
}

