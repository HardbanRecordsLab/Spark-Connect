import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Users, Video, Heart, X, Zap,
  Calendar, CheckCircle2, Timer, MicOff, VideoOff
} from 'lucide-react';
import AdBanner from '@/components/AdBanner';
import { useAppStore } from '@/store/appStore';

// ── Types ──────────────────────────────────────────────────────
interface SDEvent {
  id: string;
  title: string;
  startTime: Date;
  duration: number; // minutes per round
  rounds: number;
  registered: number;
  capacity: number;
  category: string;
  emoji: string;
}

interface SDRound {
  roundNumber: number;
  partnerName: string;
  partnerAge: number;
  partnerPhoto: string;
  timeLeft: number; // seconds
  totalTime: number;
}

// ── Mock upcoming events ───────────────────────────────────────
function generateEvents(): SDEvent[] {
  const now = new Date();
  const friday20 = new Date(now);
  friday20.setHours(20, 0, 0, 0);
  // next Friday
  const daysUntilFriday = (5 - friday20.getDay() + 7) % 7 || 7;
  friday20.setDate(friday20.getDate() + daysUntilFriday);

  const sat18 = new Date(friday20);
  sat18.setDate(sat18.getDate() + 1);
  sat18.setHours(18, 0, 0, 0);

  const tonightTest = new Date(now);
  tonightTest.setMinutes(tonightTest.getMinutes() + 5); // starts in 5 min for demo

  return [
    {
      id: 'sd1', title: 'Piątkowy Speed Dating', emoji: '🔥',
      startTime: tonightTest, duration: 3, rounds: 8,
      registered: 24, capacity: 30, category: 'Ogólny',
    },
    {
      id: 'sd2', title: 'Sobotni wieczór 25-35', emoji: '🌙',
      startTime: sat18, duration: 4, rounds: 6,
      registered: 18, capacity: 20, category: '25-35 lat',
    },
    {
      id: 'sd3', title: 'Speed Dating — Kraków', emoji: '🏙️',
      startTime: friday20, duration: 3, rounds: 10,
      registered: 35, capacity: 40, category: 'Kraków',
    },
  ];
}

// ── Helpers ────────────────────────────────────────────────────
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Teraz!';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  return `${days[date.getDay()]}, ${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ── EventCard ─────────────────────────────────────────────────
function EventCard({ event, onJoin, isRegistered }: {
  event: SDEvent;
  onJoin: (e: SDEvent) => void;
  isRegistered: boolean;
}) {
  const [countdown, setCountdown] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const spotsLeft = event.capacity - event.registered;

  useEffect(() => {
    const tick = () => {
      const ms = event.startTime.getTime() - Date.now();
      setCountdown(formatCountdown(ms));
      setCanJoin(ms <= 5 * 60 * 1000 && ms > -event.duration * 60 * 1000 * event.rounds);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [event]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-border"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl gradient-fire flex items-center justify-center text-2xl flex-shrink-0">
          {event.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{event.title}</h3>
          <p className="text-xs text-muted-foreground">{event.category}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
          spotsLeft <= 3 ? 'bg-destructive/20 text-destructive' : 'glass text-muted-foreground'
        }`}>
          {spotsLeft > 0 ? `${spotsLeft} miejsc` : 'Pełne'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="glass rounded-xl p-2 text-center">
          <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{formatDate(event.startTime)}</p>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <Clock className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{formatTime(event.startTime)}</p>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{event.registered} os.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer className="w-3.5 h-3.5" />
          <span>{event.rounds} rund × {event.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={canJoin ? 'text-primary font-bold animate-pulse' : 'text-muted-foreground'}>
            {canJoin ? '🟢 Możesz dołączyć!' : `⏰ ${countdown}`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-fire rounded-full transition-all"
            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
          />
        </div>
      </div>

      {isRegistered ? (
        <button
          onClick={() => onJoin(event)}
          disabled={!canJoin}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            canJoin
              ? 'gradient-fire text-primary-foreground glow-red'
              : 'glass text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Video className="w-4 h-4" />
          {canJoin ? 'Dołącz teraz!' : 'Zapisano — czekaj na start'}
        </button>
      ) : (
        <button
          onClick={() => onJoin(event)}
          disabled={spotsLeft === 0}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            spotsLeft > 0
              ? 'gradient-fire text-primary-foreground'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          {spotsLeft > 0 ? '+ Zapisz się (bezpłatnie)' : 'Brak miejsc'}
        </button>
      )}
    </motion.div>
  );
}

// ── Live Round View ────────────────────────────────────────────
const MOCK_PARTNERS = [
  { name: 'Sofia', age: 26, photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80' },
  { name: 'Mia',   age: 24, photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80' },
  { name: 'Elena', age: 29, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { name: 'Zara',  age: 23, photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80' },
];

function LiveRound({ round, onLike, onSkip, onEnd }: {
  round: SDRound;
  onLike: () => void;
  onSkip: () => void;
  onEnd: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(round.totalTime);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    setTimeLeft(round.totalTime);
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); onEnd(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [round.roundNumber]);

  const progress = ((round.totalTime - timeLeft) / round.totalTime) * 100;
  const isUrgent = timeLeft <= 30;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Timer bar */}
      <div className="h-1.5 bg-secondary">
        <motion.div
          className={`h-full rounded-full transition-colors ${isUrgent ? 'bg-destructive' : 'bg-primary'}`}
          animate={{ width: `${100 - progress}%` }}
          transition={{ type: 'tween', duration: 1 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 glass-strong">
        <div>
          <p className="text-xs text-muted-foreground">Runda {round.roundNumber}</p>
          <p className="font-bold">{round.partnerName}, {round.partnerAge}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          isUrgent ? 'bg-destructive/20 border border-destructive/40' : 'glass'
        }`}>
          <Timer className={`w-3.5 h-3.5 ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`} />
          <span className={`text-sm font-bold tabular-nums ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {/* Partner video (mock) */}
        <img
          src={round.partnerPhoto}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

        {/* My cam (PIP) */}
        <div className="absolute top-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-border shadow-xl">
          {camOff ? (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
              alt="You"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Urgent warning */}
        <AnimatePresence>
          {isUrgent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive/90 text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
            >
              ⏰ Ostatnie 30 sekund!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-6 py-5 glass-strong">
        <div className="flex items-center justify-center gap-5">
          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-14 h-14 glass rounded-full flex items-center justify-center border border-destructive/30"
          >
            <X className="w-6 h-6 text-destructive" />
          </button>

          {/* Mute */}
          <button
            onClick={() => setMuted(v => !v)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-secondary border border-border' : 'glass'}`}
          >
            <MicOff className={`w-5 h-5 ${muted ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>

          {/* Like */}
          <button
            onClick={onLike}
            className="w-14 h-14 gradient-fire rounded-full flex items-center justify-center glow-red"
          >
            <Heart className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          💚 Like = chcesz się spotkać ponownie
        </p>
      </div>
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────
function Results({ matches, totalRounds, onClose }: {
  matches: string[];
  totalRounds: number;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="text-6xl"
        >
          {matches.length > 0 ? '🔥' : '💪'}
        </motion.div>
        <h2 className="text-2xl font-black">
          {matches.length > 0 ? `${matches.length} dopasowań!` : 'Dobra próba!'}
        </h2>
        <p className="text-muted-foreground">
          Rozmawiałeś/aś z {totalRounds} osobami
        </p>

        {matches.length > 0 && (
          <div className="w-full glass rounded-2xl p-4 border border-primary/20">
            <p className="text-sm font-semibold mb-3 text-primary">Wzajemne dopasowania 💚</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {matches.map(name => (
                <span key={name} className="glass px-3 py-1.5 rounded-full text-sm font-medium border border-primary/30">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Dopasowania pojawią się w Twoich wiadomościach
        </p>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <AdBanner placement="interstitial" onClose={() => {}} />
        <button
          onClick={onClose}
          className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl"
        >
          Przejdź do wiadomości 💬
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────
interface SpeedDatingProps {
  onClose: () => void;
}

type Phase = 'lobby' | 'waiting' | 'round' | 'between' | 'results';

export default function SpeedDating({ onClose }: SpeedDatingProps) {
  const { setActiveTab } = useAppStore();
  const [events] = useState(generateEvents);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>('lobby');
  const [currentRound, setCurrentRound] = useState(0);
  const [activeEvent, setActiveEvent] = useState<SDEvent | null>(null);
  const [likedRounds, setLikedRounds] = useState<Set<number>>(new Set());
  const [partnerIndex, setPartnerIndex] = useState(0);

  const totalRounds = activeEvent?.rounds ?? 4;

  const handleJoinOrRegister = (event: SDEvent) => {
    const ms = event.startTime.getTime() - Date.now();
    const canJoin = ms <= 5 * 60 * 1000;
    if (canJoin && registeredIds.has(event.id)) {
      // Start session
      setActiveEvent(event);
      setCurrentRound(1);
      setPartnerIndex(0);
      setPhase('waiting');
      setTimeout(() => setPhase('round'), 2000);
    } else {
      setRegisteredIds(prev => new Set([...prev, event.id]));
    }
  };

  const handleLike = () => {
    setLikedRounds(prev => new Set([...prev, currentRound]));
    goNextRound();
  };

  const handleSkip = () => goNextRound();

  const goNextRound = () => {
    if (currentRound >= totalRounds) {
      setPhase('results');
      return;
    }
    setPhase('between');
    setTimeout(() => {
      setCurrentRound(r => r + 1);
      setPartnerIndex(i => (i + 1) % MOCK_PARTNERS.length);
      setPhase('round');
    }, 2000);
  };

  const partner = MOCK_PARTNERS[partnerIndex];
  const matchedNames = [...likedRounds].map(r => MOCK_PARTNERS[(r - 1) % MOCK_PARTNERS.length].name);

  if (phase === 'waiting') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-5">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Zap className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold">Szukam partnera...</h2>
        <p className="text-muted-foreground text-sm">Łączę Cię z losową osobą</p>
      </div>
    );
  }

  if (phase === 'between') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">⏭️</div>
        <h2 className="text-xl font-bold">Następna runda!</h2>
        <p className="text-muted-foreground text-sm">Runda {currentRound + 1} z {totalRounds}</p>
      </div>
    );
  }

  if (phase === 'round' && partner) {
    return (
      <LiveRound
        round={{
          roundNumber: currentRound,
          partnerName: partner.name,
          partnerAge: partner.age,
          partnerPhoto: partner.photo,
          timeLeft: (activeEvent?.duration ?? 3) * 60,
          totalTime: (activeEvent?.duration ?? 3) * 60,
        }}
        onLike={handleLike}
        onSkip={handleSkip}
        onEnd={goNextRound}
      />
    );
  }

  if (phase === 'results') {
    return (
      <Results
        matches={matchedNames}
        totalRounds={totalRounds}
        onClose={() => { setActiveTab('chats'); onClose(); }}
      />
    );
  }

  // Lobby
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 glass-strong border-b border-border">
        <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold">Speed Dating</h2>
          <p className="text-xs text-muted-foreground">Wirtualne randki — 3 minuty z każdą osobą</p>
        </div>
        <div className="glass px-2.5 py-1 rounded-full">
          <span className="text-xs text-primary font-medium">Bezpłatne</span>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-4 mt-4 glass rounded-2xl p-4 border border-primary/10">
        <p className="text-xs font-semibold text-primary mb-2">Jak to działa?</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { emoji: '📋', label: 'Zapisz się' },
            { emoji: '⚡', label: '3 min rozmowy' },
            { emoji: '💚', label: 'Like = match' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hidden">
        <AdBanner placement="discover" />
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onJoin={handleJoinOrRegister}
            isRegistered={registeredIds.has(event.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}
