// Rehoteq RMS — Service Worker v5
// Lean precache — no 404s on install

const CACHE = 'rehoteq-rms-v5';

// Only cache what definitely exists
// Icons and other assets cached lazily on first request
const PRECACHE = [
  './index.html',
  './manifest.json',
  './offline.html'
];

// Install — cache core files, fail silently on missing
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(err => {
          console.warn('SW precache skip:', url, err.message);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

// Activate — wipe old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Always use network for Firebase / Google APIs
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('paystack') ||
      url.hostname.includes('newsdata')) {
    return; // Let browser handle
  }

  // HTML — network first, cache fallback, offline page last resort
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request)
            .then(cached => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // Static assets — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response('Not available offline', { status: 503 }));
    })
  );
});

// Push notifications (future use)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'Rehoteq RMS', {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png'
  });
});
