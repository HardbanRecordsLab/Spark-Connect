import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/useSeo';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface BlogPostFull {
  id: string;
  slug: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  author: string;
  created_at: string;
}

function excerptFromHtml(html: string, maxLen = 160): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

const BlogPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo({
    title: post?.title ?? 'Blog',
    description: post ? excerptFromHtml(post.content) : 'Blog Spark Connect: porady randkowe i bezpieczeństwo online.',
    path: `/blog/${slug ?? ''}`,
    image: post?.cover_image_url ?? undefined,
    noindex: notFound,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          image: post.cover_image_url ?? undefined,
          author: { '@type': 'Person', name: post.author },
          datePublished: post.created_at,
          mainEntityOfPage: `https://spark-connect.hardbanrecordslab.online/blog/${post.slug}`,
        }
      : undefined,
  });

  useEffect(() => {
    if (!slug) return;
    db.from('blog_posts')
      .select('id, slug, title, content, cover_image_url, author, created_at')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }: { data: BlogPostFull | null }) => {
        if (!data) { setNotFound(true); setLoading(false); return; }
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/blog')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Blog</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : notFound || !post ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-2">Nie znaleziono artykułu</h3>
            <button onClick={() => navigate('/blog')} className="text-primary text-sm underline mt-2">Wróć do bloga</button>
          </div>
        ) : (
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {post.cover_image_url && (
              <div className="aspect-video w-full rounded-[2rem] overflow-hidden mb-8 border border-white/10">
                <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">
              {post.author} · {new Date(post.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8 leading-tight">{post.title}</h1>
            <div className="space-y-4 text-white/80 leading-relaxed text-justify">
              {post.content.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
};

export default BlogPost;
