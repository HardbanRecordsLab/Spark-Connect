import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff, Loader2, AlertCircle, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import type { User } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useNavigate } from 'react-router-dom';
import ProfileWizard from './ProfileWizard';

type AuthStep = 'landing' | 'register' | 'login' | 'onboarding';

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.15 3.8.02 3.02 2.65 4.03 2.68 4.04l-.09.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 glass border border-destructive/40 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
      <span className="text-sm text-destructive">{msg}</span>
    </motion.div>
  );
}

// ── Native Supabase OAuth helper ──────────────────────────────
async function signInWithOAuth(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/` },
  });
  return { error };
}

// ── LANDING ───────────────────────────────────────────────────
function LandingView({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  const navigate = useNavigate();
  const profiles = [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  ];
  const features = [
    { emoji: '🎲', title: 'Spark Roulette', desc: '30-sekundowe randki wideo' },
    { emoji: '🧠', title: 'Chemistry Score', desc: 'Inteligentne dopasowywanie' },
    { emoji: '💬', title: 'Vibe Check', desc: 'Anonimowy podgląd 60s' },
    { emoji: '⚡', title: 'Speed Dating', desc: 'Wirtualne eventy co tydzień' },
  ];

  return (
    <div className="min-h-screen bg-radial-glow overflow-y-auto scrollbar-hidden">
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {profiles.map((src, i) => (
            <motion.div key={i} className="absolute rounded-2xl overflow-hidden"
              style={{ width: 80 + (i % 3) * 20, height: 100 + (i % 3) * 25, left: `${(i % 3) * 33 + 3}%`, top: `${Math.floor(i / 3) * 35 + 5}%`, opacity: 0.15 + (i % 4) * 0.05 }}
              animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: 'easeInOut' }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, hsl(240 15% 4% / 0.3) 0%, hsl(240 15% 4% / 0.95) 70%)' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="mb-6">
            <img src="/spark-connect-logo.png" alt="Spark Connect" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,26,78,0.5)]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-6xl font-black mb-3 gradient-text">Spark Connect</h1>
            <p className="text-xl text-foreground/80 font-medium mb-2">Gdzie chemia spotyka spontaniczność</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Darmowe randki wideo. Bez paywall. 18+</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-2 my-8 flex-wrap justify-center">
            {['🔥 100% Bezpłatna', '✓ Weryfikowane profile', '⚡ Speed Dating'].map((tag, i) => (
              <span key={i} className="text-xs glass px-3 py-1.5 rounded-full text-foreground/70">{tag}</span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-xs space-y-3">
            <button onClick={onRegister} className="w-full gradient-fire text-primary-foreground font-bold text-lg py-4 rounded-2xl glow-red flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_25px_-5px_rgba(255,26,78,0.5)]">
              Dołącz za darmo <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={onLogin} className="w-full glass text-foreground font-medium py-3 rounded-2xl border border-border hover:border-primary transition-all">
              Mam już konto
            </button>
          </motion.div>
          
          {/* Studio HRL Adult Branding - Luxury 4K HD Style */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="mt-12 flex flex-col items-center gap-5"
          >
            <div className="relative group">
              {/* Ultra-contrast animated glow background */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF1A4E] via-[#FFD700] to-[#FF1A4E] opacity-100 blur-md animate-pulse" />
              
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center p-0 shadow-[0_0_60px_rgba(255,215,0,0.4)] relative border-[3px] border-white overflow-hidden">
                <img 
                  src="/studio hrl adult.jpeg" 
                  alt="Studio HRL Adult" 
                  className="w-full h-full object-contain relative z-10 rounded-full mix-blend-multiply scale-125" 
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.5em] font-black italic opacity-80 mb-1">Owned by</p>
              <h2 className="text-2xl font-black gradient-luxury-text uppercase tracking-tighter italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                Studio HRL Adult
              </h2>
            </div>
          </motion.div>

          <p className="text-[10px] text-muted-foreground/60 mt-8 max-w-[250px] mx-auto leading-relaxed">
            Korzystając z serwisu akceptujesz nasz{' '}
            <button onClick={() => navigate('/terms')} className="text-primary/80 underline font-medium">Regulamin</button>
            {' oraz '}
            <button onClick={() => navigate('/privacy')} className="text-primary/80 underline font-medium">Politykę Prywatności</button>
            <br />
            Wszelkie prawa zastrzeżone © 2026 Studio HRL Adult
          </p>
        </div>
      </div>

      <div className="px-6 pb-16 space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">Dlaczego Spark? 🔥</h2>
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 gradient-fire rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{f.emoji}</div>
            <div><h3 className="font-bold">{f.title}</h3><p className="text-sm text-muted-foreground">{f.desc}</p></div>
          </motion.div>
        ))}
        <div className="glass rounded-2xl p-5 text-center mt-6">
          <p className="text-4xl mb-3">💖</p>
          <h3 className="font-bold mb-1">Spark Connect jest i zawsze będzie bezpłatny</h3>
          <p className="text-sm text-muted-foreground">Wspierany reklamami. Żadnych ukrytych opłat.</p>
        </div>
      </div>
    </div>
  );
}

// ── REGISTER ─────────────────────────────────────────────────
function RegisterView({ onSuccess, onLogin }: { onSuccess: () => void; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreedAdult, setAgreedAdult] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);
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

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const { error: err } = await signInWithOAuth('google');
    if (err) { setError(err.message); setLoading(false); }
    // On success: Supabase redirects, onAuthStateChange handles the rest
  };

  const handleApple = async () => {
    setLoading(true); setError('');
    const { error: err } = await signInWithOAuth('apple');
    if (err) { setError(err.message); setLoading(false); }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-radial-glow">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <div className="text-6xl mb-4">📧</div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Sprawdź skrzynkę</h2>
        <p className="text-muted-foreground text-sm mb-2">Wysłaliśmy link weryfikacyjny na</p>
        <p className="font-semibold text-primary mb-8">{email}</p>
        <button onClick={onSuccess} className="gradient-fire text-primary-foreground font-bold px-8 py-4 rounded-2xl glow-red">
          Zweryfikowałem/am email ✓
        </button>
        <button onClick={() => setStep('form')} className="mt-4 text-sm text-muted-foreground">Wróć</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-radial-glow px-6 pt-12 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <img src="/spark-connect-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-xl gradient-text">Spark Connect</span>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">Dołącz do Spark 🔥</h1>
        <p className="text-muted-foreground mb-8">Bezpłatnie. Bez karty kredytowej.</p>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-5" style={{ background: 'rgba(91,141,240,.07)', border: '1px solid rgba(91,141,240,.2)' }}>
          <span className="text-base">🔒</span>
          <span className="text-xs text-muted-foreground">Bez logowania Google ani Apple — celowo. Twoje dane nie trafiają do Big Tech.</span>
        </div>

        {error && <ErrorAlert msg={error} />}

        <form onSubmit={handleRegister} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="twoj@email.com"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Hasło</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Min. 8 znaków"
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={() => setAgreed(v => !v)}
              className={`w-full flex items-start gap-3 glass rounded-xl p-3 text-left transition-all ${agreed ? 'border border-primary/40 bg-primary/5' : 'border border-border'}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'gradient-fire' : 'border border-border'}`}>
                {agreed && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Akceptuję <a href="/terms" target="_blank" className="text-primary underline">Regulamin</a> i <a href="/privacy" target="_blank" className="text-primary underline">Politykę Prywatności</a>
              </p>
            </button>

            <button type="button" onClick={() => setAgreedAdult(v => !v)}
              className={`w-full flex items-start gap-3 glass rounded-xl p-3 text-left transition-all ${agreedAdult ? 'border border-primary/40 bg-primary/5' : 'border border-border'}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreedAdult ? 'gradient-fire' : 'border border-border'}`}>
                {agreedAdult && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground font-bold">
                Oświadczam, że mam ukończone 18 lat i chcę oglądać treści dla dorosłych 🔞
              </p>
            </button>

            <button type="button" onClick={() => setAgreedMarketing(v => !v)}
              className={`w-full flex items-start gap-3 glass rounded-xl p-3 text-left transition-all ${agreedMarketing ? 'border border-primary/40 bg-primary/5' : 'border border-border'}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreedMarketing ? 'gradient-fire' : 'border border-border'}`}>
                {agreedMarketing && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                (Opcjonalnie) Zgadzam się na otrzymywanie powiadomień o nowych dopasowaniach i promocjach od Studio HRL Adult.
              </p>
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Utwórz konto za darmo'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Masz już konto?{' '}
          <button onClick={onLogin} className="text-primary font-semibold">Zaloguj się</button>
        </p>
      </motion.div>
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────
function LoginView({ onSuccess, onRegister }: { onSuccess: () => void; onRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const { error: err } = await signInWithOAuth('google');
    if (err) { setError(err.message); setLoading(false); }
  };

  const handleApple = async () => {
    setLoading(true); setError('');
    const { error: err } = await signInWithOAuth('apple');
    if (err) { setError(err.message); setLoading(false); }
  };

  const handleReset = async () => {
    if (!resetEmail) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false); setResetSent(true);
  };

  if (showReset) {
    return (
      <div className="min-h-screen flex flex-col bg-radial-glow px-6 pt-12 pb-8">
        <button onClick={() => setShowReset(false)} className="text-muted-foreground mb-8 flex items-center gap-1 text-sm">← Wróć</button>
        <h1 className="text-2xl font-black mb-2">Resetuj hasło 🔑</h1>
        <p className="text-muted-foreground text-sm mb-6">Podaj email, a wyślemy Ci link resetujący.</p>
        {resetSent ? (
          <div className="glass border border-primary/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="font-semibold">Sprawdź skrzynkę</p>
            <p className="text-sm text-muted-foreground mt-1">Link wysłany na {resetEmail}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} type="email" placeholder="twoj@email.com"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            <button onClick={handleReset} disabled={loading || !resetEmail} className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Wyślij link'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-radial-glow px-6 pt-12 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <img src="/spark-connect-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-xl gradient-text">Spark Connect</span>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">Witaj z powrotem 🔥</h1>
        <p className="text-muted-foreground mb-8">Gotowy/a na nowe połączenia?</p>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-5" style={{ background: 'rgba(91,141,240,.07)', border: '1px solid rgba(91,141,240,.2)' }}>
          <span className="text-base">🔒</span>
          <span className="text-xs text-muted-foreground">Bez logowania Google ani Apple — celowo. Twoje dane nie trafiają do Big Tech.</span>
        </div>

        {error && <ErrorAlert msg={error} />}

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input 
              name="email"
              id="login-email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email" 
              required 
              placeholder="twoj@email.com"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors" 
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Hasło</label>
            <div className="relative">
              <input 
                name="password"
                id="login-password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="Twoje hasło"
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors pr-12" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <button type="button" onClick={() => setShowReset(true)} className="text-xs text-primary">Zapomniałem/am hasła?</button>
          </div>
          <button type="submit" disabled={loading} className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red text-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Zaloguj się'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Nie masz konta?{' '}
          <button onClick={onRegister} className="text-primary font-semibold">Dołącz za darmo</button>
        </p>
      </motion.div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────
function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState({
    display_name: '', age: '', gender: '', orientation: '',
    relationship_type: 'both',
    bio: '',
  });

  const { upload: uploadToR2 } = useR2Upload();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const handleComplete = async () => {
    if (loading) return; // Prevent double clicks
    console.log('Starting onboarding completion...', { step, data, avatarFile: !!avatarFile });
    setLoading(true);
    
    // Safety timeout: if it takes more than 30s, something is wrong
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.error('Onboarding timed out');
        toast.error('Przekroczono czas oczekiwania. Spróbuj ponownie lub odśwież stronę.');
      }
    }, 30000);
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <ProfileWizard />
    </motion.div>
  );
}


// ── MAIN ─────────────────────────────────────────────────────
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
          // BUG FIX: usunięto zduplikowane wywołanie setView — wystarczy jedno
          if (!profile.profile_complete) {
            setStep('onboarding');
          } else {
            setView('app');
          }
        } else {
          // Jeśli profil nie istnieje (np. świeża rejestracja), przechodzimy do onboarding
          setStep('onboarding');
        }
      }
      setCheckingSession(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) setCheckingSession(false); });
    return () => subscription.unsubscribe();
  }, [setView, setCurrentUser]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-radial-glow flex items-center justify-center">
        <div className="text-center">
          <img src="/spark-connect-logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,26,78,0.5)]" />
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'landing' && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingView onRegister={() => setStep('register')} onLogin={() => setStep('login')} />
        </motion.div>
      )}
      {step === 'register' && (
        <motion.div key="register" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
          <RegisterView onSuccess={() => setStep('onboarding')} onLogin={() => setStep('login')} />
        </motion.div>
      )}
      {step === 'login' && (
        <motion.div key="login" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
          <LoginView onSuccess={() => setStep('onboarding')} onRegister={() => setStep('register')} />
        </motion.div>
      )}
      {step === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
          <OnboardingView onComplete={() => setView('app')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
