import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Smile, Heart } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const floatingEmojis = ['❤️', '🔥', '😍', '💕', '✨', '💋'];

export default function VideoCallOverlay() {
  const { videoCallUser, endVideoCall } = useAppStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sendEmoji = (emoji: string) => {
    const id = Date.now();
    setEmojis(prev => [...prev, { id, emoji, x: Math.random() * 70 + 15 }]);
    setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), 2000);
  };

  if (!videoCallUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Remote video (full screen) */}
      <div className="relative w-full h-full">
        <img
          src={videoCallUser.photos[0]}
          alt={videoCallUser.displayName}
          className="w-full h-full object-cover"
          style={isCameraOff ? { filter: 'blur(30px) grayscale(1)' } : {}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />

        {/* Floating emojis */}
        {emojis.map(e => (
          <motion.div
            key={e.id}
            className="absolute bottom-32 text-3xl pointer-events-none"
            style={{ left: `${e.x}%` }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -200, opacity: 0, scale: 1.2 }}
            transition={{ duration: 1.8 }}
          >
            {e.emoji}
          </motion.div>
        ))}

        {/* Panic button */}
        <button className="absolute top-4 left-4 glass px-3 py-2 rounded-xl text-xs text-destructive border border-destructive/30 font-bold">
          🚨 PANIC
        </button>

        {/* Call info */}
        <div className="absolute top-4 left-0 right-0 flex flex-col items-center">
          <p className="font-bold text-lg text-white">{videoCallUser.displayName}</p>
          <p className="text-sm text-white/70">{formatDuration(callDuration)}</p>
        </div>

        {/* Self view */}
        <div className="absolute top-16 right-4 w-28 h-36 rounded-2xl overflow-hidden glass border border-white/10">
          <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
            {isCameraOff ? <VideoOff className="w-8 h-8" /> : <span className="text-2xl">😊</span>}
          </div>
        </div>

        {/* Emoji reactions */}
        <div className="absolute bottom-36 left-4 flex gap-2">
          {floatingEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendEmoji(emoji)}
              className="w-9 h-9 glass rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-destructive' : 'glass'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={endVideoCall}
            className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-destructive' : 'glass'}`}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
