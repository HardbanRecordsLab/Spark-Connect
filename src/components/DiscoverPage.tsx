import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Filter, MapPin, Shield, Ghost, Sparkles, Video, Clock, Crown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/store/appStore';
import FilterPanel, { type DiscoverFilters, DEFAULT_FILTERS } from '@/components/FilterPanel';
import { AvailableNowSection } from '@/components/AvailableNow';
import { StoriesBar } from '@/components/StoriesSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoverProfiles } from '@/hooks/useDiscoverProfiles';
import { WhisperModal } from '@/components/WhisperMessage';
import { SuperSwipeModal } from '@/components/SuperSwipe';
import ReferralSystem from '@/components/ReferralSystem';
import { toast } from 'sonner';

const db = supabase as any;

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
function isProfileOnline(lastOnlineAt?: string): boolean {
  if (!lastOnlineAt) return false;
  return Date.now() - new Date(lastOnlineAt).getTime() < ONLINE_WINDOW_MS;
}

function ProfileGridItem({ profile, onSelect }: { profile: Profile; onSelect: (p: Profile) => void }) {
  const isOnline = isProfileOnline(profile.lastOnlineAt);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(profile)}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer shadow-xl bg-muted ${
        profile.isAmbassador ? 'border-2 border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.35)]' : 'border border-white/5'
      }`}
    >
      <img
        src={profile.photos[0]}
        alt={profile.displayName}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Top badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {profile.isVerified && (
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border border-white/10">
            <Shield className="w-3 h-3 text-white" />
          </div>
        )}
        {profile.donorBadge && (
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border border-white/10">
            <Star className="w-3 h-3 text-white" />
          </div>
        )}
        {profile.isAmbassador && (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border border-white/10" title="Ambassador Elite">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Online indicator */}
      {isOnline && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 glass-strong px-2 py-0.5 rounded-full border border-green-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">Online</span>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="flex items-center justify-between items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-white truncate">{profile.displayName}</span>
              <span className="text-xs text-white/80">{profile.age}</span>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-white/60">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate">{profile.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <span>{profile.chemistryScore}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { triggerMatch } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const { user } = useAuth();
  const { profiles: dbProfiles, loading: loadingProfiles, recordSwipe: markSwiped } = useDiscoverProfiles(user?.id ?? null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'new' | 'nearby'>('all');
  const [showWhisper, setShowWhisper] = useState(false);
  const [matching, setMatching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showSuperSwipe, setShowSuperSwipe] = useState(false);
  const [superSwipeDailyUsed, setSuperSwipeDailyUsed] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    setAllProfiles(dbProfiles);
  }, [dbProfiles]);

  const handleMatch = async (profile: Profile) => {
    if (!user || matching) return;
    setMatching(true);
    const { data, error } = await db.rpc('record_swipe', { p_swiped_id: profile.id, p_direction: 'right' });
    setMatching(false);
    setSelectedProfile(null);
    if (error) { toast.error('Nie udało się zapisać polubienia. Spróbuj ponownie.'); return; }
    markSwiped(profile.id);
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.matched) {
      triggerMatch(profile);
    } else {
      toast.success(`Polubiono ${profile.displayName} 💚`);
    }
  };

  const SUPER_SWIPE_FREE_DAILY = 1;

  const openSuperSwipe = async () => {
    if (!user) return;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { count } = await db.from('super_swipes').select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id).gte('created_at', todayStart.toISOString());
    setSuperSwipeDailyUsed((count ?? 0) >= SUPER_SWIPE_FREE_DAILY);
    setShowSuperSwipe(true);
  };

  const handleSuperSwipeSend = async (profile: Profile, message: string) => {
    if (!user) return;
    await db.from('super_swipes').upsert(
      { sender_id: user.id, receiver_id: profile.id, message },
      { onConflict: 'sender_id,receiver_id' }
    );
    const { data } = await db.rpc('record_swipe', { p_swiped_id: profile.id, p_direction: 'super' });
    markSwiped(profile.id);
    const result = Array.isArray(data) ? data[0] : data;
    setTimeout(() => {
      setShowSuperSwipe(false);
      setSelectedProfile(null);
      if (result?.matched) triggerMatch(profile);
    }, 1400);
  };

  const filteredProfiles = allProfiles.filter(p => {
    if (!p) return false;
    
    // Tab filtering
    if (activeTab === 'online' && !isProfileOnline(p.lastOnlineAt)) return false;
    if (activeTab === 'nearby' && p.distance && p.distance > 50) return false;
    
    // Custom filters
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    if (filters.gender.length > 0 && !filters.gender.map(g => g.toLowerCase()).includes((p.gender ?? '').toLowerCase())) return false;
    if (filters.verifiedOnly && !p.isVerified) return false;
    if (filters.withPhotosOnly && (!p.photos || p.photos.length === 0)) return false;
    
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Quick Filters / Tabs */}
      <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide glass sticky top-0 z-20 border-b border-white/5">
        {[
          { id: 'all', label: 'Wszyscy', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'online', label: 'Online', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
          { id: 'new', label: 'Nowe', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'nearby', label: 'Blisko', icon: <MapPin className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              activeTab === tab.id 
                ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(255,26,78,0.2)]' 
                : 'glass border-white/5 text-muted-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-2 pl-4 border-l border-white/10">
          <button 
            onClick={() => setShowFilters(true)}
            className="w-9 h-9 glass rounded-xl flex items-center justify-center border border-white/10 text-primary"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pt-4 pb-24">
        {/* Stories strip */}
        <div className="mb-4 -mx-1">
          <StoriesBar />
        </div>

        {/* Available Now strip */}
        <div className="mb-6">
          <AvailableNowSection onSelectProfile={(id) => {
            const p = allProfiles.find(p => p.id === id);
            if (p) setSelectedProfile(p);
          }} />
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="w-1 h-4 gradient-fire rounded-full" />
            {activeTab === 'online' ? 'Dostępni teraz' : activeTab === 'new' ? 'Nowe profile' : 'Odkrywaj profile'}
          </h2>
          <span className="text-[10px] font-bold text-primary px-2 py-1 glass rounded-lg border border-primary/20">
            {filteredProfiles.length} PROFILI
          </span>
        </div>

        {filteredProfiles.length < 10 && (
          <motion.button
            onClick={() => setShowReferral(true)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-6 flex items-center gap-3 glass rounded-2xl border border-amber-500/20 px-4 py-3 text-left hover:border-amber-500/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Crown className="text-amber-500 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-500">Bądź pierwszy w okolicy</p>
              <p className="text-xs text-white/50 truncate">Zero botów. Zaproś kogoś, odblokuj status Ambassador Elite.</p>
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase whitespace-nowrap flex-shrink-0">Zaproś →</span>
          </motion.button>
        )}

        {loadingProfiles ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-2">Brak wyników w Twojej okolicy</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Budujemy społeczność od zera, bez sztucznych profili. Zaproś znajomych, aby ożywić swoją okolicę!</p>
            <button 
              onClick={() => setShowReferral(true)}
              className="mt-6 gradient-fire text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold"
            >
              Zaproś znajomych 🚀
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProfiles.map(p => (
              <ProfileGridItem key={p.id} profile={p} onSelect={setSelectedProfile} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && <FilterPanel filters={filters} onApply={f => { setFilters(f); setShowFilters(false); }} onClose={() => setShowFilters(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showReferral && <ReferralSystem onClose={() => setShowReferral(false)} />}
      </AnimatePresence>

      {/* Selected Profile Preview Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-strong rounded-[2.5rem] overflow-hidden border border-white/10"
            >
              <div className="relative aspect-[3/4]">
                <img src={selectedProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-white"
                >
                  ✕
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-black text-white">{selectedProfile.displayName}, {selectedProfile.age}</h2>
                    {selectedProfile.isVerified && <Shield className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-3 text-white/70 text-sm mb-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedProfile.city}</span>
                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Dostępna</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMatch(selectedProfile)}
                      disabled={matching}
                      className="flex-1 gradient-fire text-primary-foreground py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-60"
                    >
                      {matching ? '...' : 'Dopasuj 🔥'}
                    </button>
                    <button
                      onClick={() => openSuperSwipe()}
                      className="w-14 h-14 glass rounded-2xl flex items-center justify-center border border-accent/30"
                    >
                      <Star className="w-6 h-6 text-accent fill-accent" />
                    </button>
                    <button
                      onClick={() => setShowWhisper(true)}
                      className="w-14 h-14 glass rounded-2xl flex items-center justify-center border border-white/10"
                    >
                      <Ghost className="w-6 h-6 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whisper modal */}
      <AnimatePresence>
        {showWhisper && selectedProfile && (
          <WhisperModal
            targetProfile={selectedProfile}
            onClose={() => setShowWhisper(false)}
            onSent={() => { setShowWhisper(false); setSelectedProfile(null); }}
          />
        )}
      </AnimatePresence>

      {/* Super Swipe modal */}
      <AnimatePresence>
        {showSuperSwipe && selectedProfile && (
          <SuperSwipeModal
            profile={selectedProfile}
            dailyUsed={superSwipeDailyUsed}
            onSend={message => handleSuperSwipeSend(selectedProfile, message)}
            onClose={() => setShowSuperSwipe(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
