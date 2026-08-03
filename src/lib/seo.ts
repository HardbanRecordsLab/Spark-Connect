// Lightweight per-route SEO tag manager for a client-rendered SPA.
// No react-helmet dependency: directly upserts the same <meta>/<link> tags
// that already exist statically in index.html, so every route gets its own
// title/description/canonical/OG instead of the one fixed set index.html ships.

const SITE_NAME = 'Spark Connect';
const SITE_URL = 'https://spark-connect.hardbanrecordslab.online';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const JSONLD_ID = 'seo-jsonld-route';

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export interface SeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export function applySeo({ title, description, path, image, noindex, jsonLd }: SeoOptions) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const resolvedImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_IMAGE;

  document.title = fullTitle;

  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: noindex ? 'noindex, nofollow' : 'index, follow',
  });
  upsertCanonical(url);

  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: resolvedImage });

  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: resolvedImage });

  document.getElementById(JSONLD_ID)?.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSONLD_ID;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
