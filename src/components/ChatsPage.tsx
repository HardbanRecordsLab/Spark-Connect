import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import {
  Send, Video, ArrowLeft, Image, Smile, Mic, CheckCheck,
  MoreVertical, Clock, Ghost, Eye, Timer, X, Play, Film,
  Upload, Pause, MicOff, CornerUpLeft, Reply, Search, Wand2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import type { Conversation } from '@/store/appStore';
import { GiftPicker, GiftReveal, GiftBubble, GIFTS, type GiftItem } from '@/components/GiftSystem';
import AdBanner from '@/components/AdBanner';
import EmojiPicker from '@/components/EmojiPicker';
import ChatContextMenu from '@/components/ChatContextMenu';
import IcebreakerModal from '@/components/IcebreakerModal';
import ReportUserModal from '@/components/ReportUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, triggerPush } from '@/hooks/useConversations';

// ─── Emoji reactions constants ────────────────────────────────────────────────
const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👎'] as const;
type ReactionEmoji = typeof REACTION_EMOJIS[number];

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

// Group reactions: emoji → count + whether current user reacted
type ReactionGroup = { emoji: string; count: number; byMe: boolean };

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

type TimerOption = { label: string; seconds: number | null };
const TIMER_OPTIONS: TimerOption[] = [
  { label: '∞ Forever', seconds: null },
  { label: '1 hour', seconds: 3600 },
  { label: '24 hours', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
];

// ─── DB message shape ─────────────────────────────────────────────────────────
interface DBMessage {
  id: string;
  sender_id: string;
  conversation_id: string;
  content: string;
  type: string | null;
  is_read: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  reply_to_id?: string | null;
  duration?: number;
}

type LocalMessage = {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'gift';
  sentAt: string;
  isRead: boolean;
  expiresIn: number | null;
  isAnon: boolean;
  duration?: number;
  replyToId?: string | null;
};

function msgToLocal(msg: DBMessage, myId: string): LocalMessage {
  const expiresIn = msg.expires_at
    ? Math.max(0, Math.round((new Date(msg.expires_at).getTime() - Date.now()) / 1000))
    : null;
  return {
    id: msg.id,
    senderId: msg.sender_id === myId ? 'me' : msg.sender_id,
    content: msg.content,
    type: (msg.type as LocalMessage['type']) ?? 'text',
    sentAt: msg.created_at
      ? new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '',
    isRead: msg.is_read ?? false,
    expiresIn,
    isAnon: false,
    duration: msg.duration,
    replyToId: msg.reply_to_id ?? null,
  };
}

// ─── Message expire timer ─────────────────────────────────────────────────────
function MessageTimer({ expiresIn }: { expiresIn: number | null }) {
  const [remaining, setRemaining] = useState(expiresIn ?? 0);
  useEffect(() => {
    if (expiresIn === null || remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [expiresIn]);
  const fmt = (s: number) => s >= 3600 ? `${Math.floor(s / 3600)}h` : s >= 60 ? `${Math.floor(s / 60)}m` : `${s}s`;
  if (expiresIn === null) return null;
  if (remaining === 0) return <span className="text-xs text-destructive">Expired</span>;
  return (
    <div className="flex items-center gap-0.5">
      <Timer className="w-3 h-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{fmt(remaining)}</span>
    </div>
  );
}

// ─── Typing bubble ────────────────────────────────────────────────────────────
function TypingBubble({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      className="flex items-end gap-2"
    >
      <div className="w-7 h-7 rounded-full glass flex items-center justify-center text-xs font-bold text-primary">
        {name[0]?.toUpperCase()}
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Reply preview strip (above input) ───────────────────────────────────────
function ReplyPreview({
  message,
  senderName,
  onCancel,
}: {
  message: LocalMessage;
  senderName: string;
  onCancel: () => void;
}) {
  const label = message.type === 'audio'
    ? '🎤 Voice message'
    : message.type === 'image'
    ? '🖼️ Photo'
    : message.type === 'video'
    ? '🎬 Video'
    : message.content.length > 60
    ? message.content.slice(0, 60) + '…'
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 6, height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl glass border-l-2 border-primary overflow-hidden"
    >
      <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary truncate">{senderName}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <button
        onClick={onCancel}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-secondary transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </motion.div>
  );
}

// ─── Quoted message inside bubble ────────────────────────────────────────────
function QuotedBubble({ message, isMe }: { message: LocalMessage; isMe: boolean }) {
  const label = message.type === 'audio'
    ? '🎤 Voice message'
    : message.type === 'image'
    ? '🖼️ Photo'
    : message.type === 'video'
    ? '🎬 Video'
    : message.content.length > 50
    ? message.content.slice(0, 50) + '…'
    : message.content;

  return (
    <div className={`mb-1.5 px-2.5 py-1.5 rounded-xl text-xs border-l-2 ${
      isMe
        ? 'bg-primary-foreground/10 border-primary-foreground/50 text-primary-foreground/80'
        : 'bg-secondary/80 border-primary text-muted-foreground'
    }`}>
      <p className={`font-semibold mb-0.5 ${isMe ? 'text-primary-foreground/90' : 'text-primary'}`}>
        {message.senderId === 'me' ? 'You' : 'Them'}
      </p>
      <p className="truncate">{label}</p>
    </div>
  );
}

// ─── Audio player bubble ──────────────────────────────────────────────────────
function AudioBubble({ url, isMe, duration }: { url: string; isMe: boolean; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[180px] max-w-[240px] ${
      isMe ? 'gradient-fire text-primary-foreground rounded-br-sm' : 'glass text-foreground rounded-bl-sm'
    }`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => { const a = e.currentTarget; setCurrentTime(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); }}
        onLoadedMetadata={e => setTotalDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button
        onClick={toggle}
        className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
          isMe ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' : 'bg-primary/10 hover:bg-primary/20'
        }`}
      >
        {playing
          ? <Pause className={`w-4 h-4 ${isMe ? 'text-primary-foreground' : 'text-primary'}`} />
          : <Play className={`w-4 h-4 ml-0.5 ${isMe ? 'text-primary-foreground' : 'text-primary'}`} />
        }
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div
          className={`h-1.5 rounded-full overflow-hidden cursor-pointer ${isMe ? 'bg-primary-foreground/30' : 'bg-secondary'}`}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) audioRef.current.currentTime = pct * audioRef.current.duration;
          }}
        >
          <motion.div
            className={`h-full rounded-full ${isMe ? 'bg-primary-foreground' : 'bg-primary'}`}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'tween', duration: 0.1 }}
          />
        </div>
        <div className={`flex justify-between text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <span>{fmtDur(currentTime)}</span>
          <span className="flex items-center gap-1"><Mic className="w-2.5 h-2.5" />{fmtDur(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Media lightbox ───────────────────────────────────────────────────────────
function MediaLightbox({ url, type, onClose }: { url: string; type: 'image' | 'video'; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.85 }}
        className="max-w-[90vw] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {type === 'image' ? (
          <img src={url} alt="media" className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        ) : (
          <video src={url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl" />
        )}
      </motion.div>
      <button
        className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Media bubble ─────────────────────────────────────────────────────────────
function MediaBubble({ url, type, isMe }: { url: string; type: 'image' | 'video'; isMe: boolean }) {
  const [lightbox, setLightbox] = useState(false);
  if (type === 'image') {
    return (
      <>
        <img
          src={url} alt="media"
          className={`max-w-[220px] rounded-2xl object-cover cursor-pointer active:opacity-80 transition-opacity ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          onClick={() => setLightbox(true)}
        />
        <AnimatePresence>
          {lightbox && <MediaLightbox url={url} type="image" onClose={() => setLightbox(false)} />}
        </AnimatePresence>
      </>
    );
  }
  return (
    <>
      <div className="relative max-w-[220px]">
        <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
          <video src={url} className={`max-w-[220px] rounded-2xl ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`} />
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm rounded-2xl">
            <div className="w-12 h-12 gradient-fire rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {lightbox && <MediaLightbox url={url} type="video" onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Voice recorder ───────────────────────────────────────────────────────────
function VoiceRecorder({ onSend, onCancel }: { onSend: (blob: Blob, duration: number) => void; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(Date.now());

  useEffect(() => {
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
        mediaRef.current = mr;
        chunksRef.current = [];
        startRef.current = Date.now();
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.start(100);
      } catch { onCancel(); }
    })();
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { clearInterval(t); stream?.getTracks().forEach(tr => tr.stop()); };
  }, []);

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const handleSend = () => {
    const mr = mediaRef.current;
    if (!mr) return;
    mr.onstop = () => { const blob = new Blob(chunksRef.current, { type: mr.mimeType }); onSend(blob, (Date.now() - startRef.current) / 1000); };
    mr.stop();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 px-4 py-2.5 glass border border-destructive/30 rounded-2xl mb-2"
    >
      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 rounded-full bg-destructive" />
      <Mic className="w-4 h-4 text-destructive" />
      <span className="text-sm font-mono text-foreground flex-1">{fmtDur(seconds)}</span>
      <button onClick={onCancel} className="w-8 h-8 glass rounded-full flex items-center justify-center">
        <MicOff className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button onClick={handleSend} className="w-8 h-8 gradient-fire rounded-full flex items-center justify-center">
        <Send className="w-3.5 h-3.5 text-primary-foreground" />
      </button>
    </motion.div>
  );
}

// ─── Upload progress ──────────────────────────────────────────────────────────
function UploadProgress({ progress, onCancel }: { progress: number; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 px-4 py-2 glass rounded-2xl mb-2"
    >
      <Upload className="w-4 h-4 text-primary animate-pulse" />
      <div className="flex-1">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div className="h-full gradient-fire" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 60 }} />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
      <button onClick={onCancel}><X className="w-3 h-3 text-muted-foreground" /></button>
    </motion.div>
  );
}

// ─── Swipeable message row ────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 60;

function SwipeableMessage({
  msg,
  isMe,
  onReply,
  children,
}: {
  msg: LocalMessage;
  isMe: boolean;
  onReply: (msg: LocalMessage) => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Reply icon opacity: fades in after 20px, full at threshold
  const iconOpacity = useTransform(x, isMe ? [-SWIPE_THRESHOLD, -20, 0] : [0, 20, SWIPE_THRESHOLD], isMe ? [1, 0.4, 0] : [0, 0.4, 1]);
  const iconScale = useTransform(x, isMe ? [-SWIPE_THRESHOLD, -20, 0] : [0, 20, SWIPE_THRESHOLD], isMe ? [1, 0.7, 0.5] : [0.5, 0.7, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = isMe ? -SWIPE_THRESHOLD : SWIPE_THRESHOLD;
    const triggered = isMe ? info.offset.x < threshold : info.offset.x > threshold;
    if (triggered) {
      // Haptic-style bounce then snap back
      controls.start({ x: isMe ? -10 : 10, transition: { duration: 0.1 } }).then(() => {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      });
      onReply(msg);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Reply icon behind message */}
      <motion.div
        style={{ opacity: iconOpacity, scale: iconScale }}
        className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'left-2' : 'right-2'} w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center pointer-events-none`}
      >
        <CornerUpLeft className="w-3.5 h-3.5 text-primary" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={isMe ? { left: -SWIPE_THRESHOLD - 10, right: 0 } : { left: 0, right: SWIPE_THRESHOLD + 10 }}
        dragElastic={0.15}
        style={{ x }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Emoji Reaction Popover ───────────────────────────────────────────────────
function EmojiReactionPopover({
  isMe,
  onReact,
  onClose,
}: {
  isMe: boolean;
  onReact: (emoji: ReactionEmoji) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-14 z-50 flex items-center gap-1 px-2 py-1.5 rounded-2xl glass-strong border border-border shadow-xl`}
      onMouseLeave={onClose}
    >
      {REACTION_EMOJIS.map((emoji, i) => (
        <motion.button
          key={emoji}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileHover={{ scale: 1.35, y: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onReact(emoji); onClose(); }}
          className="text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Reaction Bar (below message) ─────────────────────────────────────────────
function ReactionBar({
  groups,
  onToggle,
}: {
  groups: ReactionGroup[];
  onToggle: (emoji: string) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1 px-1">
      {groups.map(g => (
        <motion.button
          key={g.emoji}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => onToggle(g.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
            g.byMe
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'glass border-border text-foreground'
          }`}
        >
          <span>{g.emoji}</span>
          {g.count > 1 && <span className="font-semibold tabular-nums">{g.count}</span>}
        </motion.button>
      ))}
    </div>
  );
}

// ─── ConversationItem ─────────────────────────────────────────────────────────
function ConversationItem({ conv, onClick }: { conv: Conversation; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors rounded-2xl">
      <div className="relative flex-shrink-0">
        <div className={conv.user.isVerified ? 'story-ring' : ''}>
          <img src={conv.user.photos[0]} alt={conv.user.displayName} className="w-12 h-12 rounded-full object-cover" style={conv.user.isVerified ? { padding: "2px" } : {}} />
        </div>
        {conv.isOnline && (
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background" style={{ background: 'hsl(142 71% 45%)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold flex items-center gap-1.5">
            {conv.user.displayName}
            {conv.isMuted && <VolumeX className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
          </span>
          <span className="text-xs text-muted-foreground">{conv.lastMessageAt}</span>
        </div>
        <div className="flex items-center justify-between">
          {conv.isTyping ? (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, delay: i * 0.2 }} />
              ))}
              <span className="text-xs text-primary ml-1">typing...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
          )}
          {conv.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-primary rounded-full text-xs font-bold text-primary-foreground flex items-center justify-center ml-2">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── ChatView ─────────────────────────────────────────────────────────────────
function ChatView({ conv, onBack, setMatchState }: {
  conv: Conversation; onBack: () => void;
  setMatchState: (matchId: string, updates: { archived?: boolean; muted?: boolean }) => Promise<{ error: unknown }>;
}) {
  const { user } = useAuth();
  const myId = user?.id ?? 'me';

  // Own display name for the recipient's push notification title
  // ("💋 {my name}") -- fetched once, not part of the conv/profile
  // objects already in scope here.
  const [myDisplayName, setMyDisplayName] = useState('Ktoś');
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      .then(({ data }: { data: { display_name: string } | null }) => { if (data?.display_name) setMyDisplayName(data.display_name); });
  }, [user]);

  const [text, setText] = useState('');
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [revealGift, setRevealGift] = useState<GiftItem | null>(null);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(TIMER_OPTIONS[0]);
  const [isAnonMode, setIsAnonMode] = useState(false);
  const [showAnonReveal, setShowAnonReveal] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // Reply state
  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  // Reactions: message_id → list of Reaction
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  // Which message has the popover open (long-press)
  const [activePopoverMsgId, setActivePopoverMsgId] = useState<string | null>(null);
  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Context menu (MoreVertical)
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const { startVideoCall } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadCancelRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerIsTyping]);

  useEffect(() => {
    async function load() {
      // First try to load by match_id (correct routing), fallback to limit(1) for mock data
      const { data } = await supabase.from('conversations').select('*')
        .eq('match_id', conv.matchId).maybeSingle();
      const row = data ?? (await supabase.from('conversations').select('*').limit(1).maybeSingle()).data;
      if (row) { setConversationId(row.id); loadMessages(row.id); loadReactions(row.id); }
    }
    load();
  }, [conv.id, conv.matchId]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data.map(m => msgToLocal(m as DBMessage, myId)));
      // Mark all incoming messages as read
      const unreadIds = data
        .filter(m => m.sender_id !== myId && !m.is_read)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
  }, [myId]);

  // Load reactions for all messages in the conversation
  const loadReactions = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .in('message_id', (
        await supabase.from('messages').select('id').eq('conversation_id', convId)
      ).data?.map(m => m.id) ?? []);
    if (data) {
      const grouped: Record<string, Reaction[]> = {};
      for (const r of data) {
        if (!grouped[r.message_id]) grouped[r.message_id] = [];
        grouped[r.message_id].push(r as Reaction);
      }
      setReactions(grouped);
    }
  }, []);

  // Realtime new messages
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase.channel(`msgs:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        const nm = msgToLocal(payload.new as DBMessage, myId);
        setMessages(prev => prev.find(m => m.id === nm.id) ? prev : [...prev, nm]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, myId]);

  // Realtime reactions
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase.channel(`reactions:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, payload => {
        const r = payload.new as Reaction;
        setReactions(prev => {
          const list = prev[r.message_id] ?? [];
          if (list.find(x => x.id === r.id)) return prev;
          return { ...prev, [r.message_id]: [...list, r] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' }, payload => {
        const r = payload.old as Reaction;
        setReactions(prev => {
          const list = (prev[r.message_id] ?? []).filter(x => x.id !== r.id);
          return { ...prev, [r.message_id]: list };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId]);

  // Presence (typing)
  useEffect(() => {
    if (!conversationId || !user) return;
    const ch = supabase.channel(`presence:${conversationId}`, { config: { presence: { key: user.id } } });
    presenceChannelRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ typing: boolean }>();
      const others = Object.entries(state).filter(([k]) => k !== user.id).flatMap(([, p]) => p);
      setPeerIsTyping(others.some(p => p.typing === true));
    });
    ch.subscribe(async s => { if (s === 'SUBSCRIBED') await ch.track({ typing: false }); });
    return () => { ch.untrack(); supabase.removeChannel(ch); presenceChannelRef.current = null; };
  }, [conversationId, user]);

  const handleTextChange = (val: string) => {
    setText(val);
    const ch = presenceChannelRef.current;
    if (!ch || !user) return;
    ch.track({ typing: val.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (val.length > 0) typingTimeoutRef.current = setTimeout(() => ch.track({ typing: false }), 3000);
  };

  const { upload: uploadToR2 } = useR2Upload();
  const uploadToStorage = async (file: File | Blob, path: string) => {
    if (uploadCancelRef.current) return null;
    try {
      const filename = path.split('/').pop() ?? 'file';
      const { publicUrl } = await uploadToR2({
        bucket: 'chat-media',
        file,
        filename,
        onProgress: (pct) => {
          if (!uploadCancelRef.current) setUploadProgress(pct);
        },
      });
      setTimeout(() => setUploadProgress(null), 600);
      return publicUrl;
    } catch (err) {
      console.error('Chat media upload failed:', err);
      setUploadProgress(null);
      return null;
    }
  };

  // Set reply and focus input
  const handleReply = (msg: LocalMessage) => {
    setReplyTo(msg);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Long-press to show reaction popover
  const handleLongPressStart = (msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setActivePopoverMsgId(msgId);
    }, 420);
  };
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  // Toggle emoji reaction
  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return;
    const existing = (reactions[msgId] ?? []).find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      // Remove reaction optimistically
      setReactions(prev => ({ ...prev, [msgId]: (prev[msgId] ?? []).filter(r => r.id !== existing.id) }));
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      // Add reaction optimistically
      const tempId = `opt-react-${Date.now()}`;
      const newR: Reaction = { id: tempId, message_id: msgId, user_id: user.id, emoji };
      setReactions(prev => ({ ...prev, [msgId]: [...(prev[msgId] ?? []), newR] }));
      const { data, error } = await supabase.from('reactions').insert({
        message_id: msgId, user_id: user.id, emoji,
      }).select().single();
      if (!error && data) {
        setReactions(prev => ({
          ...prev,
          [msgId]: (prev[msgId] ?? []).map(r => r.id === tempId ? (data as Reaction) : r),
        }));
      }
    }
  };

  // Build reaction groups for a message
  const getReactionGroups = (msgId: string): ReactionGroup[] => {
    const list = reactions[msgId] ?? [];
    const map = new Map<string, { count: number; byMe: boolean }>();
    for (const r of list) {
      const cur = map.get(r.emoji) ?? { count: 0, byMe: false };
      map.set(r.emoji, { count: cur.count + 1, byMe: cur.byMe || r.user_id === myId });
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }));
  };


  const lastSentRef = useRef<number>(0);
  const handleSend = async () => {
    // Rate limiting: max 1 message per second
    const now = Date.now();
    if (now - lastSentRef.current < 1000) return;
    lastSentRef.current = now;
    if (!text.trim() || sending) return;
    setSending(true);
    presenceChannelRef.current?.track({ typing: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const expiresAt = selectedTimer.seconds ? new Date(Date.now() + selectedTimer.seconds * 1000).toISOString() : null;
    const replyId = replyTo?.id ?? null;

    const optimistic: LocalMessage = {
      id: `opt-${Date.now()}`,
      senderId: 'me',
      content: text,
      type: 'text',
      sentAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      expiresIn: selectedTimer.seconds,
      isAnon: isAnonMode,
      replyToId: replyId,
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    setReplyTo(null);

    if (conversationId && user) {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: text,
        type: 'text',
        expires_at: expiresAt,
        reply_to_id: replyId,
      }).select().single();
      if (!error && data) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...msgToLocal(data as DBMessage, myId), replyToId: replyId } : m));
        // Push the recipient (not ourselves) -- triggered here, from the
        // sender, so it fires reliably even if they're offline right now.
        triggerPush(conv.user.id, `💋 ${myDisplayName}`, text.slice(0, 60), '/?tab=chats');
      }
    }
    setSending(false);
  };

  // Send file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    uploadCancelRef.current = false;
    const isVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const localUrl = URL.createObjectURL(file);
    const replyId = replyTo?.id ?? null;

    const optimistic: LocalMessage = {
      id: `opt-media-${Date.now()}`,
      senderId: 'me',
      content: localUrl,
      type: isVideo ? 'video' : 'image',
      sentAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      expiresIn: selectedTimer.seconds,
      isAnon: isAnonMode,
      replyToId: replyId,
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    setUploadProgress(0);

    const publicUrl = await uploadToStorage(file, path);
    URL.revokeObjectURL(localUrl);
    if (!publicUrl) { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); return; }

    if (conversationId) {
      const expiresAt = selectedTimer.seconds ? new Date(Date.now() + selectedTimer.seconds * 1000).toISOString() : null;
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: publicUrl,
        type: isVideo ? 'video' : 'image',
        expires_at: expiresAt,
        reply_to_id: replyId,
      }).select().single();
      if (!error && data) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...msgToLocal(data as DBMessage, myId), replyToId: replyId } : m));
        triggerPush(conv.user.id, `💋 ${myDisplayName}`, isVideo ? '🎬 Wysłał/a wideo' : '📷 Wysłał/a zdjęcie', '/?tab=chats');
      }
    } else {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, content: publicUrl } : m));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send voice
  const handleVoiceSend = async (blob: Blob, duration: number) => {
    if (!user) return;
    setIsRecording(false);
    uploadCancelRef.current = false;
    const ext = blob.type.includes('webm') ? 'webm' : 'ogg';
    const path = `${user.id}/voice_${Date.now()}.${ext}`;
    const localUrl = URL.createObjectURL(blob);
    const replyId = replyTo?.id ?? null;

    const optimistic: LocalMessage = {
      id: `opt-audio-${Date.now()}`,
      senderId: 'me',
      content: localUrl,
      type: 'audio',
      sentAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      expiresIn: selectedTimer.seconds,
      isAnon: isAnonMode,
      duration,
      replyToId: replyId,
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    setUploadProgress(0);

    const publicUrl = await uploadToStorage(blob, path);
    URL.revokeObjectURL(localUrl);
    if (!publicUrl) { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); return; }

    if (conversationId) {
      const expiresAt = selectedTimer.seconds ? new Date(Date.now() + selectedTimer.seconds * 1000).toISOString() : null;
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: publicUrl,
        type: 'audio',
        expires_at: expiresAt,
        reply_to_id: replyId,
      }).select().single();
      if (!error && data) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...msgToLocal(data as DBMessage, myId), duration, replyToId: replyId } : m));
        triggerPush(conv.user.id, `💋 ${myDisplayName}`, '🎤 Wiadomość głosowa', '/?tab=chats');
      }
    } else {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, content: publicUrl } : m));
    }
  };

  const handleBlock = async () => {
    if (!user || actionPending) return;
    setActionPending(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('user_blocks').insert({ blocker_id: user.id, blocked_id: conv.user.id });
    setActionPending(false);
    if (error) { toast.error('Nie udało się zablokować użytkownika.'); return; }
    toast.success(`Zablokowano ${conv.user.displayName}. Nie zobaczycie się już w aplikacji.`);
    onBack();
  };

  const handleUnmatch = async () => {
    if (!user || actionPending) return;
    setActionPending(true);
    const { error } = await supabase.from('matches').delete().eq('id', conv.matchId);
    setActionPending(false);
    if (error) { toast.error('Nie udało się usunąć dopasowania.'); return; }
    toast.success('Dopasowanie usunięte.');
    onBack();
  };

  const handleArchive = async () => {
    const { error } = await setMatchState(conv.matchId, { archived: !conv.isArchived });
    if (error) { toast.error('Nie udało się zaktualizować archiwum.'); return; }
    toast.success(conv.isArchived ? 'Przywrócono z archiwum.' : 'Rozmowa zarchiwizowana.');
    if (!conv.isArchived) onBack();
  };

  const handleMute = async () => {
    const { error } = await setMatchState(conv.matchId, { muted: !conv.isMuted });
    if (error) { toast.error('Nie udało się zaktualizować powiadomień.'); return; }
    toast.success(conv.isMuted ? 'Powiadomienia włączone.' : 'Rozmowa wyciszona.');
  };

  const handleGiftSent = async (gift: GiftItem) => {
    // Coins are already deducted for real by GiftPicker (via
    // adjust_coin_balance) before onSend fires -- this used to just
    // push into local-only giftMessages state, so the recipient never
    // actually received anything the sender paid coins for. Persist
    // a real message instead, same pipeline as text/image/audio.
    setTimeout(() => setRevealGift(gift), 800);
    if (conversationId && user) {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: gift.id,
        type: 'gift',
      }).select().single();
      if (!error && data) {
        setMessages(prev => [...prev, msgToLocal(data as DBMessage, myId)]);
        triggerPush(conv.user.id, `💋 ${myDisplayName}`, '🎁 Wysłał/a prezent!', '/?tab=chats');
      }
    }
  };

  // Helper: find quoted message for a given replyToId
  const findQuotedMsg = (id: string | null | undefined) =>
    id ? messages.find(m => m.id === id) ?? null : null;

  return (
    <div className="h-full flex flex-col">
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 glass-strong border-b border-border">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <img src={conv.user.photos[0]} alt={conv.user.displayName} className="w-9 h-9 rounded-full object-cover" />
          {isAnonMode && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Ghost className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{conv.user.displayName}</div>
          <AnimatePresence mode="wait">
            {peerIsTyping ? (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1 h-1 rounded-full bg-primary" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
                <span className="text-xs text-primary ml-0.5">typing...</span>
              </motion.div>
            ) : (
              <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(142 71% 45%)' }} />
                <span className="text-xs text-foreground/60">{conv.isOnline ? 'Online now' : 'Last seen recently'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setIsAnonMode(v => !v)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isAnonMode ? 'bg-secondary border border-primary/50' : 'glass'}`}>
          <Ghost className={`w-4 h-4 ${isAnonMode ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
        <button onClick={() => startVideoCall(conv.user, conv.matchId)} className="w-9 h-9 glass rounded-full flex items-center justify-center">
          <Video className="w-4 h-4 text-primary" />
        </button>
        <div className="relative">
          <button onClick={() => setShowContextMenu(v => !v)} className="w-9 h-9 glass rounded-full flex items-center justify-center">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {showContextMenu && (
              <ChatContextMenu
                userName={conv.user.displayName}
                onBlock={handleBlock}
                onReport={() => setShowReportModal(true)}
                onUnmatch={handleUnmatch}
                onArchive={handleArchive}
                onMute={handleMute}
                onClearChat={() => setMessages([])}
                onClose={() => setShowContextMenu(false)}
                isArchived={conv.isArchived}
                isMuted={conv.isMuted}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Anon banner */}
      <AnimatePresence>
        {isAnonMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2 glass border border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-primary">Anonymous Mode</p>
                <p className="text-xs text-muted-foreground">They see "Mystery" until you reveal yourself</p>
              </div>
            </div>
            <button onClick={() => setShowAnonReveal(true)} className="text-xs gradient-fire text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" />Reveal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hidden"
        onClick={() => setActivePopoverMsgId(null)}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-50">
            <div className="text-3xl">💬</div>
            <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === 'me';
          const isMedia = msg.type === 'image' || msg.type === 'video';
          const isAudio = msg.type === 'audio';
          const isGift = msg.type === 'gift';
          const quotedMsg = findQuotedMsg(msg.replyToId);
          const reactionGroups = getReactionGroups(msg.id);
          const isPopoverOpen = activePopoverMsgId === msg.id;

          return (
            <SwipeableMessage key={msg.id} msg={msg} isMe={isMe} onReply={handleReply}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 py-0.5`}
              >
                {!isMe && (
                  <img src={conv.user.photos[0]} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" />
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {isMe && msg.isAnon && (
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <Ghost className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Sent anonymously</span>
                    </div>
                  )}

                  {/* Long-press target wrapping the bubble */}
                  <div
                    className="relative select-none"
                    onMouseDown={() => handleLongPressStart(msg.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(msg.id)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                  >
                    {/* Emoji reaction popover */}
                    <AnimatePresence>
                      {isPopoverOpen && (
                        <EmojiReactionPopover
                          isMe={isMe}
                          onReact={emoji => handleReact(msg.id, emoji)}
                          onClose={() => setActivePopoverMsgId(null)}
                        />
                      )}
                    </AnimatePresence>

                    {/* Message bubble */}
                    {isGift ? (
                      <GiftBubble
                        gift={GIFTS.find(g => g.id === msg.content) ?? GIFTS[0]}
                        senderName={isMe ? 'Ty' : conv.user.displayName}
                      />
                    ) : isAudio ? (
                      <div className="flex flex-col gap-1">
                        {quotedMsg && <QuotedBubble message={quotedMsg} isMe={isMe} />}
                        <AudioBubble url={msg.content} isMe={isMe} duration={msg.duration} />
                      </div>
                    ) : isMedia ? (
                      <div className="flex flex-col gap-1">
                        {quotedMsg && <QuotedBubble message={quotedMsg} isMe={isMe} />}
                        <MediaBubble url={msg.content} type={msg.type as 'image' | 'video'} isMe={isMe} />
                      </div>
                    ) : (
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? msg.isAnon ? 'bg-secondary border border-primary/30 text-foreground rounded-br-sm' : 'gradient-fire text-primary-foreground rounded-br-sm'
                          : 'glass text-foreground rounded-bl-sm'
                      }`}>
                        {quotedMsg && <QuotedBubble message={quotedMsg} isMe={isMe} />}
                        {msg.content}
                      </div>
                    )}
                  </div>

                  {/* Reaction bar */}
                  <AnimatePresence>
                    {reactionGroups.length > 0 && (
                      <ReactionBar
                        groups={reactionGroups}
                        onToggle={emoji => handleReact(msg.id, emoji)}
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    <span className="text-xs text-muted-foreground">{msg.sentAt}</span>
                    {isMe && <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {isMe && <MessageTimer expiresIn={msg.expiresIn ?? null} />}
                  </div>
                </div>
              </motion.div>
            </SwipeableMessage>
          );
        })}

        <AnimatePresence>
          {peerIsTyping && <TypingBubble name={conv.user.displayName} />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border glass-strong">
        {/* Timer row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowTimerPicker(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${selectedTimer.seconds !== null ? 'bg-primary/20 text-primary border border-primary/30' : 'glass text-muted-foreground'}`}
          >
            <Clock className="w-3 h-3" /><span>{selectedTimer.label}</span>
          </button>
          {isAnonMode && (
            <div className="flex items-center gap-1 text-xs glass px-2.5 py-1 rounded-full text-primary">
              <Ghost className="w-3 h-3" /><span>Anon</span>
            </div>
          )}
        </div>

        {/* Timer picker */}
        <AnimatePresence>
          {showTimerPicker && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="flex gap-2 mb-2 overflow-x-auto scrollbar-hidden">
              {TIMER_OPTIONS.map(opt => (
                <button key={opt.label} onClick={() => { setSelectedTimer(opt); setShowTimerPicker(false); }}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all ${selectedTimer.label === opt.label ? 'gradient-fire text-primary-foreground' : 'glass text-muted-foreground border border-border'}`}>
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <ReplyPreview
              message={replyTo}
              senderName={replyTo.senderId === 'me' ? 'You' : conv.user.displayName}
              onCancel={() => setReplyTo(null)}
            />
          )}
        </AnimatePresence>

        {/* Upload progress */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <UploadProgress progress={uploadProgress} onCancel={() => { uploadCancelRef.current = true; setUploadProgress(null); }} />
          )}
        </AnimatePresence>

        {/* Voice recorder */}
        <AnimatePresence>
          {isRecording && <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors relative group" title="Send photo or video">
            <Image className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <Film className="w-2.5 h-2.5 text-primary absolute bottom-0.5 right-0.5" />
          </button>
          <button onClick={() => setShowGiftPicker(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <GiftIcon className="w-5 h-5 text-accent" />
          </button>
          <button 
            onClick={() => setShowIcebreaker(true)} 
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors group"
            title="AI Spark Icebreaker"
          >
            <Wand2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </button>
          <div className="flex-1 flex items-center bg-secondary rounded-2xl px-4 py-2.5 gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={replyTo ? '↩ Reply...' : isAnonMode ? '👻 Anonymous message...' : 'Message...'}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="relative">
              <button onClick={() => setShowEmojiPicker(v => !v)}>
                <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={emoji => { setText(t => t + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          {text ? (
            <button onClick={handleSend} disabled={sending} className="w-10 h-10 gradient-fire rounded-full flex items-center justify-center disabled:opacity-60">
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          ) : (
            <button onClick={() => !isRecording && setIsRecording(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-destructive/20 border border-destructive' : 'glass'}`}>
              <Mic className={`w-5 h-5 ${isRecording ? 'text-destructive' : 'text-primary'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Anon reveal */}
      <AnimatePresence>
        {showAnonReveal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full bg-card rounded-t-3xl p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-3">👤→😊</div>
                <h3 className="font-bold text-lg">Reveal your identity?</h3>
                <p className="text-sm text-muted-foreground mt-1">{conv.user.displayName} will see your real name and photo</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAnonReveal(false)} className="flex-1 glass py-3.5 rounded-2xl font-semibold">Keep hidden</button>
                <button onClick={() => { setIsAnonMode(false); setShowAnonReveal(false); }} className="flex-1 gradient-fire text-primary-foreground py-3.5 rounded-2xl font-bold">Reveal me! 🔥</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && (
          <ReportUserModal
            userId={conv.user.id}
            userName={conv.user.displayName}
            onClose={() => setShowReportModal(false)}
            onReported={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGiftPicker && <GiftPicker userId={user?.id} onSend={handleGiftSent} onClose={() => setShowGiftPicker(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {revealGift && <GiftReveal gift={revealGift} senderName="You" onDismiss={() => setRevealGift(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showIcebreaker && (
          <IcebreakerModal 
            profile={conv.user} 
            onSelect={(text) => { setText(text); setShowIcebreaker(false); handleSend(); }} 
            onClose={() => setShowIcebreaker(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatsPage() {
  const { user } = useAuth();
  const { conversations, loading, setMatchState } = useConversations(user?.id ?? null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const scoped = conversations.filter(c => !!c.isArchived === showArchived);
  const filtered = scoped.filter(c =>
    c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const archivedCount = conversations.filter(c => c.isArchived).length;

  if (activeConv) {
    return <ChatView conv={activeConv} onBack={() => setActiveConv(null)} setMatchState={setMatchState} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{showArchived ? 'Archiwum' : 'Wiadomości'}</h1>
          {(showArchived || archivedCount > 0) && (
            <button onClick={() => setShowArchived(v => !v)} className="text-xs text-primary font-medium">
              {showArchived ? '← Wróć' : `Archiwum (${archivedCount})`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj dopasowań..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 mb-2"><AdBanner placement="chats" /></div>
      <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hidden">
        {loading ? (
          <div className="space-y-2 px-1 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-3 rounded-2xl glass animate-pulse">
                <div className="w-14 h-14 rounded-full skeleton flex-shrink-0" style={{ background: 'hsl(240 10% 14%)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded-lg skeleton" style={{ width: `${55 + i * 7}%`, background: 'hsl(240 10% 14%)' }} />
                  <div className="h-3 rounded-lg skeleton" style={{ width: `${40 + i * 5}%`, background: 'hsl(240 10% 12%)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((conv, i) => (
              <motion.div key={conv.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ConversationItem conv={conv} onClick={() => setActiveConv(conv)} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50">
            <div className="text-4xl">{searchQuery ? '🔍' : showArchived ? '🗄️' : '💌'}</div>
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery ? `Brak wyników dla "${searchQuery}"` : showArchived ? 'Brak zarchiwizowanych rozmów.' : 'Brak dopasowań.\nZacznij swipe\'ować!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
