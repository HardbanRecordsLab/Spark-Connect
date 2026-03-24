import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import Confetti from './Confetti';
import IcebreakerModal from './IcebreakerModal';

export default function MatchModal() {
  const { matchedProfile, dismissMatch, setActiveTab } = useAppStore();
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const { user } = useAuth();
  const { notify } = usePushNotifications(user?.id ?? null);

  // Trigger notification on match
  useEffect(() => {
    if (matchedProfile) {
      notify(`💫 To dopasowanie!`, `Ty i ${matchedProfile.displayName} lubicie się nawzajem!`);
    }
  }, [matchedProfile?.id]);

  if (!matchedProfile) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
      >
        <Confetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="glass-strong rounded-3xl p-8 w-full max-w-sm text-center neon-border"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-6xl mb-4"
          >
            🔥
          </motion.div>

          <h2 className="text-3xl font-black gradient-text mb-1">To Match!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Ty i <span className="text-primary font-semibold">{matchedProfile.displayName}</span> polubiliście się nawzajem
          </p>

          <div className="flex justify-center gap-6 mb-8">
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <img
                src={matchedProfile.photos[0]}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-primary"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 gradient-fire rounded-full flex items-center justify-center text-sm">💚</div>
            </motion.div>

            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                alt="You"
                className="w-24 h-24 rounded-full object-cover border-4 border-accent"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 gradient-fire rounded-full flex items-center justify-center text-sm">💚</div>
            </motion.div>
          </div>

          <div className="space-y-3">
            {/* Icebreaker — primary action */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowIcebreaker(true)}
              className="w-full gradient-fire text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 glow-red"
            >
              <Zap className="w-5 h-5" />
              Wyślij icebreaker ✨
            </motion.button>

            <button
              onClick={() => { dismissMatch(); setActiveTab('chats'); }}
              className="w-full glass text-foreground py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Napisz samodzielnie
            </button>

            <button
              onClick={dismissMatch}
              className="w-full text-muted-foreground py-2.5 rounded-2xl text-sm"
            >
              Swipuj dalej
            </button>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showIcebreaker && (
          <IcebreakerModal
            matchedProfile={matchedProfile}
            onSend={(msg) => {
              // icebreaker sent — in production: call sendMessage(conv.id, msg)
              dismissMatch();
              setActiveTab('chats');
            }}
            onClose={() => setShowIcebreaker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
