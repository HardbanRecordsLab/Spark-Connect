import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Flame, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const STREAK_EMOJIS = ['🔥', '💪', '⚡', '🌟', '🏆', '💎', '👑'];

interface Progress {
  swipes_today: number;
  messages_today: number;
  photos_count: number;
  login_streak: number;
  reward_claimed_today: boolean;
}

interface DailyStreakProps {
  onClose: () => void;
}

export default function DailyStreak({ onClose }: DailyStreakProps) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = async () => {
    setLoading(true);
    // Records today's login (increments/resets the streak server-side)
    // before reading back real progress -- this is the only place the
    // streak count changes, never a client-set value.
    await db.rpc('record_daily_login');
    const { data } = await db.rpc('get_daily_challenge_progress').single();
    if (data) setProgress(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleClaim = async () => {
    setClaiming(true);
    const { data: newBalance, error } = await db.rpc('claim_daily_streak_reward');
    setClaiming(false);
    if (error) {
      toast.error(error.message?.includes('already_claimed') ? 'Nagroda już odebrana dzisiaj.' : 'Ukończ wszystkie wyzwania, aby odebrać nagrodę.');
      return;
    }
    toast.success(`+15 coinów! Nowe saldo: ${newBalance} 🪙`);
    setProgress(p => p ? { ...p, reward_claimed_today: true } : p);
  };

  const currentStreak = progress?.login_streak ?? 1;
  const streakEmoji = STREAK_EMOJIS[Math.min(currentStreak - 1, STREAK_EMOJIS.length - 1)];

  const tasks = progress ? [
    { id: 'login', label: 'Zaloguj się', done: true },
    { id: 'swipe5', label: 'Przesuń 5 profili', done: progress.swipes_today >= 5, progressLabel: `${Math.min(progress.swipes_today, 5)}/5` },
    { id: 'msg', label: 'Wyślij wiadomość', done: progress.messages_today >= 1, progressLabel: `${Math.min(progress.messages_today, 1)}/1` },
    { id: 'photo', label: 'Miej min. 3 zdjęcia w profilu', done: progress.photos_count >= 3, progressLabel: `${Math.min(progress.photos_count, 3)}/3` },
  ] : [];
  const doneCount = tasks.filter(t => t.done).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-card rounded-t-3xl pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
        <div className="px-5 pt-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                className="text-3xl"
              >
                {streakEmoji}
              </motion.div>
              <div>
                <h2 className="text-lg font-bold">{currentStreak}-dniowa seria!</h2>
                <p className="text-xs text-muted-foreground">Wróć jutro żeby nie stracić passy</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Week view -- approximates the real streak count across the
              week, not a literal per-day history (that would need a
              separate login_history table). */}
          <div className="flex gap-2 mb-5 justify-center">
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day, i) => {
              const isPast = i < (currentStreak - 1) % 7;
              const isToday = i === (currentStreak - 1) % 7;
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                    isPast ? 'gradient-fire' : isToday ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary'
                  }`}>
                    {isPast ? <Flame className="w-4 h-4 text-primary-foreground" /> : isToday ? <Flame className="w-4 h-4 text-primary" /> : null}
                  </div>
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</span>
                </div>
              );
            })}
          </div>

          <p className="text-sm font-semibold mb-3">Dzienne wyzwania</p>
          <div className="space-y-2 mb-5">
            {tasks.map(task => (
              <motion.div
                key={task.id}
                layout
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${task.done ? 'bg-primary/10 border border-primary/20' : 'glass border border-border'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-primary' : 'bg-secondary'}`}>
                  {task.done
                    ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    : <span className="text-[10px] text-muted-foreground font-bold">{task.progressLabel}</span>
                  }
                </div>
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.label}
                </span>
              </motion.div>
            ))}
          </div>

          {progress?.reward_claimed_today ? (
            <div className="w-full text-center glass py-3.5 rounded-2xl">
              <span className="text-sm text-muted-foreground">✅ Nagroda odebrana — wróć jutro!</span>
            </div>
          ) : allDone ? (
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={handleClaim}
              disabled={claiming}
              className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red disabled:opacity-60"
            >
              {claiming ? 'Odbieranie...' : '🎁 Odbierz +15 coinów!'}
            </motion.button>
          ) : (
            <div className="w-full glass py-3.5 rounded-2xl text-center">
              <span className="text-sm text-muted-foreground">Ukończ {tasks.length - doneCount} wyzwań aby odebrać nagrodę</span>
            </div>
          )}
        </div>
        )}
      </motion.div>
    </motion.div>
  );
}
