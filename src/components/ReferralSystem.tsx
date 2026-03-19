import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share2, Gift, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Referral {
  id: string;
  code: string;
  completed_at: string | null;
  reward_given: boolean;
  created_at: string;
}

interface ReferralSystemProps {
  onClose?: () => void;
  inline?: boolean;
}

export default function ReferralSystem({ onClose, inline = false }: ReferralSystemProps) {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [myCode, setMyCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralLink = myCode ? `${window.location.origin}?ref=${myCode}` : '';
  const completedCount = referrals.filter(r => r.completed_at).length;
  const pendingCount = referrals.filter(r => !r.completed_at).length;

  useEffect(() => {
    if (!user) return;
    loadOrCreateCode();
  }, [user]);

  const loadOrCreateCode = async () => {
    if (!user) return;
    setLoading(true);

    // Check existing code
    const { data: existing } = await db
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: true });

    if (existing && existing.length > 0) {
      // First row is our own code (referee_id is null)
      const myRow = existing.find((r: Referral & { referee_id: string | null }) => r.referee_id === null);
      if (myRow) {
        setMyCode(myRow.code);
      }
      setReferrals(existing.filter((r: Referral & { referee_id: string | null }) => r.referee_id !== null));
    } else {
      // Create a new code
      const code = `SC${user.id.slice(0, 6).toUpperCase()}`;
      const { data: newRow } = await db
        .from('referrals')
        .insert({ referrer_id: user.id, code, referee_id: null })
        .select()
        .single();
      if (newRow) setMyCode(newRow.code);
      setReferrals([]);
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Dołącz do Spark Connect!',
        text: 'Polecam tę apkę randkową — całkowicie za darmo! Użyj mojego linku:',
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const content = (
    <div className={inline ? '' : 'px-5 pt-3'}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Zaproszeni', value: referrals.length, icon: '👥' },
          { label: 'Aktywni',    value: completedCount,    icon: '✅' },
          { label: 'Oczekuje',   value: pendingCount,      icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-lg font-black">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reward explanation */}
      <div className="glass rounded-2xl p-4 border border-primary/20 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Jak działają nagrody?</p>
        </div>
        <div className="space-y-1.5">
          {[
            { step: '1.', text: 'Twój znajomy rejestruje się przez Twój link' },
            { step: '2.', text: 'Uzupełnia profil i robi pierwszego swipe\'a' },
            { step: '3.', text: 'Ty dostajesz 7 dni "Kto mnie polubił" bez reklam' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-bold flex-shrink-0">{s.step}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Link share */}
      {loading ? (
        <div className="glass rounded-2xl p-4 animate-pulse mb-5">
          <div className="h-4 bg-secondary rounded w-3/4" />
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 mb-5 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Twój link polecający</p>
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5 mb-3">
            <span className="flex-1 text-xs font-mono truncate text-foreground/70">{referralLink}</span>
            <button onClick={handleCopy} className="flex-shrink-0">
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4 text-primary" /></motion.div>
                  : <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-4 h-4 text-muted-foreground" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="w-full gradient-fire text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Udostępnij link
          </button>
        </div>
      )}

      {/* Referral history */}
      {referrals.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">Historia poleconych</p>
          <div className="space-y-2">
            {referrals.map((r, i) => (
              <div key={r.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-fire flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Użytkownik #{i + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.completed_at ? (
                    <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                      Aktywny ✓
                    </span>
                  ) : (
                    <span className="text-xs glass text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                      Oczekuje
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 py-4 glass-strong border-b border-border">
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="font-bold">Zaproś znajomych</h2>
          <p className="text-xs text-muted-foreground">Zarabiaj nagrody za polecenia</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hidden">
        {content}
      </div>
    </motion.div>
  );
}
