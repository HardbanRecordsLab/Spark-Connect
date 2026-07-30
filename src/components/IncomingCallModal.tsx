import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { declineCall } from '@/hooks/useCallSignaling';

export default function IncomingCallModal() {
  const { incomingCall, setIncomingCall, acceptIncomingCall } = useAppStore();

  const handleDecline = () => {
    if (incomingCall) declineCall(incomingCall.user.id, incomingCall.matchId);
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 px-8"
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            src={incomingCall.user.photos?.[0]}
            alt=""
            className="w-28 h-28 rounded-full object-cover border-4 border-primary/40"
          />
          <div className="text-center">
            <p className="text-2xl font-black">{incomingCall.user.displayName}</p>
            <p className="text-sm text-muted-foreground mt-1 animate-pulse">Wideo-rozmowa przychodząca…</p>
          </div>
          <div className="flex items-center gap-10">
            <button
              onClick={handleDecline}
              className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={acceptIncomingCall}
              className="w-16 h-16 gradient-fire rounded-full flex items-center justify-center active:scale-95 transition-transform glow-red"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
