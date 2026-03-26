import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { Heart, X, Star, Filter, MapPin, Shield, Info, Eye, Ghost, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import type { Profile } from '@/store/appStore';
import { StoriesBar, mockUserStories } from '@/components/StoriesSystem';
import VibeCheck from '@/components/VibeCheck';
import AdBanner from '@/components/AdBanner';
import FilterPanel, { type DiscoverFilters, DEFAULT_FILTERS } from '@/components/FilterPanel';
import { AvailableNowSection } from '@/components/AvailableNow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoverProfiles } from '@/hooks/useDiscoverProfiles';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUserSettings } from '@/hooks/useUserSettings';
import { SuperSwipeModal } from '@/components/SuperSwipe';
import RewardedAd from '@/components/RewardedAd';
import { WhisperModal } from '@/components/WhisperMessage';

const db = supabase as any;

function activeFilterCount(f: DiscoverFilters) {
  return [
    f.ageMin !== DEFAULT_FILTERS.ageMin || f.ageMax !== DEFAULT_FILTERS.ageMax,
    f.distanceMax !== DEFAULT_FILTERS.distanceMax,
    f.gender.length > 0,
    f.moodStatus.length > 0,
    f.verifiedOnly,
    f.onlineOnly,
    !f.withPhotosOnly,
    f.bodyType.length > 0,
    f.breastSize.length > 0,
    f.pubicHair.length > 0,
    f.eyeColor.length > 0,
    f.hairColor.length > 0,
    f.smoking.length > 0,
    f.drinking.length > 0,
    f.relationshipGoal.length > 0,
    f.sexualRole.length > 0,
    f.safeSex.length > 0,
    f.likes.length > 0,
    f.dislikes.length > 0,
  ].filter(Boolean).length;
}

function SwipeCard({ profile, onSwipeLeft, onSwipeRight, onSuperLike, isTop }: {
  profile: Profile; onSwipeLeft: () => void; onSwipeRight: () => void; onSuperLike: () => void; isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const controls = useAnimation();

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 120) { controls.start({ x: 400, opacity: 0, transition: { duration: 0.3 } }); setTimeout(onSwipeRight, 200); }
    else if (info.offset.x < -120) { controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } }); setTimeout(onSwipeLeft, 200); }
    else controls.start({ x: 0, rotate: 0, transition: { type: 'spring', bounce: 0.4 } });
  };

  const moodColors: Record<string, string> = { 'Looking for fun': 'text-primary', 'Just chatting': 'text-accent', 'Serious only': 'text-blue-400' };
  const photos = profile.photos.filter(p => !p.startsWith('video:'));

  return (
    <motion.div className="absolute inset-0 swipe-card" style={{ x, rotate, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} animate={controls} whileDrag={{ scale: 1.02 }}>
      <motion.div className="absolute top-10 left-6 z-20 border-4 border-primary/80 rounded-xl px-4 py-2 rotate-[-12deg]" style={{ opacity: likeOpacity }}>
        <span className="text-primary font-black text-2xl">LIKE 💚</span>
      </motion.div>
      <motion.div className="absolute top-10 right-6 z-20 border-4 border-destructive rounded-xl px-4 py-2 rotate-[12deg]" style={{ opacity: passOpacity }}>
        <span className="text-destructive font-black text-2xl">NOPE ❌</span>
      </motion.div>
      <div className="h-full rounded-3xl overflow-hidden card-shadow relative">
        <img src={photos[photoIndex] || profile.photos[0]} alt={profile.displayName} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 flex">
          <div className="flex-1" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} />
          <div className="flex-1" onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))} />
        </div>
        {photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {photos.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === photoIndex ? 'w-6 bg-primary-foreground' : 'w-1.5 bg-primary-foreground/40'}`} />)}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-card-overlay" />
        <button onClick={() => setShowInfo(!showInfo)} className="absolute top-4 right-4 z-20 w-9 h-9 glass rounded-full flex items-center justify-center">
          <Info className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold">{profile.displayName}, {profile.age}</h2>
            {profile.isVerified && <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-primary" /></div>}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 text-muted-foreground text-sm"><MapPin className="w-3.5 h-3.5" /><span>{profile.city}{profile.distance ? ` · ${profile.distance} km` : ''}</span></div>
            <span className={`text-sm font-medium ${moodColors[profile.moodStatus] || 'text-muted-foreground'}`}>{profile.moodStatus}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 bg-primary-foreground/10 rounded-full overflow-hidden">
              <motion.div className="h-full gradient-fire rounded-full" initial={{ width: 0 }} animate={{ width: `${profile.chemistryScore}%` }} transition={{ delay: 0.3, duration: 0.8 }} />
            </div>
            <span className="text-sm font-bold gradient-text">{profile.chemistryScore}% match</span>
          </div>
          {showInfo && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm text-foreground/80 mb-2">{profile.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map(tag => <span key={tag} className="text-xs glass px-2.5 py-1 rounded-full text-foreground/70">{tag}</span>)}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { discoverProfiles: mockProfiles, swipeLeft: storeSwipeLeft, swipeRight: storeSwipeRight, superLike } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const [showVibeCheck, setShowVibeCheck] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const { user } = useAuth();
  const { profiles: dbProfiles, loading: loadingProfiles, refetch, fetchMoreIfNeeded, recordSwipe } = useDiscoverProfiles(user?.id ?? null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showSuperSwipe, setShowSuperSwipe] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);
  const [whisperTarget, setWhisperModal] = useState<Profile | null>(null);
  const [adReward, setAdReward] = useState<string | null>(null);
  const { notify } = usePushNotifications(user?.id ?? null);
  const [superSwipeDailyUsed, setSuperSwipeDailyUsed] = useState(false);
  
  // Bonus timers (visual only for now, can be persisted in DB later)
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);
  const [incognitoTimeLeft, setIncognitoTimeLeft] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBoostTimeLeft(prev => Math.max(0, prev - 1));
      setIncognitoTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleRewardComplete = (reward: string) => {
    if (reward === 'boost_24h') setBoostTimeLeft(24 * 3600);
    if (reward === 'incognito_1h') setIncognitoTimeLeft(3600);
    setAdReward(null);
    setShowRewardedAd(false);
    // In real app: call API to update profile/settings in DB
  };

  useEffect(() => {
    if (dbProfiles.length > 0) {
      setAllProfiles(dbProfiles);
    } else if (!loadingProfiles && mockProfiles.length > 0) {
      setAllProfiles(mockProfiles);
    }
  }, [dbProfiles, loadingProfiles, mockProfiles]);

  // Reset cardIndex only when profiles actually change or are refreshed
  useEffect(() => {
    if (allProfiles.length > 0) {
      setCardIndex(0);
    }
  }, [allProfiles.length]); 

  // Prefetch next page as user swipes
  useEffect(() => {
    const remaining = allProfiles.length - cardIndex;
    if (allProfiles.length > 0) {
      fetchMoreIfNeeded(remaining);
    }
  }, [cardIndex, allProfiles.length, fetchMoreIfNeeded]);

  const profiles = allProfiles.filter(p => {
    if (!p) return false;
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    if (filters.distanceMax < 200 && p.distance && p.distance > filters.distanceMax) return false;
    if (filters.gender.length > 0 && !filters.gender.map(g => g.toLowerCase()).includes((p.gender ?? '').toLowerCase())) return false;
    if (filters.moodStatus.length > 0 && !filters.moodStatus.includes(p.moodStatus)) return false;
    if (filters.verifiedOnly && !p.isVerified) return false;
    if (filters.onlineOnly && !p.lastOnlineAt) return false; 
    if (filters.withPhotosOnly && (!p.photos || p.photos.length === 0)) return false;
    if (filters.bodyType.length > 0 && p.body_type && !filters.bodyType.includes(p.body_type)) return false;
    if (filters.breastSize.length > 0 && p.breast_size && !filters.breastSize.includes(p.breast_size)) return false;
    if (filters.pubicHair.length > 0 && p.pubic_hair && !filters.pubicHair.includes(p.pubic_hair)) return false;
    if (filters.eyeColor.length > 0 && p.eye_color && !filters.eyeColor.includes(p.eye_color)) return false;
    if (filters.hairColor.length > 0 && p.hair_color && !filters.hairColor.includes(p.hair_color)) return false;
    if (filters.smoking.length > 0 && p.smoking && !filters.smoking.includes(p.smoking)) return false;
    if (filters.drinking.length > 0 && p.drinking && !filters.drinking.includes(p.drinking)) return false;
    if (filters.sexualRole.length > 0 && p.sexual_role && !filters.sexualRole.includes(p.sexual_role)) return false;
    if (filters.safeSex.length > 0 && p.safe_sex && !filters.safeSex.includes(p.safe_sex)) return false;
    return true;
  });

  const currentProfile = profiles[cardIndex] ?? null;
  const visibleProfiles = profiles.slice(cardIndex, cardIndex + 3);
  const isEmpty = cardIndex >= profiles.length && !loadingProfiles && allProfiles.length > 0;
  const topProfile = visibleProfiles[0];
  const filterCount = activeFilterCount(filters);

// Debugging logs
  useEffect(() => {
    console.log('DiscoverPage State:', {
      allProfilesCount: allProfiles.length,
      filteredProfilesCount: profiles.length,
      cardIndex,
      loadingProfiles,
      isEmpty
    });
  }, [allProfiles.length, profiles.length, cardIndex, loadingProfiles, isEmpty]);

  const handleSwipeRight = async () => {
    const profile = profiles[cardIndex];
    setCardIndex(i => i + 1);
    if (profile) recordSwipe(profile.id);
    if (!user || !profile) { storeSwipeRight(); return; }
    await db.from('swipes').insert({ swiper_id: user.id, swiped_id: profile.id, direction: 'right' });
    const { data: mutual } = await db.from('swipes').select('id').eq('swiper_id', profile.id).eq('swiped_id', user.id).eq('direction', 'right').maybeSingle();
    if (mutual) {
      const { data: match } = await db.from('matches').insert({ user1_id: user.id, user2_id: profile.id }).select('id').single();
      if (match) {
        await db.from('conversations').insert({ match_id: match.id });
        storeSwipeRight();
        // Trigger push notification for match
        try {
          await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id, type: 'match', senderName: user.email?.split('@')[0] || 'ktoś' }) });
        } catch (_) { /* push not critical */ }
      }
    }
  };

  const handleSwipeLeft = async () => {
    const profile = profiles[cardIndex];
    setCardIndex(i => i + 1);
    if (profile) recordSwipe(profile.id);
    storeSwipeLeft();
    if (user && profile) await db.from('swipes').insert({ swiper_id: user.id, swiped_id: profile.id, direction: 'left' });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && diff < 80) setPullY(diff);
  };
  const handleTouchEnd = async () => {
    if (pullY > 60) {
      setRefreshing(true);
      setCardIndex(0);
      await new Promise(r => setTimeout(r, 800));
      setRefreshing(false);
    }
    setPullY(0);
  };

  return (
    <div className="h-full flex flex-col px-4 pb-4 pt-2 bg-radial-glow overflow-y-auto scrollbar-hidden"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull to refresh indicator */}
      {(pullY > 10 || refreshing) && (
        <div className="flex justify-center pb-2 transition-all" style={{ height: refreshing ? 36 : Math.max(0, pullY * 0.4) }}>
          <div className={`flex items-center gap-2 text-xs text-primary ${refreshing ? 'animate-pulse' : ''}`}>
            <span className={refreshing ? 'animate-spin inline-block' : ''} style={{ transform: `rotate(${pullY * 3}deg)` }}>🔄</span>
            {refreshing ? 'Odświeżam...' : pullY > 60 ? 'Puść aby odświeżyć' : 'Pociągnij w dół'}
          </div>
        </div>
      )}
      <div className="mb-2"><StoriesBar userStories={mockUserStories} showAddButton={true} /></div>

      {/* Popular Profiles Section */}
      <div className="mb-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-accent" />
            Popularne dzisiaj
          </h2>
          <button className="text-xs text-primary font-medium">Więcej</button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1 px-1">
          {allProfiles.sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0)).slice(0, 5).map(p => (
            <div key={p.id} className="flex-shrink-0 w-24 relative group" onClick={() => {
              console.log('open profile', p.id);
              // TODO: Navigate to profile view
            }}>
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-border group-active:scale-95 transition-transform">
                <img src={p.photos[0]} alt={p.displayName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10px] font-bold text-white truncate">{p.displayName}, {p.age}</p>
                  <div className="flex items-center gap-0.5 text-[8px] text-white/70">
                    <Eye className="w-2 h-2" />
                    {p.profileViews ? (p.profileViews > 1000 ? `${(p.profileViews/1000).toFixed(1)}k` : p.profileViews) : 0}
                  </div>
                </div>
              </div>
              {p.isVerified && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Shield className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Users Section */}
      <div className="mb-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Nowe twarze
          </h2>
          <button className="text-xs text-primary font-medium">Więcej</button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1 px-1">
          {allProfiles.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5).map(p => (
            <div key={p.id} className="flex-shrink-0 w-20 relative group" onClick={() => {
              console.log('open profile', p.id);
              // TODO: Navigate to profile view
            }}>
              <div className="aspect-square rounded-full overflow-hidden border-2 border-primary/20 p-0.5 group-active:scale-95 transition-transform">
                <img src={p.photos[0]} alt={p.displayName} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="mt-1 text-center">
                <p className="text-[9px] font-medium truncate">{p.displayName}</p>
              </div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
          ))}
        </div>
      </div>

      {/* Available Now strip */}
      <AvailableNowSection onSelectProfile={(id) => {
        console.log('open profile', id);
        // TODO: Navigate to profile view
      }} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Discover</h1>
            
            {/* Active Bonuses Timers */}
            <div className="flex gap-2">
              {boostTimeLeft > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 glass px-2 py-0.5 rounded-full border border-primary/30">
                  <span className="text-[10px]">🚀</span>
                  <span className="text-[9px] font-black text-primary">{formatTime(boostTimeLeft)}</span>
                </motion.div>
              )}
              {incognitoTimeLeft > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 glass px-2 py-0.5 rounded-full border border-blue-400/30">
                  <span className="text-[10px]">👻</span>
                  <span className="text-[9px] font-black text-blue-400">{formatTime(incognitoTimeLeft)}</span>
                </motion.div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Warsaw · {filters.distanceMax} km</p>
        </div>
        <div className="flex items-center gap-2">
          {topProfile && (
            <button onClick={() => setShowVibeCheck(true)} className="glass px-3 py-2 rounded-xl flex items-center gap-2 text-sm border border-primary/30">
              <Eye className="w-4 h-4 text-primary" /><span className="text-sm text-primary font-medium">Vibe</span>
            </button>
          )}
          <button onClick={() => setShowFilters(true)}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition-all relative ${filterCount > 0 ? 'bg-primary/20 border border-primary/40 text-primary' : 'glass'}`}>
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm">Filtry</span>
            {filterCount > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{filterCount}</span>}
          </button>
        </div>
      </div>

      {loadingProfiles && (
        <div className="flex-1 relative min-h-[380px]">
          {/* Skeleton card stack */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden animate-pulse" style={{ background: 'hsl(240 10% 10%)' }}>
            <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, hsl(240 10% 12%) 0%, hsl(240 15% 4%) 100%)' }} />
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <div className="h-7 w-36 rounded-xl mb-2 animate-pulse" style={{ background: 'hsl(240 10% 14%)' }} />
            <div className="h-4 w-48 rounded-lg mb-3 animate-pulse" style={{ background: 'hsl(240 10% 14%)' }} />
            <div className="flex gap-2">
              {[60, 80, 70].map((w, i) => (
                <div key={i} className="h-6 rounded-full animate-pulse" style={{ width: w, background: 'hsl(240 10% 14%)' }} />
              ))}
            </div>
          </div>
          <div className="absolute bottom-[-12px] inset-x-4 h-3 rounded-b-3xl animate-pulse" style={{ background: 'hsl(240 10% 9%)', zIndex: -1 }} />
          <p className="absolute top-4 left-0 right-0 text-center text-xs text-muted-foreground animate-pulse">Szukam osób w pobliżu...</p>
        </div>
      )}

      {!loadingProfiles && (
        <div className="flex-1 relative min-h-[380px]">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="text-6xl">🔥</div>
              <h3 className="text-xl font-bold">Widziałeś wszystkich!</h3>
              <p className="text-muted-foreground text-sm max-w-xs">{filterCount > 0 ? 'Rozszerz filtry lub odśwież' : 'Zwiększ zasięg lub sprawdź za chwilę'}</p>
              <div className="flex gap-3">
                {filterCount > 0 && <button onClick={() => { setFilters(DEFAULT_FILTERS); setCardIndex(0); }} className="glass text-foreground px-5 py-3 rounded-2xl font-semibold border border-border">Resetuj filtry</button>}
                <button onClick={() => { refetch(); setCardIndex(0); }} className="gradient-fire text-primary-foreground px-6 py-3 rounded-2xl font-semibold">Odśwież 🔄</button>
              </div>
            </div>
          ) : (
            [...visibleProfiles].reverse().map((profile, i) => {
              const reverseIndex = visibleProfiles.length - 1 - i;
              return (
                <motion.div key={profile.id} className="absolute inset-0" style={{ zIndex: reverseIndex === 0 ? 10 : reverseIndex }}
                  animate={{ scale: reverseIndex === 0 ? 1 : 1 - (reverseIndex * 0.04), y: reverseIndex === 0 ? 0 : reverseIndex * 10 }}
                  transition={{ type: 'spring', bounce: 0.3 }}>
                  <SwipeCard profile={profile} isTop={reverseIndex === 0} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onSuperLike={superLike} />
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {!loadingProfiles && !isEmpty && (
        <div className="flex flex-col gap-3">
          <AdBanner placement="discover" />
          <div className="flex items-center justify-center gap-4 py-2">
            {/* Dislike */}
            <button onClick={handleSwipeLeft} className="w-14 h-14 glass rounded-full flex items-center justify-center border border-destructive/30 active:scale-90 transition-transform">
              <X className="w-6 h-6 text-destructive" />
            </button>
            {/* Whisper */}
            <button
              onClick={() => currentProfile && setShowWhisper(true)}
              className="w-11 h-11 glass rounded-full flex items-center justify-center border border-primary/30 active:scale-90 transition-transform"
              title="Wyślij szept 👻"
            >
              <Ghost className="w-4 h-4 text-primary" />
            </button>
            {/* Super Swipe */}
            <button
              onClick={() => currentProfile && setShowSuperSwipe(true)}
              className="w-11 h-11 glass rounded-full flex items-center justify-center border border-accent/30 active:scale-90 transition-transform"
              title="Super Swipe ⭐"
            >
              <Star className="w-4 h-4 text-accent" />
            </button>
            {/* Like */}
            <button onClick={handleSwipeRight} className="w-14 h-14 gradient-fire rounded-full flex items-center justify-center glow-red active:scale-90 transition-transform">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilters && <FilterPanel filters={filters} onApply={f => { setFilters(f); setCardIndex(0); }} onClose={() => setShowFilters(false)} />}
      </AnimatePresence>

      {/* SuperSwipe modal */}
      <AnimatePresence>
        {showSuperSwipe && currentProfile && (
          <SuperSwipeModal
            profile={currentProfile}
            dailyUsed={superSwipeDailyUsed}
            onSend={(msg) => {
              superLike();
              setSuperSwipeDailyUsed(true);
              setShowSuperSwipe(false);
            }}
            onClose={() => setShowSuperSwipe(false)}
          />
        )}
      </AnimatePresence>

      {/* Whisper modal */}
      <AnimatePresence>
        {showWhisper && currentProfile && (
          <WhisperModal
            targetProfile={currentProfile}
            onClose={() => setShowWhisper(false)}
            onSent={() => setShowWhisper(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVibeCheck && topProfile && (
          <VibeCheck profileName={topProfile.displayName} profilePhoto={topProfile.photos[0]}
            onMatch={() => { setShowVibeCheck(false); handleSwipeRight(); }} onSkip={() => { setShowVibeCheck(false); handleSwipeLeft(); }} onClose={() => setShowVibeCheck(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRewardedAd && (
          <RewardedAd reward="super_like_x5" onComplete={(reward) => { setShowRewardedAd(false); setCardIndex(0); }} onSkip={() => setShowRewardedAd(false)} onClose={() => setShowRewardedAd(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
