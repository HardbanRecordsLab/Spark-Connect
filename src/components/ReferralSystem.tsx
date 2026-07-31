import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Trophy, Gift, Copy, Check, Star, Crown, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralSystem({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://spark-connect.hardbanrecordslab.online/join?ref=user_${Math.random().toString(36).substring(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link skopiowany do schowka! 🚀');
    setTimeout(() => setCopied(false), 2000);
  };

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

        {/* Exclusive Elite Reward */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative glass-strong p-8 rounded-[2.5rem] border border-amber-500/30 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <Crown className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">Ambassador Elite</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Nagroda Specjalna (Tylko Polecenia)</p>
              </div>
            </div>
            
            <p className="text-sm text-white/80 leading-relaxed mb-6">
              Tego statusu nie kupisz. Możesz go tylko zdobyć. Zaproś <strong>5 osób</strong>, aby stać się częścią elity Spark Connect.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-dark p-4 rounded-2xl border border-amber-500/20">
                <div className="text-xl mb-1">✨</div>
                <p className="text-[10px] font-black uppercase text-amber-500">Złota Ramka</p>
                <p className="text-[8px] text-white/40">Twój profil będzie lśnić w siatce</p>
              </div>
              <div className="glass-dark p-4 rounded-2xl border border-amber-500/20">
                <div className="text-xl mb-1">💬</div>
                <p className="text-[10px] font-black uppercase text-amber-500">Free Whispers</p>
                <p className="text-[8px] text-white/40">Pisz do każdego bez limitu i matchu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Progress */}
        <div className="glass-strong p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-20 h-20 text-primary" />
          </div>
          
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 text-primary">
            <Gift className="w-4 h-4" /> Twoje postępy
          </h3>
          
          <div className="space-y-6">
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '20%' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[
                { count: 1, label: 'Pionier', icon: <Zap className="w-4 h-4" />, achieved: true },
                { count: 3, label: 'VIP 7d', icon: <Star className="w-4 h-4" />, achieved: false },
                { count: 5, label: 'ELITE CROWN', icon: <Crown className="w-4 h-4" />, achieved: false },
                { count: 10, label: 'Legend', icon: <Trophy className="w-4 h-4" />, achieved: false },
              ].map((m, i) => (
                <div key={i} className={`flex flex-col items-center text-center gap-2 ${m.achieved ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${m.achieved ? 'border-amber-500 bg-amber-500/10' : 'border-white/10'}`}>
                    {m.achieved ? <Check className="w-4 h-4 text-amber-500" /> : m.icon}
                  </div>
                  <p className={`text-[8px] font-bold uppercase tracking-tighter leading-tight ${m.count === 5 ? 'text-amber-500' : ''}`}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm">Twój unikalny link</h3>
            <span className="text-[10px] font-black text-green-500 uppercase">+100 SPARK COINS ZA OSOBĘ</span>
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
          
          <button className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
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

        {/* Recent Referrals (Mock) */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-white/40 px-2">Ostatnio zaproszeni</h3>
          <div className="space-y-2">
            {[
              { name: 'Marek_88', time: '2 godz. temu', status: 'Zweryfikowany' },
              { name: 'Kasia_Krk', time: 'Wczoraj', status: 'Oczekuje' },
            ].map((ref, i) => (
              <div key={i} className="glass px-4 py-3 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{ref.name}</p>
                    <p className="text-[10px] text-white/40">{ref.time}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase ${ref.status === 'Zweryfikowany' ? 'text-green-500' : 'text-amber-500'}`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
