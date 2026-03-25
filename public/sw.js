/* Spark Connect – Service Worker
   Strategy:
   - App shell (HTML/JS/CSS): Cache-First, versioned cache
   - Images (avatars, media): Network-First with cache fallback
   - API / Supabase: Network-only (never cache auth/DB)
   - Push notifications: handled here
*/

const CACHE_VERSION = 'sc-v5';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;
const MAX_IMAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// App shell assets to precache on install
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
];

// ── Install: precache shell ───────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('sc-') && k !== SHELL_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategies ────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, non-http, supabase API, R2 presign calls
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('cloudflarestorage.com')) return;
  if (url.pathname.startsWith('/functions/')) return;

  // Images from R2 CDN domains — Network-First with image cache
  if (
    url.hostname.includes('hardbanrecordslab.online') ||
    url.pathname.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|mp3|ogg)$/)
  ) {
    e.respondWith(networkFirstImage(request));
    return;
  }

  // App shell — Cache-First (only for same-origin JS/CSS/Fonts)
  if (
    url.origin === self.location.origin && (
      url.pathname.match(/\.(js|css|woff2?)$/) ||
      SHELL_ASSETS.includes(url.pathname)
    )
  ) {
    e.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // HTML navigation (SPA) — serve index.html from cache when offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(async () => {
        const cachedResponse = await caches.match('/');
        if (cachedResponse) return cachedResponse;
        return new Response('Offline: Spark Connect requires an internet connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }
});

async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.url.startsWith('http')) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
      } catch (err) {
        console.warn('SW: Cache put failed', err);
      }
    }
    return response;
  } catch (err) {
    console.error('SW: cacheFirst fetch failed', err);
    // If everything fails, return a 404 or let the browser handle it
    return new Response('Network error', { status: 408 });
  }
}

async function networkFirstImage(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.url.startsWith('http')) {
      try {
        const cache = await caches.open(IMAGE_CACHE);
        await cache.put(request, response.clone());
      } catch (err) {
        console.warn('SW: Image cache put failed', err);
      }
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 408 });
  }
}

// ── Push notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: 'Spark Connect 🔥', body: event.data.text() }; }

  const title   = payload.title || 'Spark Connect 🔥';
  const options = {
    body:    payload.body || 'Masz nową wiadomość',
    icon:    '/icon-192.png',
    badge:   '/favicon.png',
    data:    { url: payload.url || '/' },
    vibrate: [100, 50, 100],
    tag:     payload.tag || 'spark-notification',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
