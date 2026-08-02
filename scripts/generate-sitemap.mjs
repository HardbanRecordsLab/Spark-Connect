// Runs as a "postbuild" step (see package.json) so it fires automatically
// after `npm run build` on every Vercel deploy, keeping the published blog
// posts in sitemap.xml in sync with production without a separate job.
//
// Deliberately never fails the build: sitemap freshness isn't worth breaking
// a deploy over, so any Supabase error just falls back to the static routes.
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://spark-connect.hardbanrecordslab.online';
const OUT_FILE = 'dist/sitemap.xml';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/about', priority: '0.6' },
  { path: '/safety', priority: '0.6' },
  { path: '/premium-info', priority: '0.6' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
  { path: '/gdpr', priority: '0.3' },
  { path: '/blog', priority: '0.7' },
];

async function fetchBlogPosts() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn('[sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set — skipping blog posts.');
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, created_at')
      .eq('published', true);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[sitemap] Failed to fetch blog posts, continuing without them:', err.message);
    return [];
  }
}

function urlEntry(path, lastmod, priority) {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${path}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function main() {
  const posts = await fetchBlogPosts();

  const entries = [
    ...STATIC_ROUTES.map((r) => urlEntry(r.path, null, r.priority)),
    ...posts.map((p) => urlEntry(`/blog/${p.slug}`, p.created_at, '0.6')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  writeFileSync(OUT_FILE, xml);
  console.log(`[sitemap] Wrote ${OUT_FILE} with ${STATIC_ROUTES.length} static routes + ${posts.length} blog posts.`);
}

main();
