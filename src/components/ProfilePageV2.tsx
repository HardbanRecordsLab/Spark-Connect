// @ts-ignore
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import { Settings, Edit, Shield, MapPin, ChevronRight, LogOut, Check, X, Plus, TrendingUp, Zap, LocateFixed, Loader2, Sparkles, User, Heart, MessageSquare, Camera, Search, Bell, Menu, Home, BarChart3, Users, Target, Award, Lock, Eye, Globe, Smartphone, Mail, Database, Coins, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSeo } from '@/hooks/useSeo';
import SettingsPage from '@/components/SettingsPage';
import FaceVerify from '@/components/FaceVerify';
import ProfilePhotoGallery from '@/components/ProfilePhotoGallery';
import ReferralSystem from '@/components/ReferralSystem';
import { AvailableNowToggle } from '@/components/AvailableNow';
import { MyPrivatePhotos } from '@/components/PrivatePhotos';
import CompatibilityQuiz from '@/components/CompatibilityQuiz';
import DonationPage from '@/components/DonationPage';
import RewardedAd from '@/components/RewardedAd';
import { useCoinBalance } from '@/hooks/useCoinBalance';

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

const BODY_TYPES = ['Szczupła', 'Normalna', 'Atletyczna', 'Krągła', 'Muskularna', 'Puszysta', 'Kulturysta'];
const BREAST_SIZE = ['A', 'B', 'C', 'D', 'E', 'F', 'G+', 'Brak danych'];
const PUBIC_HAIR = ['Całkowicie ogolone', 'Przystrzyżone', 'Naturalne', 'Pasek'];
const EYE_COLORS = ['Niebieskie', 'Brązowe', 'Zielone', 'Szare', 'Piwne', 'Czarne'];
const HAIR_COLORS = ['Czarne', 'Blond', 'Brązowe', 'Rude', 'Siwe', 'Łysy', 'Kolorowe'];
const SMOKING = ['Nigdy', 'Okazyjnie', 'Regularnie', 'Tylko e-papierosy'];
const DRINKING = ['Nigdy', 'Okazyjnie', 'W weekendy', 'Regularnie'];
const EDUCATION = ['Podstawowe', 'Średnie', 'Wyższe', 'Student', 'Doktorat'];
const TATTOOS = ['Brak', 'Kilka małych', 'Wiele dużych', 'Całe ciało'];
const PIERCING = ['Brak', 'Mało widoczny', 'Wiele'];
const RELATIONSHIP_GOALS = ['Zabawa i seks 🔥', 'Randki bez zobowiązań 🌙', 'Szukam miłości 💍', 'Przyjaźń 🤝', 'Trójkąty/Poliamoria 🌈'];
const SEXUAL_ORIENTATION = ['Hetero', 'Bi', 'Homo', 'Panseksualny', 'Ciekawski'];
const LOOKING_FOR = ['Kobieta', 'Mężczyzna', 'Para (KM)', 'Para (KK)', 'Para (MM)', 'Trans/CD'];

const LIKES_DISLIKES = {
  likes: ['Seks oralny', 'Seks analny', 'BDSM', 'Fetysz stóp', 'Roleplay', 'Szybki numerek', 'Długie sesje', 'Seks w miejscu publicznym', 'Zabawki', 'Lekkie wiązanie'],
  dislikes: ['Brak higieny', 'Palenie przy seksie', 'Zbyt szybkie tempo', 'Brak zabezpieczeń', 'Nuda w łóżku', 'Agresja']
};

const SEXUAL_PREFERENCES = [
  'Dominujący/a 👑', 'Uległy/a ⛓️', 'Switch 🔄', 'Vanilla 🍦', 'Kinky 👅', 'Voyeur 👁️', 'Exhibitionist 🍑', 'Swinger 🍍'
];

const SAFE_SEX = ['Zawsze', 'Zależy od osoby', 'Nie używam', 'Tylko z partnerem'];

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

export default function ProfilePageV2() {
  useSeo({ title: 'Twój profil', description: 'Zarządzaj swoim profilem Spark Connect.', noindex: true });

  const { currentUser, setView } = useAppStore();
  const { user, isAdmin } = useAuth();
  const { profile, updateProfile, refetch } = useProfile(user);
  const { requestLocation, loading: geoLoading } = useGeolocation();
  const { balance: coinBalance, claimAdReward } = useCoinBalance(user?.id);
  const [activeSection, setActiveSection] = useState<'main' | 'settings' | 'referral' | 'quiz' | 'donation' | 'analytics' | 'privacy' | 'notifications' | 'advanced'>('main');
  const [activeTab, setActiveTab] = useState<'profil' | 'preferencje' | 'pytania' | 'statystyki' | 'prywatnosc' | 'powiadomienia' | 'ustawienia'>('profil');
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardType, setRewardType] = useState<'boost_24h' | 'who_liked_me_24h' | 'coins_ad'>('boost_24h');
  const [isBoosted, setIsBoosted] = useState(false);

  // Helper function for safe profile updates with error handling
  const safeUpdateProfile = async (updates: any, successMessage?: string) => {
    try {
      await updateProfile(updates);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error('Błąd zapisu. Spróbuj ponownie.');
      console.error('Profile update failed:', error);
    }
  };

  const handleDetectLocation = async () => {
    try {
      const pos = await requestLocation();
      if (pos) {
        await safeUpdateProfile({ city: pos.city }, 'Lokalizacja zaktualizowana');
      }
    } catch (error) {
      toast.error('Błąd wykrywania lokalizacji');
      console.error('Location detection failed:', error);
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

  const handleVerified = () => {
    // is_verified is admin-only server-side (see migration
    // 20260729000002_profiles_security_hardening.sql) — face
    // verification isn't wired to a real review pipeline yet, so we
    // no longer claim instant success here.
    setShowFaceVerify(false);
    toast.success('Zgłoszenie wysłane do weryfikacji przez administratora.');
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
        onSave={() => {
          setActiveSection('main');
        }}
      />
    );
  }

  if (activeSection === 'donation') {
    return <div className="h-full"><DonationPage onClose={() => setActiveSection('main')} /></div>;
  }

  return (
    <div className="h-full flex bg-[#0D0B14] text-[#F2EEE8] font-['DM_Sans'] overflow-hidden">
      {/* BACKGROUND MESH */}
      <div className="fixed inset-0 opacity-60 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(232,67,26,0.1)] via-transparent to-[rgba(212,168,67,0.05)]"></div>
      </div>

      {/* SIDEBAR */}
      <div className="w-64 bg-[#16121F] border-r border-[rgba(255,255,255,0.09)] flex flex-col relative z-10">
        {/* Profile Completion */}
        <div className="mx-3 my-3 bg-gradient-to-br from-[rgba(232,67,26,0.12)] to-[rgba(212,168,67,0.08)] border border-[rgba(232,67,26,0.2)] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-[rgba(242,238,232,0.55)]">Kompletność profilu</span>
            <span className="font-['JetBrains_Mono'] text-[13px] text-[#D4A843] font-medium">72%</span>
          </div>
          <div className="h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E8431A] to-[#D4A843] rounded-full" style={{width: '72%'}}></div>
          </div>
          <div className="text-[10px] text-[rgba(242,238,232,0.3)] mt-1.5">Dodaj więcej zdjęć +15%</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {[
            { id: 'profil', label: 'Profil', icon: <User className="w-4 h-4" /> },
            { id: 'preferencje', label: 'Preferencje', icon: <Heart className="w-4 h-4" /> },
            { id: 'pytania', label: 'Q&A', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'statystyki', label: 'Statystyki', icon: <BarChart3 className="w-4 h-4" />, badge: '🔥' },
            { id: 'prywatnosc', label: 'Prywatność', icon: <Lock className="w-4 h-4" /> },
            { id: 'powiadomienia', label: 'Powiadomienia', icon: <Bell className="w-4 h-4" /> },
            { id: 'ustawienia', label: 'Ustawienia', icon: <Settings className="w-4 h-4" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[13px] ${
                activeTab === item.id 
                  ? 'bg-[rgba(232,67,26,0.14)] text-[#FF6B35]' 
                  : 'text-[rgba(242,238,232,0.55)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F2EEE8]'
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className="text-xs">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.09)]">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] cursor-pointer">
            <div className="w-8.5 h-8.5 bg-gradient-to-br from-[#E8431A] to-[#D4A843] rounded-full flex items-center justify-center text-sm font-bold">
              {displayName?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium truncate">{displayName}</div>
              <div className="text-[10.5px] text-[#2ECC71]">Premium</div>
            </div>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); setView('landing'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] text-[#E8431A] transition-all text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Wyloguj</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {/* COVER */}
        <div className="h-56 bg-gradient-to-br from-[#1a0800] via-[#2d0e10] to-[#0b0016] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent"></div>
          <img src={avatarUrl} alt="" className="w-full h-full object-cover opacity-60" />
          
          {/* Cover Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="px-3.5 py-2 bg-[rgba(0,0,0,0.45)] backdrop-blur-md border border-[rgba(255,255,255,0.14)] text-[rgba(242,238,232,0.55)] text-[12px] rounded-full hover:text-[#F2EEE8] transition-all">
              Zmień cover
            </button>
            {isAdmin && (
              <a href="/admin" target="_blank" className="px-3.5 py-2 bg-[rgba(232,67,26,0.3)] border border-[rgba(232,67,26,0.5)] text-[#F2EEE8] text-[12px] rounded-full animate-pulse">
                Admin Panel
              </a>
            )}
          </div>

          {/* Profile Info */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">{displayName}, {age}</h2>
                  {isVerified && <Shield className="w-5 h-5 text-[#E8431A]" />}
                </div>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{city || 'Dodaj miasto'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-5">
          {/* PROFIL TAB */}
          {activeTab === 'profil' && (
            <div className="space-y-4">
              {/* Coin balance + earn via ad */}
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Saldo coinów</p>
                  <p className="font-bold text-sm">🪙 {coinBalance ?? '—'}</p>
                </div>
                <button
                  onClick={() => { setRewardType('coins_ad'); setShowRewardedAd(true); }}
                  className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold text-accent border border-accent/30"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> +20
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Polubienia', value: stats.likes, emoji: '💚', color: 'from-green-500/20 to-green-500/5' },
                  { label: 'Dopasowania', value: stats.matches, emoji: '🔥', color: 'from-orange-500/20 to-orange-500/5' },
                  { label: 'Super Like', value: stats.superLikes, emoji: '⭐', color: 'from-blue-500/20 to-blue-500/5' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-xl p-3 text-center`}>
                    <div className="text-xl mb-1">{stat.emoji}</div>
                    <div className="text-lg font-black">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Profile Strength */}
              <div className="bg-gradient-to-br from-[rgba(232,67,26,0.05)] to-transparent border border-[rgba(232,67,26,0.2)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#E8431A] to-[#D4A843] rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Poziom Profilu</p>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">Spark Level 4</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black bg-gradient-to-r from-[#E8431A] to-[#D4A843] bg-clip-text text-transparent">850 XP</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/60">Do następnego poziomu</span>
                    <span className="text-[#E8431A]">150 XP</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E8431A] to-[#D4A843] rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>

              {/* Boost */}
              <div className="bg-gradient-to-br from-[rgba(232,67,26,0.05)] to-transparent border border-[rgba(232,67,26,0.2)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#E8431A] to-[#D4A843] rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Boost profilu</p>
                      <p className="text-xs text-white/60">10× więcej wyświetleń przez 24h — bezpłatnie!</p>
                    </div>
                  </div>
                  {isBoosted ? (
                    <div className="flex items-center gap-1.5 bg-[rgba(232,67,26,0.2)] border border-[rgba(232,67,26,0.3)] px-3 py-1.5 rounded-full">
                      <Zap className="w-3 h-3 text-[#E8431A]" />
                      <span className="text-xs font-bold text-[#E8431A]">Aktywny!</span>
                    </div>
                  ) : (
                    <button onClick={() => { setRewardType('boost_24h'); setShowRewardedAd(true); }}
                      className="bg-gradient-to-r from-[#E8431A] to-[#D4A843] text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                      Aktywuj
                    </button>
                  )}
                </div>
              </div>

              {/* Mood */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-white/60 mb-2">Czego szukasz?</p>
                <div className="flex gap-2 flex-wrap">
                  {moodOptions.map(mood => (
                    <button key={mood.value} onClick={() => safeUpdateProfile({ mood_status: mood.value })}
                      className={`text-sm px-3 py-1.5 rounded-full transition-all ${
                        activeMood === mood.value 
                          ? 'bg-gradient-to-r from-[#E8431A] to-[#D4A843] text-white font-medium' 
                          : 'bg-white/5 text-white/60'
                      }`}>
                      {mood.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <EditableField label="Imię" value={displayName} maxLength={40} onSave={async v => { await safeUpdateProfile({ display_name: v }, 'Imię zaktualizowane'); }} />
              <EditableField label="Wiek" value={String(age)} type="number" onSave={async v => { const n = parseInt(v, 10); if (n >= 18 && n <= 99) await safeUpdateProfile({ age: n }, 'Wiek zaktualizowany'); }} />
              <div className="flex gap-2 items-stretch">
                <div className="flex-1">
                  <EditableField label="Miasto" value={city} maxLength={60} onSave={async v => { await safeUpdateProfile({ city: v }, 'Miasto zaktualizowane'); }} />
                </div>
                <button onClick={handleDetectLocation} disabled={geoLoading} title="Wykryj automatycznie"
                  className="bg-white/5 rounded-xl px-3 flex items-center justify-center border border-white/10 hover:border-[#E8431A]/40 transition-colors">
                  {geoLoading ? <Loader2 className="w-4 h-4 text-[#E8431A] animate-spin" /> : <LocateFixed className="w-4 h-4 text-[#E8431A]" />}
                </button>
              </div>

              {/* Bio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">O mnie ✨</h3>
                  <span className="text-[10px] text-[#E8431A] font-black italic uppercase">Luxury Profile</span>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[rgba(232,67,26,0.2)] via-[rgba(212,168,67,0.2)] to-[rgba(232,67,26,0.2)] opacity-20 blur group-focus-within:opacity-100 transition-opacity"></div>
                  <EditableField 
                    label="Opis profilu" 
                    value={bio} 
                    multiline 
                    maxLength={2500} 
                    onSave={async v => { await safeUpdateProfile({ bio: v }, 'Opis zaktualizowany'); }} 
                  />
                </div>
              </div>

              {/* Interests */}
              <InterestsEditor interests={interests} onSave={async tags => { await safeUpdateProfile({ interests: tags }, 'Zainteresowania zaktualizowane'); }} />

              {/* Available Now */}
              <AvailableNowToggle />

              {/* Photos */}
              {user && (
                <ProfilePhotoGallery
                  photos={displayPhotos} profileVideo={profileVideoUrl} userId={user.id} user={user}
                  onPhotosChange={refetch} onVideoChange={refetch}
                  updateProfile={updateProfile as (u: Record<string, unknown>) => Promise<unknown>}
                />
              )}

              {/* Private Photos */}
              {user && <MyPrivatePhotos userId={user.id} />}

              {/* Quick Actions */}
              <div className="space-y-2">
                <button onClick={() => setActiveSection('referral')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(232,67,26,0.2)] flex items-center justify-center">
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Zaproś znajomych</p>
                    <p className="text-xs text-white/60">Odbierz 7 dni "Kto mnie polubił" za polecenie</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>

                <button onClick={() => setActiveSection('quiz')} className="w-full bg-white/5 border border-[rgba(232,67,26,0.2)] rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8431A] to-[#D4A843] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Quiz kompatybilności 18+</p>
                    <p className="text-xs text-white/60">Poznaj swój typ seksualny 💘</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>

                <button onClick={() => setActiveSection('settings')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Ustawienia</p>
                    <p className="text-xs text-white/60">Prywatność, powiadomienia, GDPR</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          )}

          {/* PREFERENCJE TAB */}
          {activeTab === 'preferencje' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-4">🎯 Wyróżniki profilu</h3>
                <p className="text-sm text-white/60 mb-4">Krótkie odpowiedzi na pytania — zwiększa dopasowania o 3×</p>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-[rgba(232,67,26,0.1)] to-transparent border-l-3 border-[#E8431A] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white/80 mb-1">Najlepsza przygoda, jaką przeżyłam</p>
                    <p className="text-sm text-white/60">"Spontaniczny wyjazd do Lizbony z kartą tylko w jedną stronę — wróciłam po 3 tygodniach z milionem zdjęć i nową perspektywą"</p>
                  </div>
                  <div className="bg-gradient-to-br from-[rgba(212,168,67,0.1)] to-transparent border-l-3 border-[#D4A843] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white/80 mb-1">Kontrowersyjna opinia, którą się przyznam</p>
                    <p className="text-sm text-white/60">"Piekarnia otwarta przed 9:00 jest moralnym dobrem bezwzględnym"</p>
                  </div>
                  <div className="bg-gradient-to-br from-[rgba(155,89,182,0.1)] to-transparent border-l-3 border-[#9B59B6] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white/80 mb-1">To, czego szukam u kogoś</p>
                    <p className="text-sm text-white/60">"Kogoś, kto umie słuchać i nie boi się być szczery — nawet gdy to trudne"</p>
                  </div>
                </div>
                <div className="text-center pt-3">
                  <button className="text-sm text-white/60 hover:text-white transition-colors">Zmień pytania</button>
                </div>
              </div>

              {/* Physical Attributes */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Dane podstawowe</h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditableField label="Wzrost (cm)" value={String(profile?.height || '')} type="number" onSave={async v => { await safeUpdateProfile({ height: parseInt(v, 10) }, 'Wzrost zaktualizowany'); }} />
                  <SelectField label="Sylwetka" value={profile?.body_type || ''} options={BODY_TYPES} onSave={async v => { await safeUpdateProfile({ body_type: v }, 'Sylwetka zaktualizowana'); }} />
                  <SelectField label="Biust" value={profile?.breast_size || ''} options={BREAST_SIZE} onSave={async v => { await safeUpdateProfile({ breast_size: v }, 'Biust zaktualizowany'); }} />
                  <SelectField label="Włosy łonowe" value={profile?.pubic_hair || ''} options={PUBIC_HAIR} onSave={async v => { await safeUpdateProfile({ pubic_hair: v }, 'Włosy łonowe zaktualizowane'); }} />
                  <SelectField label="Kolor oczu" value={profile?.eye_color || ''} options={EYE_COLORS} onSave={async v => { await safeUpdateProfile({ eye_color: v }, 'Kolor oczu zaktualizowany'); }} />
                  <SelectField label="Kolor włosów" value={profile?.hair_color || ''} options={HAIR_COLORS} onSave={async v => { await safeUpdateProfile({ hair_color: v }, 'Kolor włosów zaktualizowany'); }} />
                  <SelectField label="Palenie" value={profile?.smoking || ''} options={SMOKING} onSave={async v => { await safeUpdateProfile({ smoking: v }, 'Palenie zaktualizowane'); }} />
                  <SelectField label="Alkohol" value={profile?.drinking || ''} options={DRINKING} onSave={async v => { await safeUpdateProfile({ drinking: v }, 'Alkohol zaktualizowany'); }} />
                  <SelectField label="Tatuaże" value={profile?.tattoos || ''} options={TATTOOS} onSave={async v => { await safeUpdateProfile({ tattoos: v }, 'Tatuaże zaktualizowane'); }} />
                  <SelectField label="Piercing" value={profile?.piercing || ''} options={PIERCING} onSave={async v => { await safeUpdateProfile({ piercing: v }, 'Piercing zaktualizowany'); }} />
                </div>
              </div>

              {/* Sexual Preferences */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#E8431A] mb-4">Upodobania Seksualne 18+ 🔥</h3>
                <div className="space-y-3">
                  <SelectField label="Cel relacji" value={profile?.relationship_goal || ''} options={RELATIONSHIP_GOALS} onSave={async v => { await safeUpdateProfile({ relationship_goal: v }, 'Cel relacji zaktualizowany'); }} />
                  <SelectField label="Orientacja" value={profile?.orientation || ''} options={SEXUAL_ORIENTATION} onSave={async v => { await safeUpdateProfile({ orientation: v }, 'Orientacja zaktualizowana'); }} />
                  <SelectField label="Szukam" value={profile?.looking_for_gender || ''} options={LOOKING_FOR} onSave={async v => { await safeUpdateProfile({ looking_for_gender: v }, 'Preferencje zaktualizowane'); }} />
                  <SelectField label="Rola w łóżku" value={profile?.sexual_role || ''} options={SEXUAL_PREFERENCES} onSave={async v => { await safeUpdateProfile({ sexual_role: v }, 'Rola w łóżku zaktualizowana'); }} />
                  <SelectField label="Bezpieczny seks" value={profile?.safe_sex || ''} options={SAFE_SEX} onSave={async v => { await safeUpdateProfile({ safe_sex: v }, 'Bezpieczny seks zaktualizowany'); }} />
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold mb-3">To co uwielbiam 👅</p>
                  <div className="flex flex-wrap gap-2">
                    {LIKES_DISLIKES.likes.map(tag => {
                      const sel = (profile?.likes || []).includes(tag);
                      return (
                        <button key={tag} onClick={async () => {
                          const prev = profile?.likes || [];
                          const next = sel ? prev.filter((t: string) => t !== tag) : [...prev, tag];
                          await safeUpdateProfile({ likes: next });
                        }}
                        className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                          sel ? 'bg-gradient-to-r from-[#E8431A] to-[#D4A843] text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60'
                        }`}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold mb-3">Tego nie lubię 🚫</p>
                  <div className="flex flex-wrap gap-2">
                    {LIKES_DISLIKES.dislikes.map(tag => {
                      const sel = (profile?.dislikes || []).includes(tag);
                      return (
                        <button key={tag} onClick={async () => {
                          const prev = profile?.dislikes || [];
                          const next = sel ? prev.filter((t: string) => t !== tag) : [...prev, tag];
                          await safeUpdateProfile({ dislikes: next });
                        }}
                        className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                          sel ? 'bg-red-500 text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60'
                        }`}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <SelectField label="Wykształcenie" value={profile?.education || ''} options={EDUCATION} onSave={async v => { await safeUpdateProfile({ education: v }, 'Wykształcenie zaktualizowane'); }} />
              <EditableField label="Zawód" value={profile?.occupation || ''} onSave={async v => { await safeUpdateProfile({ occupation: v }, 'Zawód zaktualizowany'); }} />
            </div>
          )}

          {/* STATYSTYKI TAB */}
          {activeTab === 'statystyki' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3">🎯 Wskaźniki profilu</h3>
                  <p className="text-sm text-white/40">Statystyki pojawią się, gdy zbierzemy wystarczająco danych o Twoim profilu.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3">👥 Demografika oglądających</h3>
                  <p className="text-sm text-white/40">Zobaczysz to, gdy Twój profil zacznie zbierać odsłony.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3">💡 Rekomendacje SparkAI</h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-[rgba(212,168,67,0.1)] to-transparent border-l-3 border-[#D4A843] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white/80 mb-1">Dodaj więcej zdjęć</p>
                    <p className="text-sm text-white/60">Profile z 7+ zdjęciami otrzymują 3× więcej dopasowań.</p>
                  </div>
                  <div className="bg-gradient-to-br from-[rgba(46,204,113,0.1)] to-transparent border-l-3 border-[#2ECC71] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white/80 mb-1">Uzupełnij orientację seksualną</p>
                    <p className="text-sm text-white/60">Zwiększa trafność dopasowań algorytmu o 35%.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USTAWIENIA TAB -- real, functional. Used to be three separate
              sidebar tabs (Prywatność/Powiadomienia/Ustawienia) that were
              100% decorative: every toggle and button (including the ones
              promising GDPR data export and account deletion) had no
              onClick handler at all. The real implementation already
              existed as SettingsPage.tsx (used elsewhere via
              setActiveSection('settings')), just never wired in here.
              Consolidated to one real entry point instead of three fake
              ones. */}

          {activeTab === 'prywatnosc' && (
            <div className="h-[80vh] -mx-4 -mb-4">
              <SettingsPage initialSection="privacy" onClose={() => setActiveTab('profil')} />
            </div>
          )}
          {activeTab === 'powiadomienia' && (
            <div className="h-[80vh] -mx-4 -mb-4">
              <SettingsPage initialSection="notifications" onClose={() => setActiveTab('profil')} />
            </div>
          )}
          {activeTab === 'ustawienia' && (
            <div className="h-[80vh] -mx-4 -mb-4">
              <SettingsPage onClose={() => setActiveTab('profil')} />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFaceVerify && <FaceVerify userId={user?.id} onVerified={handleVerified} onClose={() => setShowFaceVerify(false)} />}
        {showRewardedAd && (
          <RewardedAd
            reward={rewardType}
            onComplete={async () => {
              setShowRewardedAd(false);
              if (rewardType === 'coins_ad') {
                const result = await claimAdReward();
                if ('error' in result) toast.error(result.error);
                else toast.success(`+20 coinów! Nowe saldo: ${result.balance} 🪙`);
              } else {
                setIsBoosted(true);
              }
            }}
            onSkip={() => setShowRewardedAd(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
