import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, Check, X, Eye, Ban, AlertTriangle,
  Users, Clock, RefreshCw, LogOut, ChevronDown, Filter,
  Flame, Mail, Calendar, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'spark-connect@hardbanrecordslab.online';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type VerifyStatus = 'pending' | 'approved' | 'rejected' | 'all';

interface PendingUser {
  id: string;
  display_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  bio: string | null;
  photos: string[];
  avatar_url: string;
  is_verified: boolean;
  admin_approved: boolean | null;
  admin_rejected: boolean | null;
  rejection_reason: string | null;
  created_at: string;
  profile_complete: boolean;
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`glass rounded-2xl p-4 border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── User card ─────────────────────────────────────────────────
function UserCard({
  user,
  onApprove,
  onReject,
  onBan,
}: {
  user: PendingUser;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onBan: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = user.photos?.length ? user.photos : user.avatar_url ? [user.avatar_url] : [];
  const statusBadge = user.admin_approved
    ? { label: 'Zatwierdzony', cls: 'bg-green-500/20 text-green-400 border-green-500/30' }
    : user.admin_rejected
    ? { label: 'Odrzucony', cls: 'bg-destructive/20 text-destructive border-destructive/30' }
    : { label: '⏳ Oczekuje', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden border border-border"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Photo */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
          {photos.length > 0 ? (
            <img src={photos[photoIndex]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-0.5 right-0.5 bg-background/80 rounded px-1 text-xs">
              {photoIndex + 1}/{photos.length}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{user.display_name || 'Bez nazwy'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {user.age && <span>👤 {user.age} lat</span>}
            {user.gender && <span>· {user.gender}</span>}
            {user.city && <span>· 📍 {user.city}</span>}
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="w-8 h-8 glass rounded-full flex items-center justify-center flex-shrink-0">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-3">
              {/* All photos */}
              {photos.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Zdjęcia ({photos.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                    {photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt=""
                        onClick={() => setPhotoIndex(i)}
                        className={`h-24 w-20 object-cover rounded-xl flex-shrink-0 cursor-pointer transition-all ${photoIndex === i ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm glass rounded-xl p-3">{user.bio}</p>
                </div>
              )}

              {/* Rejection reason */}
              {user.admin_rejected && user.rejection_reason && (
                <div className="glass border border-destructive/30 rounded-xl p-3">
                  <p className="text-xs text-destructive font-semibold mb-1">Powód odrzucenia</p>
                  <p className="text-sm text-muted-foreground">{user.rejection_reason}</p>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(user.created_at).toLocaleDateString('pl-PL')}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </span>
              </div>

              {/* Reject form */}
              <AnimatePresence>
                {showRejectForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="space-y-2">
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Powód odrzucenia (np. fałszywe zdjęcia, bot, niepełnoletni)..."
                      rows={3}
                      className="w-full glass rounded-xl px-3 py-2 text-sm outline-none border border-destructive/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowRejectForm(false)} className="flex-1 glass py-2 rounded-xl text-sm">Anuluj</button>
                      <button
                        onClick={() => { onReject(user.id, reason); setShowRejectForm(false); }}
                        disabled={!reason.trim()}
                        className="flex-1 bg-destructive text-destructive-foreground py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                      >
                        Odrzuć
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {!user.admin_approved && !user.admin_rejected && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(user.id)}
                    className="flex-1 gradient-fire text-primary-foreground py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Zatwierdź
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 bg-destructive/20 text-destructive border border-destructive/30 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Odrzuć
                  </button>
                </div>
              )}

              {/* Re-review approved/rejected */}
              {(user.admin_approved || user.admin_rejected) && (
                <div className="flex gap-2">
                  {!user.admin_approved && (
                    <button onClick={() => onApprove(user.id)} className="flex-1 gradient-fire text-primary-foreground py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Zatwierdź
                    </button>
                  )}
                  {!user.admin_rejected && (
                    <button onClick={() => setShowRejectForm(true)} className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                      <X className="w-3.5 h-3.5" /> Odrzuć
                    </button>
                  )}
                  <button onClick={() => onBan(user.id)} className="w-10 h-10 bg-destructive/20 text-destructive border border-destructive/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Ban always available */}
              {!user.admin_approved && !user.admin_rejected && (
                <button onClick={() => onBan(user.id)} className="w-full glass border border-destructive/20 text-destructive py-2 rounded-xl text-sm flex items-center justify-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Zablokuj konto
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<PendingUser[]>([]);
  const [filter, setFilter] = useState<VerifyStatus>('pending');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // ── Auth ────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || data.user?.email !== ADMIN_EMAIL) {
      setLoginError('Brak dostępu. Tylko administrator może zalogować się tutaj.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setAuthed(true);
    setLoading(false);
    loadUsers();
  };

  // ── Load users ──────────────────────────────────────────────
  const loadUsers = async () => {
    setRefreshing(true);
    const { data } = await db
      .from('profiles')
      .select('id, display_name, age, gender, city, bio, photos, avatar_url, is_verified, admin_approved, admin_rejected, rejection_reason, created_at, profile_complete')
      .eq('profile_complete', true)
      .order('created_at', { ascending: false });

    // Fetch emails from auth.users via admin API is not possible client-side,
    // so we join with a view or use auth metadata if available
    const enriched: PendingUser[] = (data ?? []).map((p: PendingUser) => ({
      ...p,
      email: `user_${p.id.slice(0, 6)}@spark.app`, // placeholder — real email via admin API
    }));

    setUsers(enriched);
    setStats({
      total: enriched.length,
      pending: enriched.filter(u => !u.admin_approved && !u.admin_rejected).length,
      approved: enriched.filter(u => u.admin_approved).length,
      rejected: enriched.filter(u => u.admin_rejected).length,
    });
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    await db.from('profiles').update({ admin_approved: true, admin_rejected: false, rejection_reason: null }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, admin_approved: true, admin_rejected: false } : u));
    setStats(s => ({ ...s, pending: s.pending - 1, approved: s.approved + 1 }));
  };

  const handleReject = async (id: string, reason: string) => {
    await db.from('profiles').update({ admin_rejected: true, admin_approved: false, rejection_reason: reason }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, admin_rejected: true, admin_approved: false, rejection_reason: reason } : u));
    setStats(s => ({ ...s, pending: s.pending - 1, rejected: s.rejected + 1 }));
  };

  const handleBan = async (id: string) => {
    if (!confirm('Na pewno zablokować to konto? Akcja jest nieodwracalna.')) return;
    // Mark as rejected with ban reason + could invoke edge function to delete auth user
    await db.from('profiles').update({ admin_rejected: true, rejection_reason: 'Konto zablokowane przez administratora' }).eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.city || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filter === 'all' ? true :
      filter === 'pending' ? (!u.admin_approved && !u.admin_rejected) :
      filter === 'approved' ? u.admin_approved :
      filter === 'rejected' ? u.admin_rejected :
      true;

    return matchSearch && matchStatus;
  });

  // ── Login screen ────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-radial-glow flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 gradient-fire rounded-2xl flex items-center justify-center mb-4 glow-red">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black">Panel Administratora</h1>
            <p className="text-sm text-muted-foreground mt-1">Spark Connect · Tylko dla admina</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 glass border border-destructive/40 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{loginError}</span>
              </motion.div>
            )}
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email" required autoComplete="email"
              placeholder="Admin email"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password" required
              placeholder="Hasło"
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors"
            />
            <button type="submit" disabled={loading}
              className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                : <><Shield className="w-4 h-4" /> Zaloguj</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-strong border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-fire rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Spark Connect 18+</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadUsers} disabled={refreshing}
              className="w-9 h-9 glass rounded-xl flex items-center justify-center">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>
            <button onClick={() => { supabase.auth.signOut(); setAuthed(false); }}
              className="w-9 h-9 glass rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Wszyscy" value={stats.total} icon="👥" color="border-border" />
          <StatCard label="Oczekuje" value={stats.pending} icon="⏳" color="border-amber-500/30" />
          <StatCard label="Zatwierdzeni" value={stats.approved} icon="✅" color="border-green-500/30" />
          <StatCard label="Odrzuceni" value={stats.rejected} icon="❌" color="border-destructive/30" />
        </div>

        {/* Pending alert */}
        {stats.pending > 0 && (
          <motion.div
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="glass border border-amber-500/40 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-400">{stats.pending} profili czeka na weryfikację</p>
              <p className="text-xs text-muted-foreground">Sprawdź zdjęcia i zatwierdź lub odrzuć</p>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po imieniu, emailu, mieście..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-secondary rounded-2xl p-1.5">
          {([
            { v: 'pending', l: '⏳ Oczekuje', count: stats.pending },
            { v: 'approved', l: '✅ Zatwierdzeni', count: stats.approved },
            { v: 'rejected', l: '❌ Odrzuceni', count: stats.rejected },
            { v: 'all', l: '👥 Wszyscy', count: stats.total },
          ] as { v: VerifyStatus; l: string; count: number }[]).map(tab => (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v)}
              className={`flex-1 text-xs font-medium py-2 px-1 rounded-xl transition-all ${
                filter === tab.v
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.l}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === tab.v ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Users list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-muted-foreground">
                {filter === 'pending' ? 'Brak profili oczekujących' : 'Brak wyników'}
              </p>
            </div>
          ) : (
            filtered.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onApprove={handleApprove}
                onReject={handleReject}
                onBan={handleBan}
              />
            ))
          )}
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Spark Connect Admin · {ADMIN_EMAIL}</p>
        </div>
      </div>
    </div>
  );
}
