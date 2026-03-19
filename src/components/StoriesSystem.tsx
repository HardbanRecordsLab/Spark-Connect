import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronLeft, ChevronRight, Eye, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Story Reactions ────────────────────────────────────────────
const REACTION_EMOJIS = ['🔥', '💋', '😍', '👀', '❤️', '💦'];

interface StoryReactionsProps {
  storyId: string;
  ownerId: string;
  ownerName: string;
  onReact: () => void;
}

function StoryReactions({ storyId, ownerId, ownerName, onReact }: StoryReactionsProps) {
  const { user } = useAuth();
  const [sent, setSent] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState('');

  const sendReaction = async (emoji: string) => {
    if (!user || sent) return;
    setSent(emoji);
    onReact();
    // Save reaction and open a conversation/message to the story owner
    try {
      await db.from('story_reactions').insert({
        story_id: storyId,
        reactor_id: user.id,
        owner_id: ownerId,
        emoji,
      });
    } catch { /* table may not exist in all envs */ }
  };

  const sendMessage = async () => {
    if (!user || !message.trim()) return;
    setSent('💬');
    setShowInput(false);
    onReact();
    try {
      await db.from('story_reactions').insert({
        story_id: storyId,
        reactor_id: user.id,
        owner_id: ownerId,
        emoji: '💬',
        message: message.trim(),
      });
    } catch { /* silent */ }
    setMessage('');
  };

  if (sent) {
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="flex justify-center">
        <div className="glass px-4 py-2 rounded-full text-sm text-center">
          {sent} Wysłano do <span className="font-semibold text-primary">{ownerName}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Emoji reactions row */}
      <div className="flex items-center justify-center gap-2">
        {REACTION_EMOJIS.map(emoji => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.3, y: -3 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => sendReaction(emoji)}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-xl shadow-lg"
          >
            {emoji}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowInput(!showInput)}
          className="w-10 h-10 glass rounded-full flex items-center justify-center"
        >
          <Send className="w-4 h-4 text-primary" />
        </motion.button>
      </div>

      {/* Text input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 glass rounded-2xl px-3 py-2"
          >
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Napisz do ${ownerName}...`}
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            <button onClick={sendMessage} disabled={!message.trim()}
              className="w-7 h-7 gradient-fire rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40">
              <Send className="w-3 h-3 text-primary-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Types ─────────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  mediaUrl: string;
  type: 'image' | 'video';
  expiresAt: Date;
  createdAt: Date;
  viewCount: number;
  caption?: string;
}

export interface UserStory {
  userId: string;
  displayName: string;
  avatarUrl: string;
  stories: Story[];
  hasUnread: boolean;
  isCurrentUser?: boolean;
}

// ── Mock story data ───────────────────────────────────────────────────────────

export const mockUserStories: UserStory[] = [
  {
    userId: '1', displayName: 'Sofia', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
    hasUnread: true,
    stories: [
      { id: 's1', mediaUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80', type: 'image', expiresAt: new Date(Date.now() + 18 * 3600000), createdAt: new Date(Date.now() - 3 * 3600000), viewCount: 14, caption: 'Good morning Warsaw ☀️' },
      { id: 's2', mediaUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80', type: 'image', expiresAt: new Date(Date.now() + 20 * 3600000), createdAt: new Date(Date.now() - 1 * 3600000), viewCount: 6, caption: 'Coffee time ☕' },
    ],
  },
  {
    userId: '2', displayName: 'Mia', avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
    hasUnread: true,
    stories: [
      { id: 's3', mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', type: 'image', expiresAt: new Date(Date.now() + 12 * 3600000), createdAt: new Date(Date.now() - 6 * 3600000), viewCount: 32, caption: 'Weekend vibes 🎉' },
    ],
  },
  {
    userId: '4', displayName: 'Zara', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
    hasUnread: false,
    stories: [
      { id: 's4', mediaUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', type: 'image', expiresAt: new Date(Date.now() + 5 * 3600000), createdAt: new Date(Date.now() - 8 * 3600000), viewCount: 21 },
    ],
  },
  {
    userId: '5', displayName: 'Alex', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
    hasUnread: true,
    stories: [
      { id: 's5', mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', type: 'image', expiresAt: new Date(Date.now() + 2 * 3600000), createdAt: new Date(Date.now() - 10 * 3600000), viewCount: 8, caption: 'New PB at the gym 💪' },
    ],
  },
];

// ── Story Viewer ──────────────────────────────────────────────────────────────

interface StoryViewerProps {
  userStories: UserStory[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ userStories, startIndex, onClose }: StoryViewerProps) {
  const [userIdx, setUserIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = userStories[userIdx];
  const currentStory = currentUser?.stories[storyIdx];
  const DURATION = 5000; // ms per story

  useEffect(() => {
    setProgress(0);
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          advance();
          return 0;
        }
        return p + (100 / (DURATION / 100));
      });
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userIdx, storyIdx, paused]);

  const advance = () => {
    const user = userStories[userIdx];
    if (storyIdx < user.stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (userIdx < userStories.length - 1) {
      setUserIdx(u => u + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const retreat = () => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (userIdx > 0) {
      setUserIdx(u => u - 1);
      setStoryIdx(userStories[userIdx - 1].stories.length - 1);
    }
    setProgress(0);
  };

  const timeLeft = () => {
    const diff = currentStory ? currentStory.expiresAt.getTime() - Date.now() : 0;
    const h = Math.floor(diff / 3600000);
    return `${h}h left`;
  };

  if (!currentUser || !currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-background flex items-center justify-center"
    >
      <div className="relative w-full max-w-sm h-full mx-auto">
        {/* Background image */}
        <motion.img
          key={currentStory.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={currentStory.mediaUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/50" />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-safe pt-3">
          {currentUser.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-foreground/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground rounded-full"
                style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-primary" />
            <div>
              <div className="text-sm font-bold text-foreground">{currentUser.displayName}</div>
              <div className="text-xs text-foreground/70">{timeLeft()}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-28 left-0 right-0 px-5">
            <p className="text-foreground font-medium text-sm text-center drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {/* Reactions strip */}
        <div className="absolute bottom-20 left-0 right-0 px-5">
          <StoryReactions
            storyId={currentStory.id}
            ownerId={currentUser.id}
            ownerName={currentUser.displayName}
            onReact={() => setPaused(false)}
          />
        </div>

        {/* View count */}
        <div className="absolute bottom-16 right-4 flex items-center gap-1 glass px-2.5 py-1 rounded-full">
          <Eye className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{currentStory.viewCount}</span>
        </div>

        {/* Tap zones */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => { setPaused(false); retreat(); }}
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => { setPaused(false); advance(); }}
        />

        {/* User navigation arrows */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-4">
          <button
            onClick={() => { if (userIdx > 0) { setUserIdx(u => u - 1); setStoryIdx(0); } }}
            className={`w-9 h-9 glass rounded-full flex items-center justify-center transition-opacity ${userIdx === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-xs text-muted-foreground font-medium">
            {userIdx + 1} / {userStories.length}
          </div>
          <button
            onClick={() => { if (userIdx < userStories.length - 1) { setUserIdx(u => u + 1); setStoryIdx(0); } }}
            className={`w-9 h-9 glass rounded-full flex items-center justify-center transition-opacity ${userIdx === userStories.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Story Ring (avatar with ring) ─────────────────────────────────────────────

interface StoryRingProps {
  avatarUrl: string;
  displayName: string;
  hasUnread: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
}

export function StoryRing({ avatarUrl, displayName, hasUnread, size = 'md', onClick }: StoryRingProps) {
  const sizeMap = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' };
  const textMap = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className={`relative ${sizeMap[size]}`}>
        {hasUnread ? (
          <div className="story-ring w-full h-full rounded-full p-[2.5px]">
            <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-full rounded-full p-[2.5px] border-2 border-border">
            <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover opacity-60" />
          </div>
        )}
        {hasUnread && (
          <motion.div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 gradient-fire rounded-full border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>
      <span className={`${textMap[size]} text-muted-foreground max-w-[60px] truncate`}>{displayName}</span>
    </button>
  );
}

// ── Stories Bar (horizontal scrollable strip) ──────────────────────────────────

interface StoriesBarProps {
  userStories: UserStory[];
  showAddButton?: boolean;
}

export function StoriesBar({ userStories, showAddButton = true }: StoriesBarProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

  const openStory = (idx: number) => {
    setViewerStart(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hidden px-1 py-2">
        {/* Add story button */}
        {showAddButton && (
          <button className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative w-16 h-16">
              <div className="w-full h-full rounded-full glass border-2 border-dashed border-primary/40 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Your story</span>
          </button>
        )}

        {userStories.map((us, i) => (
          <StoryRing
            key={us.userId}
            avatarUrl={us.avatarUrl}
            displayName={us.displayName}
            hasUnread={us.hasUnread}
            onClick={() => openStory(i)}
          />
        ))}
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            userStories={userStories}
            startIndex={viewerStart}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
