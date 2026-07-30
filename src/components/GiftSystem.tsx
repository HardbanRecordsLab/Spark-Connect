import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Loader2 } from 'lucide-react';
import { useCoinBalance } from '@/hooks/useCoinBalance';

// ── Gift catalogue ─────────────────────────────────────────────────────────────

export interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  priceCoin: number;
  category: 'sweet' | 'hot' | 'luxury' | 'funny';
  color: string;
}

export const GIFTS: GiftItem[] = [
  // Sweet 🍬
  { id: 'rose',       emoji: '🌹', name: 'Rose',        priceCoin: 50,  category: 'sweet',  color: 'hsl(347 100% 65%)' },
  { id: 'heart',      emoji: '💖', name: 'Heart',       priceCoin: 30,  category: 'sweet',  color: 'hsl(320 80% 70%)' },
  { id: 'chocolate',  emoji: '🍫', name: 'Chocolate',   priceCoin: 40,  category: 'sweet',  color: 'hsl(25 60% 50%)' },
  { id: 'cake',       emoji: '🎂', name: 'Birthday',    priceCoin: 80,  category: 'sweet',  color: 'hsl(35 100% 65%)' },
  // Hot 🔥
  { id: 'fire',       emoji: '🔥', name: 'Fire',        priceCoin: 60,  category: 'hot',    color: 'hsl(15 100% 60%)' },
  { id: 'lightning',  emoji: '⚡', name: 'Lightning',   priceCoin: 70,  category: 'hot',    color: 'hsl(55 100% 65%)' },
  { id: 'devil',      emoji: '😈', name: 'Devil',       priceCoin: 90,  category: 'hot',    color: 'hsl(0 80% 55%)' },
  { id: 'kiss',       emoji: '💋', name: 'Kiss',        priceCoin: 55,  category: 'hot',    color: 'hsl(347 90% 60%)' },
  // Luxury 💎
  { id: 'diamond',    emoji: '💎', name: 'Diamond',     priceCoin: 500, category: 'luxury', color: 'hsl(200 100% 70%)' },
  { id: 'crown',      emoji: '👑', name: 'Crown',       priceCoin: 300, category: 'luxury', color: 'hsl(45 100% 60%)' },
  { id: 'champagne',  emoji: '🍾', name: 'Champagne',   priceCoin: 200, category: 'luxury', color: 'hsl(50 80% 65%)' },
  { id: 'ring',       emoji: '💍', name: 'Ring',        priceCoin: 400, category: 'luxury', color: 'hsl(200 80% 70%)' },
  // Funny 😂
  { id: 'clown',      emoji: '🤡', name: 'Clown',       priceCoin: 20,  category: 'funny',  color: 'hsl(35 90% 60%)' },
  { id: 'poop',       emoji: '💩', name: 'Poop',        priceCoin: 10,  category: 'funny',  color: 'hsl(30 50% 40%)' },
  { id: 'alien',      emoji: '👽', name: 'Alien',       priceCoin: 25,  category: 'funny',  color: 'hsl(130 60% 55%)' },
  { id: 'unicorn',    emoji: '🦄', name: 'Unicorn',     priceCoin: 150, category: 'funny',  color: 'hsl(280 80% 70%)' },
];

const CATEGORIES: { id: GiftItem['category'] | 'all'; label: string; emoji: string }[] = [
  { id: 'all',    label: 'All',    emoji: '🎁' },
  { id: 'sweet',  label: 'Sweet',  emoji: '🍬' },
  { id: 'hot',    label: 'Hot',    emoji: '🔥' },
  { id: 'luxury', label: 'Luxury', emoji: '💎' },
  { id: 'funny',  label: 'Funny',  emoji: '😂' },
];

// ── Gift Picker (sheet) ────────────────────────────────────────────────────────

interface GiftPickerProps {
  userId: string | null | undefined;
  onSend: (gift: GiftItem) => void;
  onClose: () => void;
}

export function GiftPicker({ userId, onSend, onClose }: GiftPickerProps) {
  const { balance: rawBalance, spend } = useCoinBalance(userId);
  const [category, setCategory] = useState<GiftItem['category'] | 'all'>('all');
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [insufficient, setInsufficient] = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = category === 'all' ? GIFTS : GIFTS.filter(g => g.category === category);
  const balance = rawBalance ?? 0;

  const handleConfirm = async () => {
    if (!selected || sending) return;
    if (balance < selected.priceCoin) {
      setInsufficient(true);
      setTimeout(() => setInsufficient(false), 2000);
      return;
    }
    setSending(true);
    // Server-side check is authoritative — the balance shown client-side
    // is only for UX, adjust_coin_balance rejects the spend atomically
    // if the real balance turns out to be insufficient (e.g. stale cache).
    const ok = await spend(selected.priceCoin, `gift:${selected.id}`);
    setSending(false);
    if (!ok) {
      setInsufficient(true);
      setTimeout(() => setInsufficient(false), 2000);
      return;
    }
    onSend(selected);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full glass-strong rounded-t-3xl border-t border-border max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <div className="font-bold">Send a Gift 🎁</div>
            <div className="text-xs text-muted-foreground">Balance: <span className="text-accent font-semibold">🪙 {balance}</span></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hidden">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                category === c.id ? 'gradient-fire text-primary-foreground' : 'glass text-muted-foreground'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((gift, i) => {
              const canAfford = balance >= gift.priceCoin;
              const isSelected = selected?.id === gift.id;
              return (
                <motion.button
                  key={gift.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(isSelected ? null : gift)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent glass hover:border-border'
                  } ${!canAfford ? 'opacity-40' : ''}`}
                >
                  <span className="text-2xl">{gift.emoji}</span>
                  <span className="text-xs font-medium leading-none">{gift.name}</span>
                  <span className="text-xs text-accent font-bold">🪙{gift.priceCoin}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Send button */}
        <div className="px-4 pb-6 pt-2">
          <AnimatePresence>
            {insufficient && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-destructive mb-2"
              >
                Not enough coins! Earn more by logging in daily 🪙
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleConfirm}
            disabled={!selected || sending}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              selected
                ? 'gradient-fire text-primary-foreground'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {selected ? `Send ${selected.emoji} ${selected.name} · 🪙${selected.priceCoin}` : 'Select a gift'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Fullscreen gift reveal ─────────────────────────────────────────────────────

interface GiftRevealProps {
  gift: GiftItem;
  senderName: string;
  onDismiss: () => void;
}

export function GiftReveal({ gift, senderName, onDismiss }: GiftRevealProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: `radial-gradient(ellipse at center, ${gift.color}33 0%, hsl(var(--background) / 0.97) 70%)` }}
      onClick={onDismiss}
    >
      {/* Sparkles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.cos((i / 12) * 2 * Math.PI) * (80 + Math.random() * 60),
            y: Math.sin((i / 12) * 2 * Math.PI) * (80 + Math.random() * 60),
          }}
          transition={{ delay: 0.3 + i * 0.05, duration: 1.2 }}
        >
          ✨
        </motion.div>
      ))}

      {/* Main emoji */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="text-8xl mb-6"
      >
        {gift.emoji}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <div className="text-2xl font-bold mb-1">{senderName} sent you a gift!</div>
        <div className="text-xl font-bold gradient-text">{gift.name} {gift.emoji}</div>
        <div className="text-muted-foreground text-sm mt-2">Tap anywhere to continue</div>
      </motion.div>
    </motion.div>
  );
}

// ── Gift message bubble ────────────────────────────────────────────────────────

export function GiftBubble({ gift, senderName }: { gift: GiftItem; senderName: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="glass border border-primary/20 rounded-2xl px-5 py-3 flex flex-col items-center gap-1 max-w-[200px]">
        <span className="text-3xl">{gift.emoji}</span>
        <span className="text-xs font-semibold">{senderName} sent</span>
        <span className="text-sm font-bold gradient-text">{gift.name}</span>
      </div>
    </div>
  );
}
