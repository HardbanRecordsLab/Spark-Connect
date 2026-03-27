import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/store/appStore';
import RewardedAd from '@/components/RewardedAd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const SUPER_SWIPE_STARTERS = [
  'Wyróżniasz się spośród wszystkich 🌟',
  'Coś mi mówi że powinniśmy porozmawiać 🔥',
  'Twój profil zatrzymał mnie w miejscu 💋',
  'Rzadko ktoś tak na mnie działa... 😏',
  'Chcę Cię poznać — mam przeczucie że warto 💫',
];

interface SuperSwipeModalProps {
  profile: Profile;
  dailyUsed: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
}

export function SuperSwipeModal({ profile, dailyUsed, onSend, onClose }: SuperSwipeModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  const canSend = !dailyUsed || adWatched;

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    onSend(message.trim());
    setSent(true);
    setSending(false);
  };

  return (
    <>
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

          <div className="px-5 pt-3">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 gap-3 text-center">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-6xl"
                  >
                    ⭐
                  </motion.div>
                  <h3 className="text-xl font-bold">Super Swipe wysłany!</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-semibold">{profile.displayName}</span> zobaczy Twoją wiadomość <span className="font-medium">zanim zdecyduje</span> czy Cię polubić.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                      <h2 className="font-bold">Super Swipe ⭐</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile preview */}
                  <div className="flex items-center gap-3 glass rounded-2xl p-3 mb-4 border border-accent/20">
                    <img src={profile.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{profile.displayName}, {profile.age}</p>
                      <p className="text-xs text-muted-foreground">{profile.city}</p>
                    </div>
                    <div className="ml-auto">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="glass border border-accent/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Twoja wiadomość pojawi się <span className="text-accent font-medium">zanim {profile.displayName} zdecyduje czy Cię polubić</span>. To Twoja szansa żeby się wyróżnić.
                    </p>
                  </div>

                  {/* Daily limit check */}
                  {dailyUsed && !adWatched && (
                    <div className="glass border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-400">Dzienny limit wyczerpany</p>
                        <p className="text-xs text-muted-foreground">Obejrzyj reklamę aby odblokować 3 dodatkowe</p>
                      </div>
                      <button
                        onClick={() => setShowAd(true)}
                        className="gradient-fire text-primary-foreground text-xs px-3 py-1.5 rounded-xl font-bold flex-shrink-0"
                      >
                        Odblokuj
                      </button>
                    </div>
                  )}

                  {/* Starter suggestions */}
                  <p className="text-xs text-muted-foreground mb-2">Gotowe frazy:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hidden">
                    {SUPER_SWIPE_STARTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setMessage(s)}
                        className="flex-shrink-0 glass text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Message input */}
                  <div className="glass rounded-2xl px-4 py-3 border border-border focus-within:border-accent/40 transition-colors mb-4">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Napisz co Cię przyciągnęło do tego profilu..."
                      rows={3}
                      maxLength={200}
                      disabled={!canSend}
                      className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground disabled:opacity-40"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{message.length}/200</span>
                      <Star className="w-3.5 h-3.5 text-accent" />
                    </div>
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending || !canSend}
                    className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {sending
                      ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <><Star className="w-4 h-4 fill-current" /> Wyślij Super Swipe</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Rewarded ad */}
      <AnimatePresence>
        {showAd && (
          <RewardedAd
            reward="super_like_x5"
            onComplete={() => { setAdWatched(true); setShowAd(false); }}
            onSkip={() => setShowAd(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
