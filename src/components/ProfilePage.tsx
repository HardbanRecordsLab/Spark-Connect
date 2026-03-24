import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Edit, Shield, MapPin, ChevronRight, LogOut, Check, X, Plus, TrendingUp, Zap, LocateFixed, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import SettingsPage from '@/components/SettingsPage';
import FaceVerify from '@/components/FaceVerify';
import ProfilePhotoGallery from '@/components/ProfilePhotoGallery';
import ReferralSystem from '@/components/ReferralSystem';
import { AvailableNowToggle } from '@/components/AvailableNow';
import { MyPrivatePhotos } from '@/components/PrivatePhotos';
import CompatibilityQuiz from '@/components/CompatibilityQuiz';
import DonationPage from '@/components/DonationPage';
import RewardedAd from '@/components/RewardedAd';

const moodOptions = [
  { value: 'Szukam zabawy 🔥',   emoji: '🔥' },
  { value: 'Na jeden wieczór 🌙', emoji: '🌙' },
  { value: 'Flirt i seks 💋',    emoji: '💋' },
  { value: 'Stały partner 💍',   emoji: '💍' },
  { value: 'Jestem otwarty/a ✨', emoji: '✨' },
];

const INTEREST_SUGGESTIONS = [
  'Travel', 'Music', 'Fitness', 'Cooking', 'Art', 'Gaming',
  'Movies', 'Reading', 'Yoga', 'Hiking', 'Photography', 'Dancing',
];

const BODY_TYPES = ['Szczupła', 'Normalna', 'Atletyczna', 'Krągła', 'Muskularna'];
const EYE_COLORS = ['Niebieskie', 'Brązowe', 'Zielone', 'Szare', 'Piwne'];
const HAIR_COLORS = ['Czarne', 'Blond', 'Brązowe', 'Rude', 'Siwe', 'Łysy'];
const SMOKING = ['Nigdy', 'Okazyjnie', 'Regularnie'];
const DRINKING = ['Nigdy', 'Okazyjnie', 'Regularnie'];
const EDUCATION = ['Podstawowe', 'Średnie', 'Wyższe', 'Student'];

function SelectField({ label, value, options, onSave }: {
  label: string; value: string; options: string[]; onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        <button onClick={() => setEditing(!editing)} className="w-7 h-7 glass rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex flex-wrap gap-2">
            {options.map(opt => (
              <button
                key={opt}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await onSave(opt);
                  setSaving(false);
                  setEditing(false);
                }}
                className={`text-xs px-3 py-1.5 rounded-full transition-all border ${value === opt ? 'gradient-fire text-primary-foreground border-transparent' : 'glass border-border text-muted-foreground'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground leading-relaxed">
            {value || <span className="italic opacity-50">Kliknij ✏️ aby wybrać {label.toLowerCase()}</span>}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditableField({ label, value, onSave, multiline = false, type = 'text', maxLength }: {
  label: string; value: string; onSave: (v: string) => Promise<void>;
  multiline?: boolean; type?: string; maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setDraft(value); setEditing(false); }} className="w-7 h-7 glass rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={handleSave} disabled={saving} className="w-7 h-7 gradient-fire rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="w-7 h-7 glass rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
            {multiline ? (
              <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLength} rows={3}
                className="w-full bg-secondary/60 rounded-xl px-3 py-2 text-sm outline-none border border-primary/30 resize-none" />
            ) : (
              <input autoFocus type={type} value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLength}
                className="w-full bg-secondary/60 rounded-xl px-3 py-2 text-sm outline-none border border-primary/30" />
            )}
            {maxLength && <p className="text-xs text-muted-foreground text-right mt-1">{draft.length}/{maxLength}</p>}
          </motion.div>
        ) : (
          <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground leading-relaxed">
            {value || <span className="italic opacity-50">Kliknij ✏️ aby dodać {label.toLowerCase()}</span>}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterestsEditor({ interests, onSave }: { interests: string[]; onSave: (tags: string[]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(interests);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (tag: string) => setDraft(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const addCustom = () => {
    const t = custom.trim();
    if (!t || draft.includes(t) || draft.length >= 10) return;
    setDraft(prev => [...prev, t]);
    setCustom('');
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Zainteresowania</p>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setDraft(interests); setEditing(false); }} className="w-7 h-7 glass rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); }} disabled={saving}
              className="w-7 h-7 gradient-fire rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(interests); setEditing(true); }} className="w-7 h-7 glass rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {INTEREST_SUGGESTIONS.map(tag => (
              <button key={tag} onClick={() => toggle(tag)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all border ${draft.includes(tag) ? 'gradient-fire text-primary-foreground border-transparent' : 'glass border-border text-muted-foreground'}`}>
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Dodaj własne..." maxLength={20} className="flex-1 bg-secondary/60 rounded-xl px-3 py-2 text-xs outline-none border border-primary/30" />
            <button onClick={addCustom} className="w-9 h-9 gradient-fire rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{draft.length}/10</p>
        </motion.div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests.length > 0
            ? interests.map(tag => <span key={tag} className="glass text-xs px-3 py-1.5 rounded-full border border-primary/20 text-foreground/70">{tag}</span>)
            : <span className="text-sm text-muted-foreground italic opacity-50">Kliknij ✏️ aby dodać zainteresowania</span>
          }
        </div>
      )}
    </div>
  );
}

// Mock stats — in production query from DB
function useProfileStats(userId?: string) {
  const [stats, setStats] = useState({ likes: 0, matches: 0, superLikes: 0 });
  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    Promise.all([
      db.from('swipes').select('id', { count: 'exact', head: true }).eq('swiped_id', userId).eq('direction', 'right'),
      db.from('matches').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      db.from('swipes').select('id', { count: 'exact', head: true }).eq('swiped_id', userId).eq('is_super', true),
    ]).then(([likesRes, matchesRes, superRes]) => {
      setStats({
        likes:      likesRes.count  ?? 0,
        matches:    matchesRes.count ?? 0,
        superLikes: superRes.count  ?? 0,
      });
    });
  }, [userId]);
  return stats;
}

export default function ProfilePage() {
  const { currentUser, setView } = useAppStore();
  const { user } = useAuth();
  const { profile, updateProfile, refetch } = useProfile(user);
  const { requestLocation, loading: geoLoading } = useGeolocation();
  const [activeSection, setActiveSection] = useState<'main' | 'settings' | 'referral' | 'quiz' | 'donation'>('main');
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardType, setRewardType] = useState<'boost_24h' | 'who_liked_me_24h'>('boost_24h');
  const [isBoosted, setIsBoosted] = useState(false);

  const handleDetectLocation = async () => {
    const pos = await requestLocation();
    if (pos) {
      await updateProfile({ city: pos.city });
    }
  };
  const stats = useProfileStats(user?.id);

  const displayName = profile?.display_name || currentUser?.displayName || 'You';
  const age = profile?.age || currentUser?.age || 25;
  const bio = profile?.bio || currentUser?.bio || '';
  const city = profile?.city || currentUser?.location?.city || '';
  const isVerified = profile?.is_verified || currentUser?.isVerified || false;
  const interests = profile?.interests?.length ? profile.interests : (currentUser?.interests || []);
  const activeMood = profile?.mood_status || currentUser?.moodStatus || 'Looking for fun';

  const avatarUrl = profile?.avatar_url || profile?.photos?.[0] || currentUser?.avatarUrl || currentUser?.photos?.[0]
    || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80';

  const handleVerified = async () => {
    setShowFaceVerify(false);
    await updateProfile({ is_verified: true });
  };

  const rawPhotos = profile?.photos ?? currentUser?.photos ?? [];
  const displayPhotos = rawPhotos.filter((p: string) => !p.startsWith('video:'));
  const profileVideoUrl = (rawPhotos.find((p: string) => p.startsWith('video:')) ?? '').replace('video:', '') || null;

  if (activeSection === 'settings') {
    return <div className="h-full"><SettingsPage onClose={() => setActiveSection('main')} /></div>;
  }

  if (activeSection === 'referral') {
    return <div className="h-full"><ReferralSystem onClose={() => setActiveSection('main')} /></div>;
  }

  if (activeSection === 'quiz') {
    return (
      <CompatibilityQuiz
        onClose={() => setActiveSection('main')}
        onSave={(type, score) => {
          setActiveSection('main');
        }}
      />
    );
  }

  if (activeSection === 'donation') {
    return <div className="h-full"><DonationPage onClose={() => setActiveSection('main')} /></div>;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden pb-8">
      {/* Hero */}
      <div className="relative h-64">
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-card-overlay" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-primary-foreground">{displayName}, {age}</h2>
                {isVerified && <Shield className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/70 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{city || 'Dodaj miasto'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Verification prompt */}
        {!isVerified && (
          <motion.button initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowFaceVerify(true)}
            className="w-full glass border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-primary">Zweryfikuj profil 🔵</p>
              <p className="text-xs text-muted-foreground">Zwiększ zaufanie i widoczność wśród dopasowań</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary" />
          </motion.button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Polubienia', value: stats.likes, emoji: '💚' },
            { label: 'Dopasowania', value: stats.matches, emoji: '🔥' },
            { label: 'Super Like', value: stats.superLikes, emoji: '⭐' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-3 text-center">
              <div className="text-xl">{stat.emoji}</div>
              <div className="text-lg font-black">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Strength & Gamification */}
        <div className="glass rounded-3xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-fire flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Poziom Profilu</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Spark Level 4</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black gradient-text">850 XP</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Do następnego poziomu</span>
              <span className="text-primary">150 XP</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: '85%' }} 
                className="h-full gradient-fire rounded-full" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="glass-dark p-2.5 rounded-2xl border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✅</div>
              <span className="text-[10px] font-medium">Profil 90%</span>
            </div>
            <div className="glass-dark p-2.5 rounded-2xl border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">💬</div>
              <span className="text-[10px] font-medium">Top Chatter</span>
            </div>
          </div>
        </div>

        {/* Profile Boost — free, ad-based */}
        <div className="glass rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Boost profilu</p>
                <p className="text-xs text-muted-foreground">10× więcej wyświetleń przez 24h — bezpłatnie!</p>
              </div>
            </div>
            {isBoosted ? (
              <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary">Aktywny!</span>
              </div>
            ) : (
              <button onClick={() => { setRewardType('boost_24h'); setShowRewardedAd(true); }}
                className="gradient-fire text-primary-foreground text-xs px-3 py-1.5 rounded-full font-semibold">
                Aktywuj
              </button>
            )}
          </div>
          {!isBoosted && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Obejrzyj krótką reklamę aby aktywować boost 🎯
            </p>
          )}
        </div>

        {/* Mood — 18+ */}
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Czego szukasz?</p>
          <div className="flex gap-2 flex-wrap">
            {moodOptions.map(mood => (
              <button key={mood.value} onClick={() => updateProfile({ mood_status: mood.value })}
                className={`text-sm px-3 py-1.5 rounded-full transition-all ${activeMood === mood.value ? 'gradient-fire text-primary-foreground font-medium' : 'glass text-muted-foreground'}`}>
                {mood.value}
              </button>
            ))}
          </div>
        </div>

        <EditableField label="Imię" value={displayName} maxLength={40} onSave={async v => updateProfile({ display_name: v })} />
        <EditableField label="Wiek" value={String(age)} type="number" onSave={async v => { const n = parseInt(v, 10); if (n >= 18 && n <= 99) await updateProfile({ age: n }); }} />
        <div className="flex gap-2 items-stretch">
          <div className="flex-1">
            <EditableField label="Miasto" value={city} maxLength={60} onSave={async v => updateProfile({ city: v })} />
          </div>
          <button onClick={handleDetectLocation} disabled={geoLoading} title="Wykryj automatycznie"
            className="glass rounded-2xl px-3 flex items-center justify-center border border-border hover:border-primary/40 transition-colors">
            {geoLoading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <LocateFixed className="w-4 h-4 text-primary" />}
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">O mnie ✨</h3>
            <span className="text-[10px] text-primary font-black italic uppercase">Luxury Profile</span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-20 blur group-focus-within:opacity-100 transition-opacity" />
            <EditableField 
              label="Opis profilu" 
              value={bio} 
              multiline 
              maxLength={2500} 
              onSave={async v => updateProfile({ bio: v })} 
            />
          </div>
        </div>
        
        {/* Enhanced Profile Attributes */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">O mnie</h3>
          <div className="grid grid-cols-2 gap-3">
            <EditableField label="Wzrost (cm)" value={String(profile?.height || '')} type="number" onSave={async v => updateProfile({ height: parseInt(v, 10) })} />
            <SelectField label="Sylwetka" value={profile?.body_type || ''} options={BODY_TYPES} onSave={async v => updateProfile({ body_type: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Kolor oczu" value={profile?.eye_color || ''} options={EYE_COLORS} onSave={async v => updateProfile({ eye_color: v })} />
            <SelectField label="Kolor włosów" value={profile?.hair_color || ''} options={HAIR_COLORS} onSave={async v => updateProfile({ hair_color: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Palenie" value={profile?.smoking || ''} options={SMOKING} onSave={async v => updateProfile({ smoking: v })} />
            <SelectField label="Alkohol" value={profile?.drinking || ''} options={DRINKING} onSave={async v => updateProfile({ drinking: v })} />
          </div>
          <SelectField label="Wykształcenie" value={profile?.education || ''} options={EDUCATION} onSave={async v => updateProfile({ education: v })} />
          <EditableField label="Zawód" value={profile?.occupation || ''} onSave={async v => updateProfile({ occupation: v })} />
        </div>

        <InterestsEditor interests={interests} onSave={async tags => updateProfile({ interests: tags })} />

        {/* Dostępny teraz — tryb spontaniczny */}
        <AvailableNowToggle />

        {/* Prywatne zdjęcia */}
        {user && <MyPrivatePhotos userId={user.id} />}

        {user && (
          <ProfilePhotoGallery
            photos={displayPhotos} profileVideo={profileVideoUrl} userId={user.id} user={user}
            onPhotosChange={refetch} onVideoChange={refetch}
            updateProfile={updateProfile as (u: Record<string, unknown>) => Promise<unknown>}
          />
        )}

        {/* Stats & activity — placeholder for real data */}
        <div className="glass rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Aktywność tego tygodnia</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Polubienia profilu', value: stats.likes.toLocaleString() },
              { label: 'Dopasowania',        value: stats.matches.toString() },
              { label: 'Super Like\'i',      value: stats.superLikes.toString() },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <button onClick={() => setActiveSection('referral')} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-lg">🎁</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Zaproś znajomych</p>
              <p className="text-xs text-muted-foreground">Odbierz 7 dni "Kto mnie polubił" za polecenie</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={() => setActiveSection('quiz')} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-primary/20">
            <div className="w-9 h-9 rounded-xl gradient-fire flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Quiz kompatybilności 18+</p>
              <p className="text-xs text-muted-foreground">Poznaj swój typ seksualny 💘</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={() => setActiveSection('donation')} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-accent/20">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-lg">💖</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Wesprzyj Spark Connect</p>
              <p className="text-xs text-muted-foreground">Aplikacja jest darmowa — ale możesz pomóc 🙏</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={() => setActiveSection('settings')} className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Ustawienia</p>
              <p className="text-xs text-muted-foreground">Prywatność, powiadomienia, GDPR</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={async () => { await supabase.auth.signOut(); setView('landing'); }}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-destructive/20">
            <div className="w-9 h-9 rounded-xl bg-destructive/20 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <span className="font-medium text-sm text-destructive">Wyloguj się</span>
          </button>
        </div>

        {/* App info */}
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl mb-2">🔥</p>
          <p className="font-bold gradient-text">Spark Connect</p>
          <p className="text-xs text-muted-foreground mt-1">Całkowicie bezpłatna aplikacja randkowa</p>
          <p className="text-xs text-muted-foreground">Wspierana reklamami · Bez ukrytych opłat</p>
        </div>
      </div>

      <AnimatePresence>
        {showFaceVerify && <FaceVerify onVerified={handleVerified} onClose={() => setShowFaceVerify(false)} />}
      <AnimatePresence>
        {showRewardedAd && (
          <RewardedAd reward={rewardType} onComplete={() => { setShowRewardedAd(false); setIsBoosted(true); }} onClose={() => setShowRewardedAd(false)} />
        )}
      </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
