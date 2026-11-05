/* SAFIP FieldOps — Service Worker do protótipo (PWA).
   Estratégia: network-first para navegação e assets versionados; cache-first para ícones/demo.
   Objetivo: abrir o Portal do Motorista offline e manter a fila local (Zustand/IndexedDB).
   NÃO há backend real: sincronização de ocorrências/checklists é simulada no app. */
const CACHE = 'safip-fieldops-v10';
const PRECACHE = ['/', '/motorista', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('safip-fieldops-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Não intercepta HMR/dev endpoints nem APIs futuras.
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}));
          return res;
        })
        .catch(async () => {
          return (await caches.match(req))
            || (await caches.match('/motorista'))
            || (await caches.match('/'))
            || new Response('Sem conexão. Reconecte para carregar o aplicativo.', {
              status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/demo/'))) {
          const copy = res.clone();
          event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}));
        }
        return res;
      });
    }),
  );
});
