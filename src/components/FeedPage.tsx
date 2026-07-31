import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, Shield, CheckCircle2, TrendingUp, Sparkles, Flame } from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  is_spicy: boolean;
  created_at: string;
  user: {
    display_name: string;
    avatar_url: string;
    is_verified: boolean;
    age: number;
    city: string;
  };
}

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    user_id: 'u1',
    content: 'Wieczorny spacer po Warszawie. Ktoś dołączy? 🌙✨',
    image_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    likes_count: 124,
    comments_count: 12,
    is_spicy: false,
    created_at: new Date().toISOString(),
    user: {
      display_name: 'Sofia',
      avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&q=80',
      is_verified: true,
      age: 24,
      city: 'Warsaw'
    }
  },
  {
    id: 'p2',
    user_id: 'u2',
    content: 'Nowa sukienka, jak wam się podoba? 👗🔥 #date #hot',
    image_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80',
    likes_count: 210,
    comments_count: 45,
    is_spicy: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      display_name: 'Mia',
      avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&q=80',
      is_verified: true,
      age: 22,
      city: 'Kraków'
    }
  }
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [activeTab, setActiveTab] = useState<'for_you' | 'nearby' | 'spicy'>('for_you');

  // Load posts from Supabase (placeholder for real query)
  useEffect(() => {
    // In real app: fetch from social_posts with user join
  }, []);

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header Tabs */}
      <div className="px-5 pt-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black gradient-text italic">Feed</h1>
          <button className="w-10 h-10 gradient-fire rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto scrollbar-hidden">
          {([
            { id: 'for_you', label: 'Dla Ciebie', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'nearby', label: 'W pobliżu', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: 'spicy', label: 'Spicy 🔥', icon: <Flame className="w-3.5 h-3.5 text-primary" /> }
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

      {/* Feed Scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-20">
        <div className="flex flex-col gap-4 p-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl overflow-hidden border border-border/40 group shadow-sm"
            >
              {/* User Info */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                    <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{post.user.display_name}, {post.user.age}</span>
                      {post.user.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{post.user.city} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button className="w-8 h-8 glass rounded-full flex items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
                </div>
              )}

              {/* Post Image */}
              <div className="relative aspect-[4/5] bg-secondary/30">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {post.is_spicy && (
                  <div className="absolute top-4 left-4 glass-dark px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 backdrop-blur-xl">
                    <Flame className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Spicy 18+</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Actions */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 group/btn"
                  >
                    <Heart className="w-6 h-6 text-muted-foreground group-active/btn:scale-125 group-active/btn:text-primary transition-all" />
                    <span className="text-xs font-bold text-muted-foreground">{post.likes_count}</span>
                  </button>
                  <button className="flex items-center gap-1.5 group/btn">
                    <MessageCircle className="w-6 h-6 text-muted-foreground group-active/btn:scale-125 transition-all" />
                    <span className="text-xs font-bold text-muted-foreground">{post.comments_count}</span>
                  </button>
                  <button className="group/btn">
                    <Share2 className="w-6 h-6 text-muted-foreground group-active/btn:scale-125 transition-all" />
                  </button>
                </div>
                
                {/* Chemistry Match Badge */}
                <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold gradient-text">92% Match</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
