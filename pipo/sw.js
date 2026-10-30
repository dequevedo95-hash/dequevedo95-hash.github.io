const CACHE = 'pipo-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const esPagina = event.request.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('/index.html');

  if (esPagina) {
    /* Network-first para la página: el teléfono recibe siempre la versión nueva */
    event.respondWith(
      fetch(event.request).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
        } catch (e) {}
        return res;
      }).catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        } catch (e) {}
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
