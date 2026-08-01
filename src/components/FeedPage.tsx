import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, Shield, CheckCircle2, TrendingUp, Sparkles, Flame, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useR2Upload } from '@/hooks/useR2Upload';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_spicy: boolean;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
    age: number | null;
    city: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  distanceKm?: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function ComposeModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { user } = useAuth();
  const { upload } = useR2Upload();
  const [content, setContent] = useState('');
  const [isSpicy, setIsSpicy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!user || (!content.trim() && !file)) return;
    setPosting(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const { publicUrl } = await upload({ bucket: 'avatars', file, filename: file.name });
        image_url = publicUrl;
      }
      const { error } = await db.from('social_posts').insert({
        user_id: user.id,
        content: content.trim() || null,
        image_url,
        is_spicy: isSpicy,
      });
      if (error) throw error;
      toast.success('Opublikowano!');
      onPosted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się opublikować.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-strong rounded-3xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Nowy post</h2>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Co u Ciebie?" rows={4} maxLength={500}
          className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border resize-none mb-3"
        />
        {previewUrl ? (
          <div className="relative mb-3 rounded-xl overflow-hidden aspect-video">
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 w-7 h-7 glass-strong rounded-full flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="w-full glass border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground mb-3">
            📷 Dodaj zdjęcie
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />

        <label className="flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={isSpicy} onChange={e => setIsSpicy(e.target.checked)} />
          🔥 Oznacz jako Spicy 18+
        </label>

        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && !file)}
          className="w-full gradient-fire text-primary-foreground font-bold py-3 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opublikuj'}
        </button>
      </div>
    </motion.div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for_you' | 'nearby' | 'spicy'>('for_you');
  const [showCompose, setShowCompose] = useState(false);

  const load = async () => {
    setLoading(true);
    const selectCols = 'id, user_id, content, image_url, likes_count, comments_count, is_spicy, created_at, profiles!user_id(display_name, avatar_url, is_verified, age, city, lat, lng)';
    let query = db.from('social_posts').select(selectCols).order('created_at', { ascending: false }).limit(activeTab === 'nearby' ? 100 : 30);
    if (activeTab === 'spicy') query = query.eq('is_spicy', true);
    const { data } = await query;
    let result: Post[] = data ?? [];

    if (activeTab === 'nearby' && user) {
      const { data: me } = await db.from('profiles').select('lat, lng').eq('id', user.id).maybeSingle();
      if (me?.lat && me?.lng) {
        result = result
          .filter(p => p.profiles?.lat && p.profiles?.lng)
          .map(p => ({ ...p, distanceKm: haversineKm(me.lat, me.lng, p.profiles.lat!, p.profiles.lng!) }))
          .filter(p => (p.distanceKm ?? Infinity) <= 100)
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      } else {
        result = [];
      }
    }

    setPosts(result);

    if (user && result.length) {
      const { data: likes } = await db.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', result.map((p: Post) => p.id));
      setLikedIds(new Set((likes ?? []).map((l: { post_id: string }) => l.post_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeTab, user?.id]);

  const toggleLike = async (post: Post) => {
    if (!user) return;
    const alreadyLiked = likedIds.has(post.id);
    setLikedIds(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + (alreadyLiked ? -1 : 1) } : p));

    if (alreadyLiked) {
      await db.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await db.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black gradient-text italic">Feed</h1>
          <button onClick={() => setShowCompose(true)} className="w-10 h-10 gradient-fire rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto scrollbar-hidden">
          {([
            { id: 'for_you', label: 'Dla Ciebie', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'nearby', label: 'W pobliżu', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: 'spicy', label: 'Spicy 🔥', icon: <Flame className="w-3.5 h-3.5 text-primary" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="text-5xl mb-4">🎞️</div>
            <h3 className="text-lg font-bold mb-2">Feed jest jeszcze pusty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Budujemy społeczność od zera, bez sztucznych postów. Bądź jednym z pierwszych, którzy tu coś opublikują.</p>
          </div>
        ) : (
        <div className="flex flex-col gap-4 p-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl overflow-hidden border border-border/40 group shadow-sm"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                    <img src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&q=80'} alt="" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{post.profiles?.display_name ?? 'User'}{post.profiles?.age ? `, ${post.profiles.age}` : ''}</span>
                      {post.profiles?.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {post.distanceKm != null ? `${post.distanceKm} km` : post.profiles?.city ?? ''} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 glass rounded-full flex items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
                </div>
              )}

              {post.image_url && (
                <div className="relative aspect-[4/5] bg-secondary/30">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {post.is_spicy && (
                    <div className="absolute top-4 left-4 glass-dark px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 backdrop-blur-xl">
                      <Flame className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Spicy 18+</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button onClick={() => toggleLike(post)} className="flex items-center gap-1.5 group/btn">
                    <Heart className={`w-6 h-6 transition-all group-active/btn:scale-125 ${likedIds.has(post.id) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold text-muted-foreground">{post.likes_count}</span>
                  </button>
                  <button onClick={() => toast('Komentarze pojawią się wkrótce 💬')} className="flex items-center gap-1.5 group/btn">
                    <MessageCircle className="w-6 h-6 text-muted-foreground group-active/btn:scale-125 transition-all" />
                    <span className="text-xs font-bold text-muted-foreground">{post.comments_count}</span>
                  </button>
                  <button className="group/btn">
                    <Share2 className="w-6 h-6 text-muted-foreground group-active/btn:scale-125 transition-all" />
                  </button>
                </div>

                <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold gradient-text">{post.profiles?.is_verified ? 'Zweryfikowana' : 'Realny profil'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onPosted={load} />}
    </div>
  );
}
