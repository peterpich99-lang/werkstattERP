const CACHE = 'werkstatt-v15';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Only handle same-origin requests — never intercept Supabase, fonts, CDNs
  if (!url.startsWith(self.location.origin)) return;

  // Navigation (HTML): always network first so updates load immediately
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { cache(r.clone()); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Versioned assets (?v=N): cache first (immutable)
  if (/\?v=\d+/.test(url)) {
    e.respondWith(
      caches.match(e.request).then(hit =>
        hit || fetch(e.request).then(r => { cache(r.clone()); return r; })
      )
    );
    return;
  }

  // Everything else: network first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(r => { cache(r.clone()); return r; })
      .catch(() => caches.match(e.request))
  );
});

function cache(response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return;
  caches.open(CACHE).then(c => c.put(response.url, response));
}
