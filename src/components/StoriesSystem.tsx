import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronLeft, ChevronRight, Eye, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useR2Upload } from '@/hooks/useR2Upload';
import { toast } from 'sonner';

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
    try {
      await db.from('story_reactions').insert({
        story_id: storyId,
        reactor_id: user.id,
        owner_id: ownerId,
        emoji,
      });
    } catch { /* silent */ }
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

// ── Real stories fetch hook ─────────────────────────────────────────────────

export function useStories(userId: string | null) {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [{ data: blocksMade }, { data: blocksReceived }, { data: myViews }, { data: rows, error }] = await Promise.all([
        db.from('user_blocks').select('blocked_id').eq('blocker_id', userId),
        db.from('user_blocks').select('blocker_id').eq('blocked_id', userId),
        db.from('story_views').select('story_id').eq('viewer_id', userId),
        db.from('stories')
          .select('id, user_id, media_url, media_type, caption, created_at, expires_at, profiles!user_id(display_name, avatar_url), story_views(count)')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true }),
      ]);
      if (error) throw error;

      const blockedIds = new Set([
        ...(blocksMade ?? []).map((r: { blocked_id: string }) => r.blocked_id),
        ...(blocksReceived ?? []).map((r: { blocker_id: string }) => r.blocker_id),
      ]);
      const viewedIds = new Set((myViews ?? []).map((r: { story_id: string }) => r.story_id));

      const byUser = new Map<string, UserStory>();
      for (const r of (rows ?? [])) {
        if (blockedIds.has(r.user_id)) continue;
        const story: Story = {
          id: r.id,
          mediaUrl: r.media_url,
          type: r.media_type === 'video' ? 'video' : 'image',
          expiresAt: new Date(r.expires_at),
          createdAt: new Date(r.created_at),
          viewCount: r.story_views?.[0]?.count ?? 0,
          caption: r.caption ?? undefined,
        };
        const existing = byUser.get(r.user_id);
        if (existing) {
          existing.stories.push(story);
          if (!viewedIds.has(story.id)) existing.hasUnread = true;
        } else {
          byUser.set(r.user_id, {
            userId: r.user_id,
            displayName: r.profiles?.display_name ?? 'User',
            avatarUrl: r.profiles?.avatar_url ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
            stories: [story],
            hasUnread: !viewedIds.has(story.id),
            isCurrentUser: r.user_id === userId,
          });
        }
      }

      // Own stories first, then unread, then read
      const list = Array.from(byUser.values()).sort((a, b) => {
        if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
        if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
        return 0;
      });
      setUserStories(list);
    } catch (err) {
      console.error('fetchStories error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  return { userStories, loading, refetch: fetchStories };
}

async function recordStoryView(storyId: string, viewerId: string) {
  try {
    await db.from('story_views').upsert(
      { story_id: storyId, viewer_id: viewerId },
      { onConflict: 'story_id,viewer_id', ignoreDuplicates: true }
    );
  } catch { /* silent */ }
}

// ── Story Viewer ──────────────────────────────────────────────────────────────

interface StoryViewerProps {
  userStories: UserStory[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ userStories, startIndex, onClose }: StoryViewerProps) {
  const { user } = useAuth();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, storyIdx, paused]);

  useEffect(() => {
    if (currentStory && user) recordStoryView(currentStory.id, user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id, user?.id]);

  const advance = () => {
    const u = userStories[userIdx];
    if (storyIdx < u.stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (userIdx < userStories.length - 1) {
      setUserIdx(u2 => u2 + 1);
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
    const h = Math.max(0, Math.floor(diff / 3600000));
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
        {currentStory.type === 'video' ? (
          <motion.video
            key={currentStory.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={currentStory.mediaUrl}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <motion.img
            key={currentStory.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={currentStory.mediaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/50" />

        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-safe pt-3">
          {currentUser.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-foreground/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground rounded-full"
                style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
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

        {currentStory.caption && (
          <div className="absolute bottom-28 left-0 right-0 z-20 px-5">
            <p className="text-foreground font-medium text-sm text-center drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {!currentUser.isCurrentUser && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-5">
            <StoryReactions
              storyId={currentStory.id}
              ownerId={currentUser.userId}
              ownerName={currentUser.displayName}
              onReact={() => setPaused(false)}
            />
          </div>
        )}

        <div className="absolute bottom-16 right-4 z-20 flex items-center gap-1 glass px-2.5 py-1 rounded-full">
          <Eye className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{currentStory.viewCount}</span>
        </div>

        <button
          className="absolute left-0 top-0 z-10 w-1/3 h-full"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => { setPaused(false); retreat(); }}
        />
        <button
          className="absolute right-0 top-0 z-10 w-1/3 h-full"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => { setPaused(false); advance(); }}
        />

        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-4">
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

// ── Add Story button (real upload) ─────────────────────────────────────────────

function AddStoryButton({ hasOwnStory, onOpenOwn, onUploaded }: { hasOwnStory: boolean; onOpenOwn: () => void; onUploaded: () => void }) {
  const { user } = useAuth();
  const { upload } = useR2Upload();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const isVideo = file.type.startsWith('video/');
    setUploading(true);
    try {
      const { publicUrl } = await upload({ bucket: 'avatars', file });
      const { error } = await db.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
      });
      if (error) throw error;
      toast.success('Twoja relacja jest już widoczna 🎉');
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się dodać relacji');
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      onClick={() => hasOwnStory ? onOpenOwn() : fileRef.current?.click()}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
      <div className="relative w-16 h-16">
        <div className="w-full h-full rounded-full glass border-2 border-dashed border-primary/40 flex items-center justify-center">
          {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Plus className="w-6 h-6 text-primary" />}
        </div>
        {hasOwnStory && (
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 gradient-fire rounded-full flex items-center justify-center border-2 border-background"
          >
            <Plus className="w-3 h-3 text-primary-foreground" />
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{hasOwnStory ? 'Twoja relacja' : 'Dodaj relację'}</span>
    </button>
  );
}

// ── Stories Bar (horizontal scrollable strip, real data) ───────────────────────

interface StoriesBarProps {
  showAddButton?: boolean;
}

export function StoriesBar({ showAddButton = true }: StoriesBarProps) {
  const { user } = useAuth();
  const { userStories, loading, refetch } = useStories(user?.id ?? null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

  const openStory = (idx: number) => {
    setViewerStart(idx);
    setViewerOpen(true);
  };

  const ownIdx = userStories.findIndex(us => us.isCurrentUser);
  const others = userStories.filter(us => !us.isCurrentUser);

  if (!loading && userStories.length === 0 && !showAddButton) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hidden px-1 py-2">
        {showAddButton && (
          <AddStoryButton
            hasOwnStory={ownIdx >= 0}
            onOpenOwn={() => openStory(ownIdx)}
            onUploaded={refetch}
          />
        )}

        {others.map((us) => (
          <StoryRing
            key={us.userId}
            avatarUrl={us.avatarUrl}
            displayName={us.displayName}
            hasUnread={us.hasUnread}
            onClick={() => openStory(userStories.findIndex(u => u.userId === us.userId))}
          />
        ))}
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            userStories={userStories}
            startIndex={viewerStart}
            onClose={() => { setViewerOpen(false); refetch(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
