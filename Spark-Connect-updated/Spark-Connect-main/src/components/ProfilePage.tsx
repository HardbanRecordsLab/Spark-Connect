// @ts-nocheck
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, MapPin, LogOut, Check, X, Loader2, Sparkles, Camera,
  Heart, Star, Eye, EyeOff, Lock, Pencil, Image, BadgeCheck, Activity,
  ChevronDown, ChevronUp, ChevronRight, Shield, Zap, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import SettingsPage from '@/components/SettingsPage';
import ProfilePhotoGallery from '@/components/ProfilePhotoGallery';
import { MyPrivatePhotos } from '@/components/PrivatePhotos';
import CompatibilityQuiz from '@/components/CompatibilityQuiz';
import DonationPage from '@/components/DonationPage';
import FaceVerify from '@/components/FaceVerify';

// ─── Data constants ───────────────────────────────────────────────
const MOOD_OPTIONS = [
  { value: 'Szukam zabawy 🔥', emoji: '🔥' },
  { value: 'Na jeden wieczór 🌙', emoji: '🌙' },
  { value: 'Flirt i seks 💋', emoji: '💋' },
  { value: 'Stały partner 💍', emoji: '💍' },
  { value: 'Jestem otwarty/a ✨', emoji: '✨' },
];
const INTERESTS = ['Podróże ✈️','Muzyka 🎵','Fitness 💪','Gotowanie 🍝','Sztuka 🎨','Gaming 🎮','Kino 🎬','Czytanie 📚','Yoga 🧘','Hiking 🥾','Fotografia 📷','Taniec 🤸','Wino 🍷','Café ☕','Natura 🌿','Techno 🎧','Rower 🚴','Pływanie 🏊'];
const BODY_TYPES = ['Szczupła','Normalna','Atletyczna','Krągła','Muskularna','Puszysta'];
const EYE_COLORS = ['Niebieskie','Brązowe','Zielone','Szare','Piwne'];
const HAIR_COLORS = ['Czarne','Blond','Brązowe','Rude','Siwe','Łysy','Kolorowe'];
const SMOKING_OPTS = ['Nigdy','Okazyjnie','Regularnie','Tylko e-papierosy'];
const DRINKING_OPTS = ['Nigdy','Okazyjnie','W weekendy','Regularnie'];
const EDUCATION_OPTS = ['Podstawowe','Średnie','Wyższe','Student','Doktorat'];
const TATTOOS_OPTS = ['Brak','Kilka małych','Wiele dużych','Całe ciało'];
const PIERCING_OPTS = ['Brak','Mało widoczny','Wiele'];
const REL_GOALS = ['Zabawa i seks 🔥','Randki bez zobowiązań 🌙','Szukam miłości 💍','Przyjaźń 🤝','Poliamoria 🌈'];
const ORIENTATIONS = ['Hetero','Bi','Homo','Panseksualny','Aseksualny','Ciekawski'];
const LOOKING_FOR = ['Kobieta','Mężczyzna','Para (KM)','Para (KK)','Para (MM)','Trans/CD'];
const SAFE_SEX_OPTS = ['Zawsze','Zależy od osoby','Nie używam','Tylko z partnerem'];
const SEX_PREFS = ['Dominujący/a 👑','Uległy/a ⛓️','Switch 🔄','Vanilla 🍦','Kinky 👅','Voyeur 👁️','Exhibitionist 🍑','Swinger 🍍'];

// ─── Sub-components ───────────────────────────────────────────────

function SectionCard({ title, icon, children, locked, collapsible, defaultOpen = true }: {
  title: string; icon?: string; children: React.ReactNode;
  locked?: boolean; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-3xl overflow-hidden border border-border mb-3">
      <div
        className={`flex items-center justify-between px-5 py-3.5 border-b border-border/40 ${collapsible ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-2.5">
          {icon && <span>{icon}</span>}
          <span className="text-sm font-semibold">{title}</span>
          {locked && (
            <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" />Prywatne
            </span>
          )}
        </div>
        {collapsible && (
          open ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
               : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({ label, value, onSave, multiline, maxLength, placeholder }: {
  label: string; value: string; onSave: (v: string) => Promise<void>;
  multiline?: boolean; maxLength?: number; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {editing ? (
          <div className="flex gap-1.5">
            <button onClick={() => { setDraft(value); setEditing(false); }}
              className="w-6 h-6 glass rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
            <button onClick={save} disabled={saving}
              className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              {saving ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Check className="w-3 h-3 text-white" />}
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(value); setEditing(true); }}
            className="w-6 h-6 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {multiline
              ? <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLength} rows={4} placeholder={placeholder}
                  className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-primary/30 resize-none focus:border-primary/60 transition-colors" />
              : <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLength} placeholder={placeholder}
                  className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-primary/30 focus:border-primary/60 transition-colors" />
            }
            {maxLength && <p className="text-[10px] text-muted-foreground text-right mt-1">{draft.length}/{maxLength}</p>}
          </motion.div>
        ) : (
          <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-sm leading-relaxed ${value ? 'text-foreground/90' : 'italic text-muted-foreground/40'}`}>
            {value || `Dodaj ${label.toLowerCase()}...`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectRow({ label, value, options, onSave }: {
  label: string; value: string; options: string[]; onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <button onClick={() => setEditing(o => !o)}
          className="w-6 h-6 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-wrap gap-1.5">
            {options.map(opt => (
              <button key={opt} disabled={saving}
                onClick={async () => { setSaving(true); await onSave(opt); setSaving(false); setEditing(false); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${value === opt
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'glass border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                {opt}
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-sm ${value ? 'text-foreground/90' : 'italic text-muted-foreground/40'}`}>
            {value || 'Nie podano'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagsRow({ label, value = [], suggestions, onSave, max = 10, color = 'primary' }: {
  label: string; value?: string[]; suggestions: string[];
  onSave: (tags: string[]) => Promise<void>; max?: number; color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (t: string) => setDraft(p => p.includes(t) ? p.filter(x => x !== t) : p.length < max ? [...p, t] : p);
  const addCustom = () => {
    const t = custom.trim();
    if (t && !draft.includes(t) && draft.length < max) { setDraft(p => [...p, t]); setCustom(''); }
  };

  const activeClass = color === 'purple'
    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
    : 'bg-primary/20 border-primary/50 text-primary';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {editing ? (
          <div className="flex gap-1.5">
            <button onClick={() => { setDraft(value); setEditing(false); }}
              className="w-6 h-6 glass rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
            <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); }} disabled={saving}
              className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              {saving ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Check className="w-3 h-3 text-white" />}
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(value); setEditing(true); }}
            className="w-6 h-6 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(t => (
              <button key={t} onClick={() => toggle(t)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${draft.includes(t) ? activeClass : 'glass border-border text-muted-foreground hover:border-primary/30'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={custom} onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Dodaj własny..."
              className="flex-1 bg-secondary/40 rounded-xl px-3 py-2 text-xs outline-none border border-border focus:border-primary/50 transition-colors" />
            <button onClick={addCustom}
              className="px-3 py-2 bg-primary/20 border border-primary/30 rounded-xl text-xs text-primary hover:bg-primary/30 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">{draft.length}/{max}</p>
        </motion.div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {(value || []).length > 0
            ? (value || []).map(t => <span key={t} className="text-xs px-3 py-1.5 glass rounded-full border border-border text-foreground/80">{t}</span>)
            : <p className="text-sm italic text-muted-foreground/40">Brak</p>}
        </div>
      )}
    </div>
  );
}

function MoodPicker({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cur = MOOD_OPTIONS.find(m => m.value === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${open ? 'border-primary/50 bg-primary/10' : 'glass border-border hover:border-primary/30'}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{cur?.emoji || '✨'}</span>
          <span className="text-sm font-medium">{value || 'Ustaw swój nastrój...'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl border border-border overflow-hidden z-50 shadow-2xl">
            {MOOD_OPTIONS.map(opt => (
              <button key={opt.value} disabled={saving}
                onClick={async () => { setSaving(true); await onSave(opt.value); setSaving(false); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-primary/10' : ''}`}>
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm flex-1 text-left">{opt.value}</span>
                {value === opt.value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompletionBar({ profile }: { profile: any }) {
  const checks = ['display_name','bio','city','age','gender','orientation','relationship_goal','avatar_url','interests'];
  const pct = Math.round((checks.filter(f => profile?.[f] && (Array.isArray(profile[f]) ? profile[f].length > 0 : true)).length / checks.length) * 100);
  return (
    <div className="glass rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Kompletność profilu</span>
        </div>
        <span className={`text-sm font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-primary'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-primary to-amber-400'}`} />
      </div>
      {pct < 100 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {pct < 50 ? '🔥 Uzupełnij profil — 5× więcej dopasowań!' : '✨ Jeszcze kilka kroków do pełnego profilu'}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, refetch } = useProfile(user);
  const { setView } = useAppStore();

  const [tab, setTab] = useState<'overview'|'edit'|'private'|'options'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPrivatePhotos, setShowPrivatePhotos] = useState(false);
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const save = async (field: string, value: any) => {
    if (!user) return;
    const { error } = await (supabase as any).from('profiles')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) { toast.error('Błąd zapisu'); return; }
    toast.success('Zapisano ✓');
    refetch();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await save('avatar_url', publicUrl);
    } catch { toast.error('Błąd uploadu'); }
    finally { setAvatarUploading(false); }
  };

  const signOut = async () => { await supabase.auth.signOut(); setView('auth'); };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
      </div>
    </div>
  );

  if (showSettings) return <SettingsPage onBack={() => setShowSettings(false)} />;
  if (showGallery) return <ProfilePhotoGallery onBack={() => setShowGallery(false)} />;
  if (showQuiz) return <CompatibilityQuiz onClose={() => setShowQuiz(false)} />;
  if (showDonation) return <DonationPage onBack={() => setShowDonation(false)} />;
  if (showFaceVerify) return <FaceVerify onComplete={() => { setShowFaceVerify(false); refetch(); }} onClose={() => setShowFaceVerify(false)} />;

  const TABS = [
    { id: 'overview', icon: '👤', label: 'Profil' },
    { id: 'edit',     icon: '✏️', label: 'Edytuj' },
    { id: 'private',  icon: '🔞', label: '18+' },
    { id: 'options',  icon: '⚙️', label: 'Opcje' },
  ] as const;

  // Merge passions for interests display
  const allPassions = [
    ...(profile?.passions_art || []),
    ...(profile?.passions_sport || []),
    ...(profile?.passions_travel || []),
    ...(profile?.passions_food || []),
    ...(profile?.passions_tech || []),
    ...(profile?.interests || []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);

  return (
    <div className="h-full overflow-y-auto pb-6 scrollbar-hidden">

      {/* ── HERO ── */}
      <div className="relative">
        {/* Cover */}
        <div className="h-40 relative overflow-hidden">
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, hsl(347 60% 15%) 0%, hsl(240 15% 6%) 50%, hsl(45 60% 12%) 100%)' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.2),transparent_60%)]" />
          {/* Settings & logout in corner */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button onClick={() => setShowSettings(true)}
              className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/10 hover:bg-white/15 transition-colors">
              <Settings className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button onClick={signOut}
              className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/10 hover:bg-white/15 transition-colors">
              <LogOut className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-secondary shadow-xl shadow-black/40">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl"
                    style={{ background: 'linear-gradient(135deg, hsl(347 60% 25%), hsl(45 60% 20%))' }}>
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <button onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/80 transition-colors shadow-lg">
              <Camera className="w-3 h-3 text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            {profile?.face_verified && (
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="mt-14 px-4 text-center mb-3">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <h1 className="text-xl font-bold">{profile?.display_name || 'Twój profil'}</h1>
          {profile?.age && <span className="text-lg text-muted-foreground">{profile.age}</span>}
          {profile?.is_verified && (
            <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
          )}
        </div>
        {profile?.city && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1.5">
            <MapPin className="w-3 h-3" />{profile.city}
          </div>
        )}
        {(profile?.mood || profile?.mood_status) && (
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">
            {profile.mood || profile.mood_status}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '❤️', label: 'Polubień', val: profile?.total_likes ?? 0, accent: true },
            { icon: '⚡', label: 'Dopasowań', val: profile?.matches_count ?? 0 },
            { icon: '👁️', label: 'Odwiedzin', val: profile?.profile_views ?? 0 },
          ].map(s => (
            <div key={s.label} className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl border ${s.accent ? 'bg-primary/10 border-primary/30' : 'glass border-border'}`}>
              <span className="text-base">{s.icon}</span>
              <span className={`text-sm font-bold ${s.accent ? 'text-primary' : ''}`}>{s.val}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completion */}
      <div className="px-4 mb-3">
        <CompletionBar profile={profile} />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 sticky top-0 z-30 pt-1 pb-1 bg-background/85 backdrop-blur-xl">
        <div className="flex gap-1 glass rounded-2xl p-1 border border-border">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <div className="space-y-3">
                {profile?.bio && (
                  <SectionCard title="O mnie" icon="💬">
                    <p className="text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
                  </SectionCard>
                )}

                <SectionCard title="Dane" icon="📋">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    {[
                      ['Płeć', profile?.gender],
                      ['Orientacja', profile?.orientation],
                      ['Wzrost', profile?.height ? `${profile.height} cm` : null],
                      ['Sylwetka', profile?.body_type],
                      ['Miasto', profile?.city],
                      ['Szuka', profile?.relationship_goal],
                      ['Edukacja', profile?.education],
                      ['Zawód', profile?.occupation],
                    ].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l as string}>
                        <p className="text-[10px] text-muted-foreground">{l}</p>
                        <p className="text-sm font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {allPassions.length > 0 && (
                  <SectionCard title="Pasje & zainteresowania" icon="🎯">
                    <div className="flex flex-wrap gap-1.5">
                      {allPassions.map(t => (
                        <span key={t} className="text-xs px-3 py-1.5 glass rounded-full border border-border text-foreground/80">{t}</span>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowGallery(true)}
                    className="glass rounded-2xl border border-border p-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors">
                    <Image className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Galeria</p>
                      <p className="text-xs text-muted-foreground">Zdjęcia</p>
                    </div>
                  </button>
                  <button onClick={() => setShowQuiz(true)}
                    className="glass rounded-2xl border border-border p-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium">SparkAI™</p>
                      <p className="text-xs text-muted-foreground">Quiz</p>
                    </div>
                  </button>
                </div>

                {!profile?.face_verified && (
                  <button onClick={() => setShowFaceVerify(true)}
                    className="w-full glass rounded-2xl border border-emerald-500/30 p-4 flex items-center gap-3 hover:bg-emerald-500/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-emerald-400">Zweryfikuj twarz</p>
                      <p className="text-xs text-muted-foreground">Badge weryfikacji + 40% więcej dopasowań</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* ══ EDIT ══ */}
            {tab === 'edit' && (
              <div className="space-y-3">
                <SectionCard title="Nastrój" icon="🔥">
                  <MoodPicker value={profile?.mood || profile?.mood_status || ''} onSave={v => save('mood', v)} />
                </SectionCard>

                <SectionCard title="Podstawowe" icon="👤">
                  <div className="space-y-4">
                    <FieldRow label="Imię / Pseudonim" value={profile?.display_name || ''} onSave={v => save('display_name', v)} maxLength={30} placeholder="Jak chcesz być nazywany/a?" />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label="Wiek" value={profile?.age?.toString() || ''} onSave={v => save('age', parseInt(v))} placeholder="25" />
                      <FieldRow label="Miasto" value={profile?.city || ''} onSave={v => save('city', v)} placeholder="Warszawa" />
                    </div>
                    <SelectRow label="Płeć" value={profile?.gender || ''} options={['Kobieta','Mężczyzna','Niebinarna/y','Trans kobieta','Trans mężczyzna','Inna','Wolę nie podawać']} onSave={v => save('gender', v)} />
                    <FieldRow label="Bio" value={profile?.bio || ''} onSave={v => save('bio', v)} multiline maxLength={500} placeholder="Napisz coś o sobie — co Cię wyróżnia, czego szukasz..." />
                  </div>
                </SectionCard>

                <SectionCard title="Wygląd" icon="🪞" collapsible defaultOpen={false}>
                  <div className="space-y-4">
                    <FieldRow label="Wzrost (cm)" value={profile?.height?.toString() || ''} onSave={v => save('height', parseInt(v))} placeholder="170" />
                    <SelectRow label="Sylwetka" value={profile?.body_type || ''} options={BODY_TYPES} onSave={v => save('body_type', v)} />
                    <div className="grid grid-cols-2 gap-4">
                      <SelectRow label="Oczy" value={profile?.eye_color || ''} options={EYE_COLORS} onSave={v => save('eye_color', v)} />
                      <SelectRow label="Włosy" value={profile?.hair_color || ''} options={HAIR_COLORS} onSave={v => save('hair_color', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <SelectRow label="Tatuaże" value={profile?.tattoos || ''} options={TATTOOS_OPTS} onSave={v => save('tattoos', v)} />
                      <SelectRow label="Piercing" value={profile?.piercing || ''} options={PIERCING_OPTS} onSave={v => save('piercing', v)} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Styl życia" icon="🌿" collapsible defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <SelectRow label="Palenie" value={profile?.smoking || ''} options={SMOKING_OPTS} onSave={v => save('smoking', v)} />
                      <SelectRow label="Alkohol" value={profile?.drinking || ''} options={DRINKING_OPTS} onSave={v => save('drinking', v)} />
                    </div>
                    <SelectRow label="Edukacja" value={profile?.education || ''} options={EDUCATION_OPTS} onSave={v => save('education', v)} />
                    <FieldRow label="Zawód" value={profile?.occupation || ''} onSave={v => save('occupation', v)} placeholder="np. Fotograf, Programista..." />
                  </div>
                </SectionCard>

                <SectionCard title="Zainteresowania" icon="🎯">
                  <TagsRow label="Co lubisz robić?" value={profile?.interests || []} suggestions={INTERESTS} onSave={v => save('interests', v)} />
                </SectionCard>

                <SectionCard title="Orientacja & relacje" icon="🌈">
                  <div className="space-y-4">
                    <SelectRow label="Orientacja" value={profile?.orientation || ''} options={ORIENTATIONS} onSave={v => save('orientation', v)} />
                    <SelectRow label="Cel relacji" value={profile?.relationship_goal || ''} options={REL_GOALS} onSave={v => save('relationship_goal', v)} />
                    <TagsRow label="Szukam" value={profile?.looking_for || []} suggestions={LOOKING_FOR} onSave={v => save('looking_for', v)} max={4} />
                  </div>
                </SectionCard>

                <button onClick={() => setShowGallery(true)}
                  className="w-full glass rounded-3xl border border-border p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Zarządzaj zdjęciami</p>
                    <p className="text-xs text-muted-foreground">Dodaj, usuń lub zmień kolejność</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* ══ PRIVATE 18+ ══ */}
            {tab === 'private' && (
              <div className="space-y-3">
                <div className="glass rounded-2xl border border-purple-500/30 p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-300">Strefa prywatna 18+</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Te dane są widoczne wyłącznie dla dopasowań z Tobą.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between glass rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-2">
                    {showPrivate ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm">{showPrivate ? 'Dane widoczne' : 'Pokaż / edytuj dane prywatne'}</span>
                  </div>
                  <button onClick={() => setShowPrivate(o => !o)}
                    className={`w-11 h-6 rounded-full transition-all relative ${showPrivate ? 'bg-primary' : 'bg-secondary'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-all ${showPrivate ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {showPrivate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

                      <SectionCard title="Preferencje seksualne" icon="💋" locked>
                        <div className="space-y-4">
                          <TagsRow label="Moje preferencje" value={profile?.sexual_preferences || []} suggestions={SEX_PREFS} onSave={v => save('sexual_preferences', v)} color="purple" />
                          <SelectRow label="Bezpieczny seks" value={profile?.safe_sex || ''} options={SAFE_SEX_OPTS} onSave={v => save('safe_sex', v)} />
                          <FieldRow label="Opis własnymi słowami" value={profile?.sex_description || ''} onSave={v => save('sex_description', v)} multiline maxLength={800} placeholder="Opisz czego szukasz i co lubisz..." />
                        </div>
                      </SectionCard>

                      <SectionCard title="Lubię / Nie lubię" icon="🌶" locked>
                        <div className="space-y-4">
                          <TagsRow label="Lubię ❤️" value={profile?.likes_list || []}
                            suggestions={['Seks oralny','BDSM lekkie','Roleplay','Masaż','Długie sesje','Quickie','Zabawki','Outdoor','Sexting','Wiązanie']}
                            onSave={v => save('likes_list', v)} />
                          <TagsRow label="Nie lubię ✗" value={profile?.dislikes_list || []}
                            suggestions={['Pośpiech','Brak zabawy','Agresja','Brak higieny','Brak kontaktu wzrokowego','Brak zabezpieczeń']}
                            onSave={v => save('dislikes_list', v)} />
                        </div>
                      </SectionCard>

                      <button onClick={() => setShowPrivatePhotos(true)}
                        className="w-full glass rounded-3xl border border-purple-500/30 p-4 flex items-center gap-3 hover:bg-purple-500/5 transition-colors">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm text-purple-300">Prywatna galeria</p>
                          <p className="text-xs text-muted-foreground">Tylko dla wybranych dopasowań</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══ OPTIONS ══ */}
            {tab === 'options' && (
              <div className="space-y-3">
                <SectionCard title="Konto" icon="👤">
                  <div className="space-y-0.5">
                    {[
                      { label: 'Ustawienia aplikacji', icon: <Settings className="w-4 h-4" />, action: () => setShowSettings(true) },
                      { label: 'Weryfikacja twarzy', icon: <BadgeCheck className="w-4 h-4" />, action: () => setShowFaceVerify(true), badge: profile?.face_verified ? '✓ Zweryfikowany' : undefined, badgeColor: 'text-emerald-400' },
                      { label: 'Quiz dopasowania SparkAI™', icon: <Sparkles className="w-4 h-4" />, action: () => setShowQuiz(true) },
                      { label: 'Galeria zdjęć', icon: <Image className="w-4 h-4" />, action: () => setShowGallery(true) },
                      { label: 'Prywatna galeria 18+', icon: <Lock className="w-4 h-4" />, action: () => setShowPrivatePhotos(true) },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-8 h-8 glass rounded-xl flex items-center justify-center border border-border text-muted-foreground group-hover:text-primary transition-colors">
                          {item.icon}
                        </div>
                        <span className="flex-1 text-sm text-left">{item.label}</span>
                        {item.badge && <span className={`text-xs ${item.badgeColor || 'text-muted-foreground'}`}>{item.badge}</span>}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {/* Premium CTA */}
                <button onClick={() => setShowDonation(true)}
                  className="w-full rounded-3xl p-5 flex items-center gap-4 border border-amber-500/20 hover:border-amber-500/40 transition-colors group"
                  style={{ background: 'linear-gradient(135deg, hsl(45 60% 8%), hsl(35 60% 6%))' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(35 100% 45%))' }}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-amber-300">SparkConnect Premium</p>
                    <p className="text-xs text-amber-200/60">Więcej swipe'ów, boost profilu, brak reklam</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </button>

                <button onClick={signOut}
                  className="w-full glass rounded-2xl border border-red-500/20 p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Wyloguj się</span>
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Private photos bottom sheet */}
      <AnimatePresence>
        {showPrivatePhotos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end" onClick={e => e.target === e.currentTarget && setShowPrivatePhotos(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="w-full bg-background rounded-t-3xl max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
                <h2 className="text-lg font-bold">🔒 Prywatna galeria</h2>
                <button onClick={() => setShowPrivatePhotos(false)}
                  className="w-8 h-8 glass rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4"><MyPrivatePhotos /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfilePage;
