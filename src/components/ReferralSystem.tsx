import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Trophy, Gift, Copy, Check, Star, Crown, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const MILESTONES = [
  { level: 1, threshold: 1, label: 'Pionier', icon: <Zap className="w-4 h-4" /> },
  { level: 2, threshold: 3, label: 'VIP', icon: <Star className="w-4 h-4" /> },
  { level: 3, threshold: 5, label: 'Elite', icon: <Crown className="w-4 h-4" /> },
  { level: 4, threshold: 10, label: 'Legenda', icon: <Trophy className="w-4 h-4" /> },
];

interface RecentReferral {
  displayName: string;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
}

interface ReferralStats {
  activeCount: number;
  totalCount: number;
  milestoneClaimed: number;
  nextThreshold: number | null;
  recent: RecentReferral[];
}

export default function ReferralSystem({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  const referralLink = user ? `${window.location.origin}/?ref=${user.id}` : '';

  const loadStats = useCallback(async () => {
    const { data, error } = await db.rpc('get_my_referral_stats');
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      setStats({
        activeCount: row.active_count,
        totalCount: row.total_count,
        milestoneClaimed: row.milestone_claimed,
        nextThreshold: row.next_threshold,
        recent: row.recent ?? [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadStats().then(async () => {
      // Auto-claim any milestone the user has newly earned -- no extra
      // click needed, the reward is just recognition of what already
      // happened server-side (unlike ad-watching, there's no effort to
      // gate behind a manual claim button here).
      const { data, error } = await db.rpc('claim_referral_milestones');
      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row.coins_awarded > 0) {
          const tier = MILESTONES.find(m => m.level === row.new_milestone);
          toast.success(`Nowa ranga: ${tier?.label ?? ''}! +${row.coins_awarded} coinów 🎉`);
          loadStats();
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link skopiowany do schowka! 🚀');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Spark Connect', text: 'Dołącz do mnie na Spark Connect 🔥', url: referralLink }); }
      catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const activeCount = stats?.activeCount ?? 0;
  const claimed = stats?.milestoneClaimed ?? 0;
  const currentThreshold = MILESTONES[claimed - 1]?.threshold ?? 0;
  const nextMilestone = MILESTONES.find(m => m.level === claimed + 1);
  const progressPct = nextMilestone
    ? Math.min(100, Math.round(((activeCount - currentThreshold) / (nextMilestone.threshold - currentThreshold)) * 100))
    : 100;
  const eliteReached = claimed >= 3;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center">
            <Crown className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter">Program Ambasadorski</h2>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">No Bots Policy</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 glass rounded-full flex items-center justify-center text-sm">✕</button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black gradient-text leading-none uppercase"
          >
            Budujmy Spark <br />Razem. Bez Botów.
          </motion.h1>
          <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
            Spark Connect to nowa aplikacja. Nie używamy botów, aby sztucznie wypełniać portal. Stawiamy na <strong>prawdziwych ludzi</strong>. Pomóż nam rosnąć i odbieraj nagrody!
          </p>
        </div>

        {/* Ambassador Elite status */}
        <div className="relative group">
          {eliteReached && (
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          )}
          <div className="relative glass-strong p-8 rounded-[2.5rem] border border-amber-500/30 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <Crown className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">
                  {eliteReached ? 'Ambassador Elite' : 'Zostań Ambasadorem'}
                </h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Nagroda Specjalna (Tylko Polecenia)</p>
              </div>
            </div>

            <p className="text-sm text-white/80 leading-relaxed mb-6">
              {eliteReached
                ? `Masz status Ambassador Elite dzięki ${activeCount} aktywnym poleceniom. Tego statusu nie da się kupić.`
                : <>Tego statusu nie kupisz. Możesz go tylko zdobyć. Zaproś <strong>5 osób</strong>, aby stać się częścią elity Spark Connect.</>}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-dark p-4 rounded-2xl border border-amber-500/20">
                <div className="text-xl mb-1">✨</div>
                <p className="text-[10px] font-black uppercase text-amber-500">Złota Ramka</p>
                <p className="text-[8px] text-white/40">Twój profil lśni w siatce Discover</p>
              </div>
              <div className="glass-dark p-4 rounded-2xl border border-amber-500/20">
                <div className="text-xl mb-1">📍</div>
                <p className="text-[10px] font-black uppercase text-amber-500">Priorytet</p>
                <p className="text-[8px] text-white/40">Widoczny jako pierwszy w okolicy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Progress */}
        <div className="glass-strong p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-20 h-20 text-primary" />
          </div>

          <h3 className="font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2 text-primary">
            <Gift className="w-4 h-4" /> Twoje postępy
          </h3>
          <p className="text-[11px] text-white/40 mb-6">
            {activeCount} aktywnych poleceń ({stats?.totalCount ?? 0} zaproszonych łącznie)
            {nextMilestone && ` · jeszcze ${nextMilestone.threshold - activeCount} do rangi ${nextMilestone.label}`}
          </p>

          <div className="space-y-6">
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MILESTONES.map(m => {
                const achieved = claimed >= m.level;
                return (
                  <div key={m.level} className={`flex flex-col items-center text-center gap-2 ${achieved ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${achieved ? 'border-amber-500 bg-amber-500/10' : 'border-white/10'}`}>
                      {achieved ? <Check className="w-4 h-4 text-amber-500" /> : m.icon}
                    </div>
                    <p className={`text-[8px] font-bold uppercase tracking-tighter leading-tight ${m.level === 3 ? 'text-amber-500' : ''}`}>{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm">Twój unikalny link</h3>
            <span className="text-[10px] font-black text-green-500 uppercase">Coiny za każdą rangę</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 glass px-5 py-4 rounded-2xl border border-white/10 text-xs text-white/40 truncate font-mono">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="w-14 h-14 gradient-fire rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all"
            >
              {copied ? <Check className="text-white" /> : <Copy className="text-white" />}
            </button>
          </div>

          <button onClick={handleShare} className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
            <Share2 className="w-5 h-5" /> UDOSTĘPNIJ LINK
          </button>
        </div>

        {/* Mission Card */}
        <div className="glass rounded-[2rem] p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-tight">Gwarancja "No Bots"</h4>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Większość portali randkowych używa botów, aby sprawiać wrażenie dużej ilości użytkowników. My tego nie robimy. Każdy profil na Spark Connect to realna osoba. Razem stwórzmy największą i najbardziej autentyczną społeczność adult w Polsce.
          </p>
        </div>

        {/* Recent Referrals (real) */}
        {stats && stats.recent.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40 px-2">Ostatnio zaproszeni</h3>
            <div className="space-y-2">
              {stats.recent.map((ref, i) => (
                <div key={i} className="glass px-4 py-3 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      <img src={ref.avatarUrl || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=80'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{ref.displayName}</p>
                      <p className="text-[10px] text-white/40">{new Date(ref.createdAt).toLocaleDateString('pl-PL')}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase ${ref.active ? 'text-green-500' : 'text-amber-500'}`}>
                    {ref.active ? 'Aktywny' : 'Oczekuje'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
