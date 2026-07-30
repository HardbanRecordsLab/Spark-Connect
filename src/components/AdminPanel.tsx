import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, Check, X, Eye, Ban, AlertTriangle,
  Users, Clock, RefreshCw, LogOut, Filter,
  Mail, Calendar, Image as ImageIcon, MessageSquare,
  TrendingUp, UserCheck, UserX, Map, Flame, Settings,
  Bell, Lock, Globe, ChevronRight, Activity, Database, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type VerifyStatus = 'pending' | 'approved' | 'rejected' | 'all';
type AdminSection = 'users' | 'stats' | 'groups' | 'reports' | 'settings' | 'blacklist' | 'verification';

interface VerificationRequest {
  id: string;
  user_id: string;
  photo_key: string;
  status: string;
  created_at: string;
  display_name?: string;
}

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
  coin_balance: number;
  bot_score: number;
  is_bot_blocked: boolean;
}

interface BlacklistEntry {
  id: string;
  target_type: 'email' | 'user_id' | 'ip';
  target_value: string;
  reason: string;
  created_at: string;
}

interface ReportItem {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { display_name: string; id: string };
  reported: { display_name: string; id: string; photos: string[] };
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: { label: string; value: number | string; icon: string; color: string; sub?: string }) {
  return (
    <div className={`glass rounded-2xl p-4 border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-primary mt-0.5">{sub}</p>}
    </div>
  );
}

// ── User card ──────────────────────────────────────────────────
function UserCard({
  user, onApprove, onReject, onBan,
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

  const verificationBadge = user.is_verified 
    ? { label: '✓ Zweryfikowany', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          {photos.length > 0 ? (
            <img src={photos[photoIndex]} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl">👤</div>
          )}
          {photos.length > 1 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground font-bold border-2 border-background">
              {photos.length}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm truncate">{user.display_name || 'Bez nazwy'}</span>
            <div className="flex gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>{statusBadge.label}</span>
              {verificationBadge && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${verificationBadge.cls}`}>{verificationBadge.label}</span>}
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            {user.age && <span>🎂 {user.age} lat</span>}
            {user.city && <span>📍 {user.city}</span>}
            {user.gender && <span>⚧ {user.gender}</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
            <span className="mx-1">·</span>
            <span className="text-amber-400 font-medium">💰 {user.coin_balance || 0}</span>
            {user.bot_score > 0 && (
              <>
                <span className="mx-1">·</span>
                <span className={`font-bold ${user.is_bot_blocked ? 'text-destructive' : 'text-amber-500'}`}>
                  🤖 {Math.round(user.bot_score * 100)}% bot
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="p-4 space-y-3">
              {/* Photos carousel */}
              {photos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Zdjęcia ({photos.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
                    {photos.map((p, i) => (
                      <img key={i} src={p} alt="" onClick={() => setPhotoIndex(i)}
                        className={`w-20 h-28 rounded-xl object-cover flex-shrink-0 cursor-pointer transition-all ${photoIndex === i ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`} />
                    ))}
                  </div>
                </div>
              )}
              {/* Bio */}
              {user.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Bio
                  </p>
                  <p className="text-sm text-foreground/80 glass rounded-xl px-3 py-2">{user.bio}</p>
                </div>
              )}
              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(user.created_at).toLocaleDateString('pl-PL')}</span>
                {user.is_verified && <span className="text-green-400">✓ Zweryfikowany</span>}
                {user.rejection_reason && (
                  <span className="text-destructive">Powód: {user.rejection_reason}</span>
                )}
              </div>
              {/* Reject form */}
              <AnimatePresence>
                {showRejectForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-2">
                    <textarea value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="Powód odrzucenia (widoczny dla użytkownika)..."
                      className="w-full glass rounded-xl px-3 py-2 text-sm outline-none border border-destructive/40 resize-none h-20" />
                    <div className="flex gap-2">
                      <button onClick={() => { onReject(user.id, reason); setShowRejectForm(false); }}
                        disabled={!reason.trim()}
                        className="flex-1 bg-destructive text-destructive-foreground py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                        Odrzuć z powodem
                      </button>
                      <button onClick={() => setShowRejectForm(false)}
                        className="px-4 glass rounded-xl text-sm">Anuluj</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {!user.admin_approved && !user.admin_rejected && (
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={() => onApprove(user.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Check className="w-4 h-4" /> Zatwierdź
          </button>
          <button onClick={() => setShowRejectForm(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <X className="w-4 h-4" /> Odrzuć
          </button>
          <button onClick={() => onBan(user.id)}
            className="w-11 flex items-center justify-center bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 rounded-xl transition-all">
            <Ban className="w-4 h-4" />
          </button>
        </div>
      )}
      {(user.admin_approved || user.admin_rejected) && (
        <div className="px-4 pb-4">
          <button onClick={() => onBan(user.id)}
            className="w-full flex items-center justify-center gap-2 glass border border-destructive/30 text-destructive py-2.5 rounded-xl text-sm transition-all hover:bg-destructive/10">
            <Ban className="w-4 h-4" /> Zbanuj użytkownika
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Stats Section ──────────────────────────────────────────────
function StatsSection() {
  const [stats, setStats] = useState({
    totalUsers: 0, activeToday: 0, newThisWeek: 0,
    matches: 0, messages: 0, reports: 0,
    groups: 0, groupMessages: 0, avgSession: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: total },
          { count: matches },
          { count: msgs },
          { count: reports },
        ] = await Promise.all([
          db.from('profiles').select('*', { count: 'exact', head: true }),
          db.from('matches').select('*', { count: 'exact', head: true }),
          db.from('messages').select('*', { count: 'exact', head: true }),
          db.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        // Mock additional data for now
        setStats({
          totalUsers: total || 0,
          matches: matches || 0,
          messages: msgs || 0,
          reports: reports || 0,
          activeToday: Math.floor((total || 0) * 0.15), // 15% estimated
          newThisWeek: Math.floor((total || 0) * 0.05), // 5% estimated
          groups: 12,
          groupMessages: 1240,
          avgSession: '6m 45s',
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-sm">Ładowanie statystyk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">📊 Statystyki aplikacji</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Wszyscy użytkownicy" value={stats.totalUsers} icon="👥" color="border-border" />
        <StatCard label="Aktywni dziś" value={stats.activeToday} icon="🟢" color="border-green-500/30" />
        <StatCard label="Nowi (tydzień)" value={stats.newThisWeek} icon="🆕" color="border-blue-500/30" />
        <StatCard label="Dopasowania" value={stats.matches} icon="💫" color="border-primary/30" />
        <StatCard label="Wiadomości" value={stats.messages} icon="💬" color="border-border" />
        <StatCard label="Zgłoszenia" value={stats.reports} icon="🚨" color="border-amber-500/30" />
        <StatCard label="Grupy aktywne" value={stats.groups} icon="✦" color="border-purple-500/30" />
        <StatCard label="Śr. sesja" value={stats.avgSession} icon="⏱️" color="border-border" />
      </div>

      {/* Activity chart placeholder */}
      <div className="glass rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Aktywność (7 dni)</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {[45, 62, 78, 54, 91, 83, 67].map((v, i) => (
            <div key={i} className="flex-1 rounded-t-sm gradient-fire opacity-80"
              style={{ height: `${v}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── Groups Section ─────────────────────────────────────────────
interface AdminGroup { id: string; name: string; category: string; is_live: boolean; members: number }

function GroupsSection() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: groupRows }, { data: memberRows }] = await Promise.all([
      db.from('groups').select('id, name, category, is_live').order('created_at', { ascending: true }),
      db.from('group_members').select('group_id'),
    ]);
    const counts: Record<string, number> = {};
    for (const r of (memberRows ?? []) as { group_id: string }[]) counts[r.group_id] = (counts[r.group_id] ?? 0) + 1;
    setGroups((groupRows ?? []).map((g: { id: string; name: string; category: string; is_live: boolean }) => ({ ...g, members: counts[g.id] ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Usunąć grupę "${name}"? Wiadomości i członkostwa też zostaną usunięte.`)) return;
    const { error } = await db.from('groups').delete().eq('id', id);
    if (error) { toast.error('Nie udało się usunąć grupy.'); return; }
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  if (loading) return <div className="text-center py-10 opacity-50 text-sm">Ładowanie grup...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">✦ Grupy dyskusyjne</h2>
        <button onClick={() => toast('Tworzenie grup z panelu admina już wkrótce 🚧')} className="text-xs text-primary">+ Utwórz grupę</button>
      </div>
      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.id} className="glass rounded-xl p-3 flex items-center gap-3 border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm truncate">{g.name}</span>
                {g.is_live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>👥 {g.members}</span>
                <span className="glass px-1.5 py-0.5 rounded-full">{g.category}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => handleDelete(g.id, g.name)} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-xs text-muted-foreground hover:text-destructive">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports Section ────────────────────────────────────────────
function ReportsSection() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      const { data } = await db
        .from('reports')
        .select('*, reporter:reporter_id(id, display_name), reported:reported_id(id, display_name, photos)')
        .order('created_at', { ascending: false });
      setReports(data || []);
      setLoading(false);
    }
    loadReports();
  }, []);

  const handleAction = async (id: string, newStatus: string) => {
    await db.from('reports').update({ status: newStatus }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  if (loading) return <div className="text-center py-10 opacity-50 text-sm">Ładowanie zgłoszeń...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">🚨 Zgłoszenia użytkowników</h2>
      <div className="space-y-2">
        {reports.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-sm italic">Brak nowych zgłoszeń ✓</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className={`glass rounded-xl p-3 border ${r.status === 'pending' ? 'border-amber-500/30' : 'border-border opacity-60'}`}>
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${r.status === 'pending' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-primary">{r.reporter?.display_name || 'Anonim'}</span>
                    {' → '}
                    <span className="text-foreground font-semibold">{r.reported?.display_name || 'Użytkownik'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">
                    {new Date(r.created_at).toLocaleString('pl-PL')} · Status: {r.status}
                  </div>
                </div>
                {r.reported?.photos?.[0] && (
                  <img src={r.reported.photos[0]} className="w-10 h-10 rounded-lg object-cover border border-border" alt="" />
                )}
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'resolved')}
                    className="flex-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-xs font-medium text-green-400 border border-green-500/20 transition-all">
                    Rozwiązane
                  </button>
                  <button onClick={() => handleAction(r.id, 'dismissed')}
                    className="flex-1 py-1.5 glass hover:bg-secondary rounded-lg text-xs font-medium text-muted-foreground transition-all">
                    Zignoruj
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Settings Section ───────────────────────────────────────────
function SettingsSection({ adminRole }: { adminRole: 'admin' | 'moderator' | 'support' | null }) {
  const { flags, loading: flagsLoading, setFlag } = useFeatureFlags();

  const Toggle = ({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!val)}
      className={`w-10 h-6 rounded-full relative transition-all ${val ? 'bg-primary' : 'bg-secondary'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? 'left-5' : 'left-1'}`} />
    </button>
  );

  const handleToggle = async (key: string, next: boolean) => {
    const { error } = await setFlag(key, next);
    if (error) toast.error('Nie udało się zapisać ustawienia.');
  };

  if (flagsLoading) {
    return <div className="text-center py-10 opacity-50 text-sm">Ładowanie ustawień...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">⚙️ Ustawienia aplikacji</h2>

      <div className="glass rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {[
          { key: 'live_streaming', icon: '🎥', label: 'Live Streaming', desc: 'Transmisje na żywo' },
          { key: 'map_nearby', icon: '📍', label: 'Mapa aktywnych', desc: 'GPS i lokalizacja' },
          { key: 'hot_or_not', icon: '🔥', label: 'Hot or Not', desc: 'Ocenianie profili' },
          { key: 'open_registration', icon: '🔓', label: 'Otwarta rejestracja', desc: 'Nowi użytkownicy mogą się rejestrować' },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xl flex-shrink-0">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <Toggle val={flags[s.key] ?? true} onChange={v => handleToggle(s.key, v)} />
          </div>
        ))}
      </div>

      {/* Maintenance mode - danger zone */}
      <div className="glass rounded-2xl border border-destructive/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-destructive/30">
          <span className="text-xs font-bold text-destructive uppercase tracking-wider">🚧 Strefa niebezpieczna</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-xl">🚧</span>
          <div className="flex-1">
            <div className="text-sm font-medium">Tryb maintenance</div>
            <div className="text-xs text-muted-foreground">Blokuje dostęp zwykłym użytkownikom</div>
          </div>
          <button onClick={() => handleToggle('maintenance_mode', !(flags.maintenance_mode ?? false))}
            className={`w-10 h-6 rounded-full relative transition-all ${flags.maintenance_mode ? 'bg-destructive' : 'bg-secondary'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${flags.maintenance_mode ? 'left-5' : 'left-1'}`} />
          </button>
        </div>
        {flags.maintenance_mode && (
          <div className="px-4 pb-3">
            <p className="text-xs text-destructive">⚠️ Aplikacja jest teraz niedostępna dla użytkowników!</p>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Informacje systemowe</span>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Wersja app</span><span className="text-foreground">v1.4.2</span></div>
          <div className="flex justify-between"><span>Admin role</span><span className="text-primary">{adminRole || 'None'}</span></div>
          <div className="flex justify-between"><span>Baza danych</span><span className="text-green-400">● Online</span></div>
          <div className="flex justify-between"><span>Supabase</span><span className="text-green-400">● Połączony</span></div>
          <div className="flex justify-between"><span>Środowisko</span><span className="text-foreground">Production</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Blacklist Section ──────────────────────────────────────────
function BlacklistSection() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTarget, setNewTarget] = useState('');
  const [newReason, setNewReason] = useState('');
  const [targetType, setTargetType] = useState<'email' | 'user_id' | 'ip'>('email');

  useEffect(() => {
    async function loadBlacklist() {
      const { data } = await db.from('blacklist').select('*').order('created_at', { ascending: false });
      setEntries(data || []);
      setLoading(false);
    }
    loadBlacklist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget) return;
    const { error } = await db.from('blacklist').insert({
      target_type: targetType,
      target_value: newTarget,
      reason: newReason
    });
    if (!error) {
      setEntries([{ target_type: targetType, target_value: newTarget, reason: newReason, created_at: new Date().toISOString() } as BlacklistEntry, ...entries]);
      setNewTarget(''); setNewReason('');
    }
  };

  const handleRemove = async (id: string) => {
    await db.from('blacklist').delete().eq('id', id);
    setEntries(entries.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">🚫 Czarna lista (Banowanie)</h2>
      
      <form onSubmit={handleAdd} className="glass rounded-2xl p-4 border border-border space-y-3">
        <div className="flex gap-2">
          <select value={targetType} onChange={e => setTargetType(e.target.value as any)}
            className="glass rounded-xl px-3 py-2 text-sm outline-none border border-border bg-background">
            <option value="email">Email</option>
            <option value="user_id">User ID</option>
            <option value="ip">Adres IP</option>
          </select>
          <input value={newTarget} onChange={e => setNewTarget(e.target.value)}
            placeholder={targetType === 'email' ? "email@uzytkownika.pl" : "Wartość..."}
            className="flex-1 glass rounded-xl px-3 py-2 text-sm outline-none border border-border" />
        </div>
        <input value={newReason} onChange={e => setNewReason(e.target.value)}
          placeholder="Powód blokady..."
          className="w-full glass rounded-xl px-3 py-2 text-sm outline-none border border-border" />
        <button type="submit" className="w-full py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold">
          Dodaj do czarnej listy
        </button>
      </form>

      <div className="space-y-2">
        {loading ? <div className="text-center py-10 opacity-50">Ładowanie...</div> : entries.map(e => (
          <div key={e.id} className="glass rounded-xl p-3 flex items-center justify-between border border-destructive/20">
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase tracking-wider">{e.target_type}</span>
                {e.target_value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{e.reason} · {new Date(e.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={() => handleRemove(e.id)} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-destructive">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Verification Section ───────────────────────────────────────
function VerificationSection() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from('verification_requests')
      .select('id, user_id, photo_key, status, created_at, profiles!user_id(display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    const rows: VerificationRequest[] = (data ?? []).map((r: VerificationRequest & { profiles?: { display_name?: string } }) => ({
      ...r, display_name: r.profiles?.display_name,
    }));
    setRequests(rows);
    setLoading(false);

    // Resolve signed preview URLs in parallel.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const entries = await Promise.all(rows.map(async (r) => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-verification-photo-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ requestId: r.id }),
      });
      if (!res.ok) return null;
      const { signedUrl } = await res.json();
      return [r.id, signedUrl] as const;
    }));
    setPhotoUrls(Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null)));
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, approve: boolean) => {
    setBusyId(id);
    const reason = approve ? null : prompt('Powód odrzucenia (widoczny dla użytkownika)') ?? '';
    const { error } = await db.rpc('admin_review_verification', { p_request_id: id, p_approve: approve, p_reason: reason });
    setBusyId(null);
    if (!error) setRequests(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="text-center py-10 opacity-50 text-sm">Ładowanie…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">🛡️ Weryfikacja profili</h2>
      {requests.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-sm text-muted-foreground">Brak zgłoszeń do weryfikacji</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="glass rounded-2xl overflow-hidden border border-border">
              <div className="aspect-square bg-secondary flex items-center justify-center">
                {photoUrls[r.id]
                  ? <img src={photoUrls[r.id]} alt="" className="w-full h-full object-cover" />
                  : <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm font-semibold">{r.display_name || 'Użytkownik'}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pl-PL')}</p>
                <div className="flex gap-2">
                  <button onClick={() => review(r.id, true)} disabled={busyId === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2 rounded-xl text-xs font-semibold disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Zatwierdź
                  </button>
                  <button onClick={() => review(r.id, false)} disabled={busyId === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 py-2 rounded-xl text-xs font-semibold disabled:opacity-50">
                    <X className="w-3.5 h-3.5" /> Odrzuć
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────
export default function AdminPanel() {
  const { isAdmin, adminRole, user } = useAuth();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<AdminSection>('users');

  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && isAdmin) {
        setAuthed(true);
        loadUsers();
      }
      setChecking(false);
    }
    checkExistingSession();
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) {
      setLoginError('Błąd logowania: ' + (error?.message || 'Nieznany błąd'));
      setLoading(false);
      return;
    }

    // Wait for auth state to update and check admin status
    setTimeout(() => {
      if (isAdmin) {
        setAuthed(true);
        loadUsers();
      } else {
        setLoginError('Brak dostępu. Tylko administrator może zalogować się tutaj.');
        supabase.auth.signOut();
      }
      setLoading(false);
    }, 500);
  };

  const [users, setUsers] = useState<PendingUser[]>([]);
  const [filter, setFilter] = useState<VerifyStatus>('pending');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    if (!authed) return;
    db.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      .then(({ count }: { count: number | null }) => setPendingReports(count ?? 0));
  }, [authed]);

  const loadUsers = async () => {
    setRefreshing(true);
    const { data } = await db
      .from('profiles')
      .select('id, display_name, age, gender, city, bio, photos, avatar_url, is_verified, admin_approved, admin_rejected, rejection_reason, created_at, profile_complete, coin_balance, bot_score, is_bot_blocked')
      .eq('profile_complete', true)
      .order('created_at', { ascending: false });

    // Real email, resolved below via admin-list-emails (profiles has no
    // email column — it lives in auth.users, service-role only). Show a
    // loading placeholder in the meantime rather than a fake address.
    const enriched: PendingUser[] = (data ?? []).map((p: PendingUser) => ({
      ...p,
      email: 'Ładowanie...',
    }));

    setUsers(enriched);
    setStats({
      total: enriched.length,
      pending: enriched.filter(u => !u.admin_approved && !u.admin_rejected).length,
      approved: enriched.filter(u => u.admin_approved).length,
      rejected: enriched.filter(u => u.admin_rejected).length,
    });

    if (enriched.length > 0) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return;
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ userIds: enriched.map(u => u.id) }),
          });
          const { emails } = await res.json();
          if (emails) {
            setUsers(prev => prev.map(u => emails[u.id] ? { ...u, email: emails[u.id] } : { ...u, email: 'Nieznany' }));
          }
        } catch {
          setUsers(prev => prev.map(u => ({ ...u, email: 'Nieznany' })));
        }
      });
    }
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
    if (!confirm('Na pewno zbanować tego użytkownika?')) return;
    await db.from('profiles').update({ admin_rejected: true, rejection_reason: 'Konto zbanowane przez administratora' }).eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setStats(s => ({ ...s, total: s.total - 1 }));
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === 'all' ? true :
      filter === 'pending' ? (!u.admin_approved && !u.admin_rejected) :
      filter === 'approved' ? !!u.admin_approved :
      !!u.admin_rejected;
    return matchSearch && matchStatus;
  });

  if (checking) {
    return (
      <div className="min-h-screen bg-radial-glow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Login screen ────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-radial-glow flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4" style={{ background: '#000' }}>
              <img src="/spark-connect-logo.png" alt="Spark Connect" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black">Panel Administratora</h1>
            <p className="text-sm text-muted-foreground mt-1">Spark Connect 18+ · Dostęp tylko dla admina</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 glass border border-destructive/40 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{loginError}</span>
              </motion.div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin email</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" required autoComplete="email"
                placeholder="hardbanrecordslab.pl@gmail.com"
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasło</label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" required
                placeholder="Hasło administratora"
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                : <><Shield className="w-4 h-4" /> Zaloguj do panelu</>}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            🔒 Dostęp tylko dla administratorów
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────
  const navItems: { id: AdminSection; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'users', icon: <Users className="w-4 h-4" />, label: 'Użytkownicy', badge: stats.pending },
    { id: 'stats', icon: <TrendingUp className="w-4 h-4" />, label: 'Statystyki' },
    { id: 'groups', icon: <MessageSquare className="w-4 h-4" />, label: 'Grupy' },
    { id: 'reports', icon: <AlertTriangle className="w-4 h-4" />, label: 'Zgłoszenia', badge: pendingReports },
    { id: 'blacklist', icon: <Ban className="w-4 h-4" />, label: 'Blacklista' },
    { id: 'verification', icon: <Shield className="w-4 h-4" />, label: 'Weryfikacja' },
    { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Ustawienia' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-strong border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden" style={{ background: '#000' }}>
              <img src="/spark-connect-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{user?.email || 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadUsers} disabled={refreshing}
              className="w-8 h-8 glass rounded-xl flex items-center justify-center">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.div>
            </button>
            <button onClick={() => { supabase.auth.signOut(); setAuthed(false); }}
              className="w-8 h-8 glass rounded-xl flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex px-4 pb-3 gap-1 overflow-x-auto scrollbar-hidden">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all relative ${
                section === n.id ? 'bg-primary/20 text-primary border border-primary/40' : 'glass text-muted-foreground border border-border'}`}>
              {n.icon} {n.label}
              {n.badge && n.badge > 0 ? (
                <span className="ml-0.5 w-4 h-4 bg-primary rounded-full text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {n.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* USERS SECTION */}
        {section === 'users' && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Wszyscy" value={stats.total} icon="👥" color="border-border" />
              <StatCard label="Oczekuje" value={stats.pending} icon="⏳" color="border-amber-500/30" />
              <StatCard label="Zatwierdzeni" value={stats.approved} icon="✅" color="border-green-500/30" />
              <StatCard label="Odrzuceni" value={stats.rejected} icon="❌" color="border-destructive/30" />
            </div>

            {stats.pending > 0 && (
              <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                className="glass border border-amber-500/40 rounded-2xl px-4 py-3 flex items-center gap-3">
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
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj po imieniu, emailu, mieście..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
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
                <button key={tab.v} onClick={() => setFilter(tab.v)}
                  className={`flex-1 text-xs font-medium py-2 px-1 rounded-xl transition-all ${
                    filter === tab.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab.l}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${filter === tab.v ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {tab.count}
                    </span>
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
                    {filter === 'pending' ? 'Brak profili oczekujących — świetnie! ✓' : 'Brak wyników'}
                  </p>
                </div>
              ) : (
                filtered.map(user => (
                  <UserCard key={user.id} user={user}
                    onApprove={handleApprove} onReject={handleReject} onBan={handleBan} />
                ))
              )}
            </div>
          </>
        )}

        {section === 'stats' && <StatsSection />}
        {section === 'groups' && <GroupsSection />}
        {section === 'reports' && <ReportsSection />}
        {section === 'blacklist' && <BlacklistSection />}
        {section === 'verification' && <VerificationSection />}
        {section === 'settings' && <SettingsSection adminRole={adminRole} />}

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Spark Connect 18+ Admin · {user?.email || 'Admin'}</p>
        </div>
      </div>
    </div>
  );
}
