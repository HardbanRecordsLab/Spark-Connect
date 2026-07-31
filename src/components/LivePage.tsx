import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Coins, Heart, Video, Radio, ArrowLeft, Send, Mic, MicOff, VideoOff, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { LiveStream } from '@/store/appStore';
import AdBanner from '@/components/AdBanner';

const categoryColors: Record<string, string> = {
  'Chill & Talk': 'bg-blue-500/20 text-blue-400',
  'Flirt Lounge': 'bg-primary/20 text-primary',
  'Speed Dating': 'bg-accent/20 text-accent',
};

function StreamCard({ stream, onClick }: { stream: LiveStream; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl overflow-hidden card-shadow"
    >
      <div className="relative aspect-[4/3]">
        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-card-overlay" />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
          <span className="text-xs font-bold text-primary-foreground">LIVE</span>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 glass rounded-full px-2 py-0.5">
          <Eye className="w-3 h-3 text-foreground/70" />
          <span className="text-xs font-medium">{stream.viewerCount}</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className={`inline-flex text-xs px-2 py-0.5 rounded-full mb-1.5 ${categoryColors[stream.category] || 'bg-secondary'}`}>
            {stream.category}
          </div>
          <p className="text-sm font-semibold text-primary-foreground truncate">{stream.title}</p>
          <p className="text-xs text-primary-foreground/70">{stream.streamer.displayName}, {stream.streamer.age}</p>
        </div>
      </div>
    </motion.button>
  );
}

const liveComments = [
  { user: 'Alex', text: 'You look amazing tonight! 🔥', delay: 0 },
  { user: 'Marco', text: 'loveeeee this vibe 💕', delay: 1.5 },
  { user: 'Karol', text: '❤️❤️❤️', delay: 3 },
  { user: 'Julia', text: 'sending love!', delay: 4.5 },
  { user: 'Piotr', text: 'super stream 🎉', delay: 6 },
];

function StreamView({ stream, onBack }: { stream: LiveStream; onBack: () => void }) {
  const [comment, setComment] = useState('');
  const [visibleComments, setVisibleComments] = useState<typeof liveComments>([]);
  const [tipped, setTipped] = useState(false);
  const { addCoins } = useAppStore();

  useEffect(() => {
    const timers = liveComments.map(c =>
      setTimeout(() => setVisibleComments(prev => [...prev.slice(-4), c]), c.delay * 1000 + 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleTip = () => {
    addCoins(-50);
    setTipped(true);
    setTimeout(() => setTipped(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1">
        <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={onBack} className="glass px-3 py-1.5 rounded-xl text-sm">← Back</button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
              <Users className="w-3 h-3" />
              <span className="text-xs">{stream.viewerCount}</span>
            </div>
          </div>
        </div>

        {/* Streamer info */}
        <div className="absolute top-14 left-4 flex items-center gap-2">
          <img src={stream.streamer.photos[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold text-primary-foreground">{stream.streamer.displayName}</p>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-accent" />
              <span className="text-xs text-accent">{stream.tipTotal} tips</span>
            </div>
          </div>
          <button className="gradient-fire text-primary-foreground text-xs px-3 py-1.5 rounded-full ml-2">Follow</button>
        </div>

        {/* Live comments stream */}
        <div className="absolute bottom-20 left-4 right-16 space-y-1.5">
          <AnimatePresence>
            {visibleComments.map((c, i) => (
              <motion.div
                key={`${c.user}-${i}`}
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-bold text-primary">{c.user}</span>
                <span className="text-xs text-primary-foreground/80">{c.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTip}
            animate={tipped ? { scale: [1, 1.3, 1] } : {}}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${tipped ? 'gradient-fire' : 'glass'}`}
          >
            <Heart className={`w-5 h-5 ${tipped ? 'text-primary-foreground' : 'text-primary'}`} />
          </motion.button>
          <button className="w-11 h-11 glass rounded-full flex items-center justify-center">
            <span className="text-xl">🎁</span>
          </button>
        </div>
      </div>

      {/* Bottom input */}
      <div className="glass-strong border-t border-border px-4 py-3 flex items-center gap-2">
        <div className="flex-1 flex items-center glass rounded-2xl px-3 py-2 gap-2">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={handleTip}
          className="flex items-center gap-1.5 glass px-3 py-2 rounded-xl border border-accent/30"
        >
          <span className="text-sm">🪙</span>
          <span className="text-xs font-medium text-accent">50</span>
        </button>
        <button className="w-9 h-9 gradient-fire rounded-xl flex items-center justify-center">
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}

type GoLiveStep = 'setup' | 'live';

function GoLiveView({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<GoLiveStep>('setup');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chill & Talk');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [tips, setTips] = useState(0);

  useEffect(() => {
    if (step !== 'live') return;
    const dur = setInterval(() => setDuration(d => d + 1), 1000);
    const vwr = setInterval(() => setViewers(v => v + Math.floor(Math.random() * 3)), 4000);
    const tip = setInterval(() => {
      if (Math.random() > 0.7) setTips(t => t + Math.floor(Math.random() * 50) + 10);
    }, 5000);
    return () => { clearInterval(dur); clearInterval(vwr); clearInterval(tip); };
  }, [step]);

  const formatDur = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const categories = ['Chill & Talk 💬', 'Flirt Lounge 🔥', 'Speed Dating ⚡', 'Q&A 🎤'];

  if (step === 'live') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Preview */}
        <div className="relative flex-1 bg-secondary flex items-center justify-center">
          {isCamOff ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <VideoOff className="w-16 h-16" />
              <p className="text-sm">Camera is off</p>
            </div>
          ) : (
            <div className="text-6xl">🎥</div>
          )}

          {/* Live badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-destructive rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              <span className="text-xs font-bold text-primary-foreground">LIVE</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-full text-xs font-medium">{formatDur(duration)}</div>
          </div>

          {/* Stats */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold">{viewers}</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">{tips}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="glass-strong border-t border-border px-6 py-4">
          <div className="flex items-center justify-around mb-4">
            <button
              onClick={() => setIsMuted(v => !v)}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-destructive' : 'glass'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6 text-primary-foreground" /> : <Mic className="w-6 h-6 text-foreground" />}
            </button>
            <button
              onClick={onBack}
              className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center"
            >
              <Radio className="w-7 h-7 text-primary-foreground" />
            </button>
            <button
              onClick={() => setIsCamOff(v => !v)}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${isCamOff ? 'bg-destructive' : 'glass'}`}
            >
              {isCamOff ? <VideoOff className="w-6 h-6 text-primary-foreground" /> : <Video className="w-6 h-6 text-foreground" />}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Tap the red button to end stream</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-bold">Go Live 🎥</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-4">
        {/* Camera preview */}
        <div className="aspect-video bg-secondary rounded-2xl flex items-center justify-center overflow-hidden relative">
          <div className="text-5xl">📷</div>
          <p className="absolute bottom-3 text-xs text-muted-foreground">Camera preview</p>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Stream Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's your stream about? 🔥"
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  category === cat ? 'gradient-fire text-primary-foreground' : 'glass text-muted-foreground border border-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold">Earn coins while live</span>
          </div>
          <p className="text-xs text-muted-foreground">Viewers can send you coin tips! Average streamer earns 200-500 coins per hour.</p>
        </div>

        <button
          onClick={() => title.trim() ? setStep('live') : undefined}
          disabled={!title.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            title.trim() ? 'gradient-fire text-primary-foreground glow-red' : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          Go Live Now 🔴
        </button>
      </div>
    </div>
  );
}

export default function LivePage() {
  const { liveStreams } = useAppStore();
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [activeCategory, setActiveCategory] = useState('All 🔥');
  const [showGoLive, setShowGoLive] = useState(false);

  if (activeStream) {
    return <StreamView stream={activeStream} onBack={() => setActiveStream(null)} />;
  }

  if (showGoLive) {
    return <GoLiveView onBack={() => setShowGoLive(false)} />;
  }

  const categories = ['All 🔥', 'Chill & Talk 💬', 'Flirt Lounge 🔥', 'Speed Dating ⚡'];
  const filteredStreams = activeCategory === 'All 🔥'
    ? liveStreams
    : liveStreams.filter(s => s.category === activeCategory.replace(/ 💬| 🔥| ⚡/g, ''));

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden px-4 pb-4">
      <div className="sticky top-0 pt-3 pb-4 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold mb-3">Live Now 🔴</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all border ${
                activeCategory === cat
                  ? 'gradient-fire text-primary-foreground border-transparent'
                  : 'glass border-border text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ad banner top */}
      <div className="mb-3">
        <AdBanner placement="live" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filteredStreams.map((stream, i) => (
          <motion.div
            key={stream.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <StreamCard stream={stream} onClick={() => setActiveStream(stream)} />
          </motion.div>
        ))}
      </div>

      {/* Ad between streams and go-live */}
      <div className="mt-3">
        <AdBanner placement="live" />
      </div>

      {/* Start your stream */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowGoLive(true)}
        className="mt-4 w-full glass border border-primary/30 rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-fire rounded-full flex items-center justify-center">🎥</div>
          <div className="text-left">
            <p className="font-semibold text-sm">Start your stream</p>
            <p className="text-xs text-muted-foreground">Go live and earn coins</p>
          </div>
        </div>
        <span className="text-primary">→</span>
      </motion.button>
    </div>
  );
}
