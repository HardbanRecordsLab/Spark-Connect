import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Crown, Coins, Check, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const SUPPORTERS = [
  { name: 'Marek W.', amount: 20, date: '2 days ago', emoji: '💎' },
  { name: 'Anonymous', amount: 5, date: '3 days ago', emoji: '❤️' },
  { name: 'Karolina B.', amount: 50, date: '1 week ago', emoji: '👑' },
  { name: 'Piotr K.', amount: 10, date: '1 week ago', emoji: '🔥' },
  { name: 'Anonymous', amount: 15, date: '2 weeks ago', emoji: '💕' },
];

const DONATION_OPTIONS = [
  { amount: 5, coins: 250, label: 'Coffee ☕', popular: false },
  { amount: 10, coins: 600, label: 'Pizza 🍕', popular: true },
  { amount: 20, coins: 1500, label: 'Supporter 💎', popular: false },
  { amount: 50, coins: 5000, label: 'Hero 👑', popular: false },
];

interface DonationPageProps {
  onClose: () => void;
}

export default function DonationPage({ onClose }: DonationPageProps) {
  const { currentUser, addCoins } = useAppStore();
  const [selected, setSelected] = useState(DONATION_OPTIONS[1]);
  const [step, setStep] = useState<'pick' | 'success'>('pick');
  const alreadyDonor = currentUser?.donorBadge;

  const handleDonate = () => {
    addCoins(selected.coins);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-7xl"
        >💖</motion.div>
        <div>
          <h2 className="text-2xl font-black gradient-text mb-2">Thank you so much!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You donated <strong>€{selected.amount}</strong> and received <strong>{selected.coins} coins</strong> + the exclusive <strong>Donor Badge 💎</strong>
          </p>
        </div>
        <div className="glass neon-border rounded-2xl p-4 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-accent" />
            <span className="font-bold text-accent">Donor Badge Earned!</span>
          </div>
          <p className="text-xs text-muted-foreground">Displayed on your profile. No more ads. Spark Connect. ❤️</p>
        </div>
        <button onClick={onClose} className="w-full gradient-fire text-primary-foreground py-4 rounded-2xl font-bold">
          Back to App 🔥
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-strong border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-bold">Support Spark Connect ❤️</h2>
          <p className="text-xs text-muted-foreground">100% voluntary · earns you coins + badge</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-5">
        {/* Hero */}
        <div className="glass rounded-2xl p-5 text-center neon-border">
          <div className="text-4xl mb-3">🔥</div>
          <h3 className="font-bold text-lg mb-2">Spark Connect is & will always be free</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No paywalls. No locked features. Your donation keeps the servers running, the developers fed, and the community alive. In return you get coins + the prestigious <span className="text-accent font-semibold">Donor Badge 💎</span>.
          </p>
        </div>

        {/* Already donor */}
        {alreadyDonor && (
          <div className="glass border border-accent/30 rounded-2xl p-4 flex items-center gap-3">
            <Crown className="w-6 h-6 text-accent" />
            <div>
              <p className="font-bold text-sm text-accent">You're already a Donor! 💎</p>
              <p className="text-xs text-muted-foreground">Thank you for your support. You can donate again for more coins.</p>
            </div>
          </div>
        )}

        {/* Amount picker */}
        <div>
          <h3 className="font-bold mb-3">Choose amount</h3>
          <div className="grid grid-cols-2 gap-3">
            {DONATION_OPTIONS.map(opt => (
              <motion.button
                key={opt.amount}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(opt)}
                className={`relative glass rounded-2xl p-4 text-center flex flex-col items-center gap-1.5 transition-all border-2 ${
                  selected.amount === opt.amount ? 'border-primary' : 'border-transparent'
                }`}
              >
                {opt.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 gradient-fire text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                    🔥 Popular
                  </span>
                )}
                <span className="text-xl font-black">€{opt.amount}</span>
                <span className="text-xs text-muted-foreground">{opt.label}</span>
                <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full">
                  <Coins className="w-3 h-3 text-accent" />
                  <span className="text-xs font-bold text-accent">+{opt.coins}</span>
                </div>
                {selected.amount === opt.amount && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div className="glass rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">You'll receive</h3>
          <div className="space-y-2">
            {[
              { icon: '💎', label: `Donor Badge on your profile`, sub: 'Permanent, shows you care' },
              { icon: '🪙', label: `${selected.coins} coins`, sub: 'Use for gifts, boosts & more' },
              { icon: '🚫', label: 'Ad-free experience', sub: 'No more banners' },
              { icon: '❤️', label: 'Listed on supporters wall', sub: 'Optional anonymity' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleDonate}
          className="w-full gradient-fire text-primary-foreground py-4 rounded-2xl font-bold text-base glow-red flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Donate €{selected.amount} via Ko-fi
          <ExternalLink className="w-4 h-4" />
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Secure payment via Ko-fi · 0% platform fee · No account required
        </p>

        {/* Supporters */}
        <div>
          <h3 className="font-bold mb-3">Top Supporters 🏆</h3>
          <div className="space-y-2">
            {SUPPORTERS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl">{s.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <span className="text-sm font-bold text-accent">€{s.amount}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
