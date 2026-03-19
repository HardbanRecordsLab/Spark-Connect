import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Send, X, Eye, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/store/appStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface WhisperModalProps {
  targetProfile: Profile;
  onClose: () => void;
  onSent: () => void;
}

const WHISPER_STARTERS = [
  'Mam dla Ciebie pewną propozycję... 😏',
  'Twoje zdjęcie zrobiło na mnie wrażenie 🔥',
  'Chciałbym/chciałabym Cię lepiej poznać 💋',
  'Masz coś co mnie przyciąga...',
  'Napisz do mnie jeśli jesteś ciekaw/a kim jestem 👀',
];

export function WhisperModal({ targetProfile, onClose, onSent }: WhisperModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim() || sending) return;
    setSending(true);

    await db.from('whisper_messages').insert({
      sender_id: user.id,
      receiver_id: targetProfile.id,
      message: message.trim(),
      is_revealed: false,
      created_at: new Date().toISOString(),
    });

    setSending(false);
    setSent(true);
    setTimeout(() => { onSent(); onClose(); }, 2000);
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
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-3">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="text-5xl">👻</div>
                <h3 className="text-xl font-bold">Szept wysłany!</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">{targetProfile.displayName}</span> zobaczy anonimową wiadomość.<br />
                  Gdy odpowie — możesz się ujawnić.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Ghost className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">Wyślij szept 👻</h2>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Target info */}
                <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-3 border border-primary/20">
                  <div className="relative">
                    <img src={targetProfile.photos[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border border-background">
                      <Ghost className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{targetProfile.displayName}</p>
                    <p className="text-xs text-muted-foreground">Nie zobaczy kto piszę — dopóki nie odpowie</p>
                  </div>
                </div>

                {/* Info badge */}
                <div className="glass border border-primary/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <Eye className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Twoja wiadomość pojawi się jako <span className="text-primary font-medium">"Ktoś do Ciebie napisał 💋"</span>. Kiedy odpowie — możesz zdecydować czy się ujawnić.
                  </p>
                </div>

                {/* Quick starters */}
                <p className="text-xs text-muted-foreground mb-2">Szybki start:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hidden">
                  {WHISPER_STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => setMessage(s)}
                      className="flex-shrink-0 glass text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Message input */}
                <div className="glass rounded-2xl px-4 py-3 border border-border focus-within:border-primary/40 transition-colors mb-4">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Napisz anonimową wiadomość..."
                    rows={3}
                    maxLength={200}
                    className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{message.length}/200</span>
                    <Ghost className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {sending
                    ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <><Ghost className="w-4 h-4" /> Wyślij anonimowo</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Whisper inbox item (in ChatsPage) ─────────────────────────
interface WhisperItemProps {
  whisper: { id: string; message: string; senderPhoto: string; createdAt: string; isRevealed: boolean; senderName?: string };
  onReveal: (id: string) => void;
  onReply: (id: string) => void;
}

export function WhisperItem({ whisper, onReveal, onReply }: WhisperItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10">
          <img
            src={whisper.isRevealed ? whisper.senderPhoto : 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&q=80'}
            alt=""
            className={`w-full h-full rounded-full object-cover ${!whisper.isRevealed ? 'blur-md' : ''}`}
          />
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <Ghost className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {whisper.isRevealed ? whisper.senderName : 'Anonimowy/a 👻'}
          </p>
          <p className="text-xs text-muted-foreground">{whisper.createdAt}</p>
        </div>
        <span className="text-xs glass px-2 py-0.5 rounded-full border border-primary/30 text-primary">Szept</span>
      </div>

      <p className="text-sm glass rounded-xl p-3 mb-3 italic">"{whisper.message}"</p>

      <div className="flex gap-2">
        {!whisper.isRevealed && (
          <button onClick={() => onReveal(whisper.id)}
            className="flex-1 glass border border-primary/30 text-primary py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Ujawnij kto pisał
          </button>
        )}
        <button onClick={() => onReply(whisper.id)}
          className="flex-1 gradient-fire text-primary-foreground py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Odpowiedz
        </button>
      </div>
    </motion.div>
  );
}
