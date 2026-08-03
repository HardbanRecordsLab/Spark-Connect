import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Newspaper, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/useSeo';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author: string;
  created_at: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'Blog',
    description: 'Blog Spark Connect: porady randkowe, bezpieczeństwo online i nowości w darmowej aplikacji randkowej 18+.',
    path: '/blog',
  });

  useEffect(() => {
    db.from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, author, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: BlogPostSummary[] | null }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Blog</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl gradient-fire flex items-center justify-center">
            <Newspaper className="text-white w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Aktualności</p>
            <h2 className="text-2xl font-black uppercase">Spark Connect Blog</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold mb-2">Jeszcze nic tu nie ma</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">Pierwsze artykuły pojawią się już wkrótce.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <motion.button
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="text-left glass-strong rounded-[2rem] border border-white/10 overflow-hidden hover:border-primary/30 transition-all"
              >
                {post.cover_image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-2">
                    {post.author} · {new Date(post.created_at).toLocaleDateString('pl-PL')}
                  </p>
                  <h3 className="text-lg font-black mb-2 leading-tight">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-white/50 leading-relaxed line-clamp-3">{post.excerpt}</p>}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
