// Rehoteq RMS — Service Worker v3
// Full offline support + background sync

const CACHE = 'rehoteq-rms-v3';
const OFFLINE = '/rms/offline.html';

const PRECACHE = [
  '/rms/',
  '/rms/index.html',
  '/rms/offline.html',
  '/rms/manifest.json',
  '/rms/icon-192.png',
  '/rms/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML: network first, cache fallback, offline page last
// - Firebase/CDN: network only (real-time data must be fresh)
// - Static assets (fonts, icons): cache first
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET
  if (e.request.method !== 'GET') return;

  // Firebase — always network
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('googleapis')) {
    return; // fall through to browser default
  }

  // HTML pages — network first
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request)
            .then(cached => cached || caches.match(OFFLINE))
        )
    );
    return;
  }

  // Everything else — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(OFFLINE));
    })
  );
});

// Background sync — notify clients when back online
self.addEventListener('sync', e => {
  if (e.tag === 'rms-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_READY' }))
      )
    );
  }
});
