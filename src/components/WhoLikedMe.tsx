import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Lock, Heart } from 'lucide-react';
import { useAppStore, type Profile } from '@/store/appStore';
import RewardedAd, { type RewardType } from '@/components/RewardedAd';
import { mockProfiles } from '@/store/appStore';

// Mock "who liked you" list — in production: query swipes WHERE swiped_id = me AND direction = right
const WHO_LIKED: Profile[] = [...mockProfiles].map(p => ({ ...p, id: `wl-${p.id}` }));

interface WhoLikedMeProps {
  onClose: () => void;
}

export default function WhoLikedMe({ onClose }: WhoLikedMeProps) {
  const { swipeRight } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [matchedId, setMatchedId] = useState<string | null>(null);

  const handleAdComplete = (_reward: RewardType) => {
    setShowAd(false);
    setUnlocked(true);
  };

  const handleLike = (profile: Profile) => {
    if (!unlocked) { setShowAd(true); return; }
    setMatchedId(profile.id);
    swipeRight();
    setTimeout(() => setMatchedId(null), 2000);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="fixed inset-0 z-40 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 glass-strong border-b border-border">
          <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold">Kto mnie polubił</h2>
            <p className="text-xs text-muted-foreground">{WHO_LIKED.length} osób czeka na Ciebie</p>
          </div>
          {!unlocked && (
            <button onClick={() => setShowAd(true)}
              className="flex items-center gap-1.5 gradient-fire text-primary-foreground text-xs px-3 py-1.5 rounded-full font-semibold">
              <Eye className="w-3 h-3" />
              Odblokuj
            </button>
          )}
          {unlocked && (
            <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full">
              <Eye className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">Odblokowane</span>
            </div>
          )}
        </div>

        {/* Unlock banner */}
        <AnimatePresence>
          {!unlocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-4 mt-3 glass border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                <Lock className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Zdjęcia są rozmyte</p>
                  <p className="text-xs text-muted-foreground">Obejrzyj krótką reklamę aby odblokować na 24 godziny — całkowicie za darmo!</p>
                </div>
                <button onClick={() => setShowAd(true)}
                  className="gradient-fire text-primary-foreground text-xs px-3 py-2 rounded-xl font-bold flex-shrink-0">
                  Odblokuj
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-4">
          <div className="grid grid-cols-2 gap-3">
            {WHO_LIKED.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
                onClick={() => handleLike(profile)}
              >
                {/* Photo — blurred if locked */}
                <img
                  src={profile.photos[0]}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-500 ${unlocked ? '' : 'blur-xl scale-110'}`}
                />

                {/* Lock overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30">
                    <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-xs text-foreground/80 font-medium">Odblokuj</span>
                  </div>
                )}

                {/* Gradient + info (only when unlocked) */}
                {unlocked && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white font-bold text-sm">{profile.displayName}, {profile.age}</p>
                    <p className="text-white/70 text-xs">{profile.city}</p>
                  </div>
                )}

                {/* Like button (unlocked) */}
                {unlocked && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={e => { e.stopPropagation(); handleLike(profile); }}
                    className="absolute top-2 right-2 w-9 h-9 gradient-fire rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Heart className="w-4 h-4 text-white" />
                  </motion.button>
                )}

                {/* Match animation */}
                <AnimatePresence>
                  {matchedId === profile.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      className="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-sm rounded-2xl"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-1">🔥</div>
                        <p className="text-white font-black text-lg">Match!</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Rewarded Ad */}
      <AnimatePresence>
        {showAd && (
          <RewardedAd
            reward="who_liked_me_24h"
            onComplete={handleAdComplete}
            onSkip={() => setShowAd(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
