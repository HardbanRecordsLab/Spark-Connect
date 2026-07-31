import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, CheckCircle2 } from 'lucide-react';

const CHALLENGES = [
  { id: 'login',   label: 'Zaloguj się',                  xp: 10,  done: true },
  { id: 'swipe5',  label: 'Przesuń 5 profili',            xp: 20,  done: false },
  { id: 'msg',     label: 'Wyślij pierwszą wiadomość',    xp: 30,  done: false },
  { id: 'photo',   label: 'Uzupełnij galerię zdjęć',      xp: 25,  done: false },
];

const STREAK_EMOJIS = ['🔥', '💪', '⚡', '🌟', '🏆', '💎', '👑'];

interface DailyStreakProps {
  onClose: () => void;
  currentStreak?: number;
}

export default function DailyStreak({ onClose, currentStreak = 3 }: DailyStreakProps) {
  const [tasks, setTasks] = useState(CHALLENGES);
  const [claimed, setClaimed] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const doneCount = tasks.filter(t => t.done).length;
  const totalXp = tasks.filter(t => t.done).reduce((s, t) => s + t.xp, 0);
  const streakEmoji = STREAK_EMOJIS[Math.min(currentStreak - 1, STREAK_EMOJIS.length - 1)];

  const completeTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.done) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    setXpAnimation(task.xp);
    setTimeout(() => setXpAnimation(null), 1500);
  };

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
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-3">
          {/* Header */}
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

          {/* Week calendar */}
          <div className="flex gap-2 mb-5 justify-center">
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day, i) => {
              const isPast = i < currentStreak - 1;
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

          {/* XP bar */}
          <div className="glass rounded-2xl p-4 mb-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">XP dziś</span>
              <AnimatePresence>
                {xpAnimation !== null && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -5 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute right-4 top-3 text-sm font-black text-primary"
                  >
                    +{xpAnimation} XP
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-sm font-bold text-primary">{totalXp} / 85 XP</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-fire rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalXp / 85) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 80 }}
              />
            </div>
          </div>

          {/* Daily challenges */}
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
                    : <span className="text-xs text-muted-foreground font-bold">{task.xp}</span>
                  }
                </div>
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.label}
                </span>
                <span className="text-xs font-bold text-accent">+{task.xp} XP</span>
                {!task.done && (
                  <button
                    onClick={() => completeTask(task.id)}
                    className="text-xs gradient-fire text-primary-foreground px-2.5 py-1 rounded-lg"
                  >
                    Zrób
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Claim daily reward */}
          {doneCount === tasks.length && !claimed ? (
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={() => setClaimed(true)}
              className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red"
            >
              🎁 Odbierz nagrodę dnia!
            </motion.button>
          ) : claimed ? (
            <div className="w-full text-center glass py-3.5 rounded-2xl">
              <span className="text-sm text-muted-foreground">✅ Nagroda odebrana — wróć jutro!</span>
            </div>
          ) : (
            <div className="w-full glass py-3.5 rounded-2xl text-center">
              <span className="text-sm text-muted-foreground">Ukończ {tasks.length - doneCount} wyzwań aby odebrać nagrodę</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
