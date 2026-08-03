import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';

export default function ResetPassword() {
  // noindex: this URL carries a one-time recovery token in the hash and must
  // never be indexable, or a shared/leaked link could expose it in search results.
  useSeo({ title: 'Reset hasła', description: 'Ustaw nowe hasło do Spark Connect.', noindex: true });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery session in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setIsRecovery(true);
    }

    // Listen for auth state — Supabase will set session from URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-radial-glow flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Password updated!</h2>
        <p className="text-muted-foreground text-sm">Redirecting you back to the app…</p>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-radial-glow flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-2xl font-bold mb-2">Invalid or expired link</h2>
        <p className="text-muted-foreground text-sm mb-6">Request a new password reset from the login page.</p>
        <button
          onClick={() => navigate('/')}
          className="gradient-fire text-primary-foreground font-bold px-8 py-3 rounded-2xl"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-glow flex flex-col px-6 pt-12 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 gradient-fire rounded-xl flex items-center justify-center">🔥</div>
        <span className="font-bold text-xl gradient-text">Spark Connect</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">New password 🔑</h1>
        <p className="text-muted-foreground mb-8">Choose a strong password for your account.</p>

        {error && (
          <div className="flex items-center gap-2 glass border border-destructive/40 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">New password</label>
            <div className="relative">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm password</label>
            <input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              type="password"
              required
              placeholder="Repeat password"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
