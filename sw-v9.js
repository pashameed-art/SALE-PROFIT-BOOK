const PREFIX = 'spb-v9-';
const C = PREFIX + '3';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(C);
    await Promise.all(['./', './index.html', './manifest.json'].map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Only this app's own old caches; the other apps on this origin keep theirs.
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== C) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(C).then(x => x.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html')).then(m => m || Response.error()))
  );
});
