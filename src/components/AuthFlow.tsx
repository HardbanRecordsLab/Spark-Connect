import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff, Loader2, AlertCircle, Shield, Coins, UserCheck } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { User } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import ProfileWizard from './ProfileWizard';

type AuthStep = 'landing' | 'register' | 'login' | 'onboarding';

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 glass border border-destructive/40 rounded-xl px-4 py-3 my-2">
      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
      <span className="text-sm text-destructive">{msg}</span>
    </motion.div>
  );
}

// ── LANDING VIEW (SEX DATING PORTAL STYLE) ─────────────────────────
function LandingView({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const db = supabase as any;
    db.rpc('get_online_users_count').then(({ data }: { data: number | null }) => {
      if (!cancelled && typeof data === 'number') setOnlineCount(data);
    });
    return () => { cancelled = true; };
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Background Image Wrapper */}
      <div className="fixed inset-0 z-0">
        <img 
          src="spark_connect_sensual_adult_bg_1778594594092.png" 
          alt="" 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Portal Header */}
      <header className="relative z-20 px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/spark-connect-logo.png" alt="Spark Connect" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,26,78,0.6)]" />
          <span className="text-2xl font-black tracking-tighter gradient-text uppercase italic">Spark Connect</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLogin} className="text-sm font-bold hover:text-primary transition-colors hidden sm:block">Zaloguj się</button>
          <button onClick={onRegister} className="gradient-fire px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Dołącz bezpłatnie</button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Value Proposition */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {onlineCount !== null && onlineCount > 0 && (
                <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(255,26,78,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400">{onlineCount} {onlineCount === 1 ? 'OSOBA' : 'OSÓB'} ONLINE TERAZ</span>
                </div>
              )}
              <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase italic">
                CONNECT. <br />
                <span className="gradient-text">FUCK.</span> <br />
                REPEAT.
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-md leading-tight font-medium">
                <span className="text-primary font-bold italic">Dyskretnie. Szybko. Bez pytań.</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="grid sm:grid-cols-3 gap-6"
            >
              {[
                { icon: <Coins className="text-primary fill-primary w-5 h-5" />, label: 'Zero Opłat', desc: 'Reklama = Token. Bez karty.' },
                { icon: <UserCheck className="text-primary w-5 h-5" />, label: 'Zero Botów', desc: 'Tylko realni, zdecydowani.' },
                { icon: <Shield className="text-primary w-5 h-5" />, label: 'Dyskrecja', desc: '100% Prywatnie' },
              ].map((item, i) => (
                <div key={i} className="space-y-2 p-4 glass rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">{item.icon}</div>
                  <p className="text-sm font-black uppercase italic">{item.label}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Side: Quick Action Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }}
            className="lg:ml-auto w-full max-w-md"
          >
            <div className="glass-strong p-10 rounded-[3rem] border border-primary/30 shadow-[0_0_50px_rgba(255,26,78,0.2)] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full" />
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Wchodzisz na własną odpowiedzialność</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <h2 className="text-4xl font-black mb-8 italic uppercase tracking-tighter text-white">Gotowy na <br /><span className="text-primary">Ogień? 🔥</span></h2>
              
              <div className="space-y-5">
                <button 
                  onClick={onRegister}
                  className="w-full gradient-fire text-white font-black py-6 rounded-2xl text-xl uppercase tracking-widest shadow-[0_10px_40px_rgba(255,26,78,0.4)] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-4"
                >
                  WEJDŹ TERAZ <ArrowRight className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={onLogin}
                  className="w-full glass py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] border border-white/10 hover:bg-white/5 transition-all text-white/60"
                >
                  MAM JUŻ KONTO
                </button>
              </div>

              <p className="mt-8 text-center text-[9px] text-white/30 font-black uppercase tracking-widest leading-relaxed">
                Wchodząc potwierdzasz ukończenie 18 lat <br /> i akceptujesz zmysłowy charakter portalu.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/80 backdrop-blur-md pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/spark-connect-logo.png" alt="" className="w-8 h-8 object-contain" />
              <span className="text-xl font-black gradient-text uppercase italic">Spark Connect</span>
            </div>
            <p className="text-sm text-white/40 max-w-sm">
              Najodważniejszy portal dla dorosłych szukających autentycznych połączeń bez tabu. Owned by Studio HRL Adult.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Serwis</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><button onClick={() => navigate('/about')} className="hover:text-primary transition-colors">O nas</button></li>
              <li><button onClick={() => navigate('/safety')} className="hover:text-primary transition-colors">Bezpieczeństwo</button></li>
              <li><button onClick={() => navigate('/premium-info')} className="hover:text-primary transition-colors">Premium</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Prawne</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Regulamin</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Prywatność</button></li>
              <li><button onClick={() => navigate('/gdpr')} className="hover:text-primary transition-colors">Rodo</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">
            Wszelkie prawa zastrzeżone © 2026 Studio HRL Adult
          </p>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] animate-pulse">Uwaga: Tylko dla dorosłych</span>
              <div className="px-6 py-2 glass border border-red-500/50 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <span className="text-2xl font-black text-red-500 italic">18+ ADULT ONLY</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/40 px-2 py-1 glass rounded-lg uppercase tracking-widest">Spark v2.0-Elite / Studio HRL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── REGISTER VIEW ─────────────────────────────────────────────
function RegisterView({ onSuccess, onLogin }: { onSuccess: () => void; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreedAdult, setAgreedAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !agreedAdult) { setError('Zaakceptuj wymagane zgody'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('verify');
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-black">
        <div className="max-w-md w-full glass-strong p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Sprawdź email!</h2>
          <p className="text-white/60 text-base mb-8 italic">Wysłaliśmy link weryfikacyjny. Kliknij go, aby odblokować portal i zacząć przygodę.</p>
          <button 
            onClick={onSuccess} 
            className="w-full gradient-fire text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            Zweryfikowałem/am ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] -z-10 rounded-full" />

      <div className="max-w-xl w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/spark-connect-logo.png" alt="" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black gradient-text uppercase italic">Spark Connect</span>
          </div>
          <button onClick={onLogin} className="text-xs font-bold text-white/40 hover:text-primary transition-colors">MAM JUŻ KONTO</button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-10 rounded-[3rem] border border-white/10 shadow-2xl"
        >
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">Dołącz do nas 🔥</h1>
          <p className="text-white/40 mb-8 font-bold italic uppercase tracking-widest text-[10px]">Prywatność. Dyskrecja. Czysta erotyka.</p>

          {error && <ErrorAlert msg={error} />}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Twój Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="twoj@email.com"
                  className="w-full glass rounded-2xl px-6 py-4 text-sm border border-white/5 focus:border-primary outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Hasło</label>
                <div className="relative">
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Min. 8 znaków"
                    className="w-full glass rounded-2xl px-6 py-4 text-sm border border-white/5 focus:border-primary outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => setAgreed(v => !v)}
                className={`w-full flex items-start gap-4 glass rounded-2xl p-4 text-left transition-all ${agreed ? 'border-primary/40 bg-primary/5' : 'border-white/5'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'gradient-fire' : 'border border-white/10'}`}>
                  {agreed && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs text-white/60 leading-relaxed uppercase font-bold tracking-tighter">Akceptuję Regulamin 18+</p>
              </button>
              
              <button type="button" onClick={() => setAgreedAdult(v => !v)}
                className={`w-full flex items-start gap-4 glass rounded-2xl p-4 text-left transition-all ${agreedAdult ? 'border-primary/40 bg-primary/5' : 'border-white/5'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreedAdult ? 'gradient-fire' : 'border border-white/10'}`}>
                  {agreedAdult && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs font-black text-white/80 leading-relaxed uppercase tracking-tight">Oświadczam, że mam ukończone 18 lat 🔞</p>
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full gradient-fire text-white font-black py-5 rounded-2xl text-lg uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'STWÓRZ PROFIL 🔥'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// ── LOGIN VIEW ───────────────────────────────────────────────
function LoginView({ onSuccess, onRegister }: { onSuccess: () => void; onRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-10">
          <img src="/spark-connect-logo.png" alt="" className="w-16 h-16 mb-4 drop-shadow-[0_0_20px_rgba(255,26,78,0.6)]" />
          <h1 className="text-3xl font-black gradient-text uppercase italic tracking-tighter">Witaj w klubie</h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-10 rounded-[2.5rem] border border-white/10 shadow-2xl"
        >
          {error && <ErrorAlert msg={error} />}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Twój Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="twoj@email.com"
                className="w-full glass rounded-2xl px-6 py-4 text-sm border border-white/5 focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60">Hasło</label>
                <button type="button" className="text-[10px] text-primary/60 font-bold uppercase hover:text-primary transition-colors">Odzyskaj</button>
              </div>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="********"
                  className="w-full glass rounded-2xl px-6 py-4 text-sm border border-white/5 focus:border-primary outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full gradient-fire text-white font-black py-5 rounded-2xl text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ZALOGUJ SIĘ'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-white/40 font-bold uppercase tracking-tighter">
            Nie masz konta? <button onClick={onRegister} className="text-primary hover:underline">Dołącz teraz 🔥</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── MAIN AUTH FLOW ───────────────────────────────────────────
export default function AuthFlow() {
  const { setView, setCurrentUser } = useAppStore();
  const [step, setStep] = useState<AuthStep>('landing');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) {
          const appUser: User = {
            id: profile.id,
            displayName: profile.display_name || session.user.email?.split('@')[0] || 'User',
            age: profile.age || 25,
            gender: profile.gender || '',
            orientation: profile.orientation || '',
            bio: profile.bio || '',
            avatarUrl: profile.avatar_url || '',
            isVerified: profile.is_verified,
            donorBadge: false,
            coinBalance: 0,
            moodStatus: profile.mood_status,
            location: { city: profile.city || 'Warsaw' },
            interests: profile.interests || [],
            photos: profile.photos?.length ? profile.photos : [profile.avatar_url || ''],
            relationshipType: profile.relationship_type || 'both',
            profileComplete: profile.profile_complete,
          };
          setCurrentUser(appUser);
          if (!profile.profile_complete) { setStep('onboarding'); } 
          else { setView('app'); }
        } else {
          setStep('onboarding');
        }
      } else {
        setCheckingSession(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) setCheckingSession(false); });
    return () => subscription.unsubscribe();
  }, [setView, setCurrentUser]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img src="/spark-connect-logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-6 drop-shadow-[0_0_20px_rgba(255,26,78,0.6)] animate-pulse" />
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'landing' && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <LandingView onRegister={() => setStep('register')} onLogin={() => setStep('login')} />
        </motion.div>
      )}
      {step === 'register' && (
        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <RegisterView onSuccess={() => setStep('onboarding')} onLogin={() => setStep('login')} />
        </motion.div>
      )}
      {step === 'login' && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <LoginView onSuccess={() => setStep('onboarding')} onRegister={() => setStep('register')} />
        </motion.div>
      )}
      {step === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <div className="min-h-screen bg-black overflow-y-auto pt-10 pb-20 px-4">
             <ProfileWizard />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
