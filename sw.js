/* Sale Profit Book — offline support (V8.36)
   Put this file in the SAME folder as index.html (repo root of SALE-PROFIT-BOOK).

   - Page (index.html): network first (so new versions load when online),
     falls back to the saved copy when offline or when the network is very slow.
   - Other same-origin files (manifest, icons): saved copy first, refreshed in background.
   - Only caches named "spb-cache-*" are ever touched, so other apps on the same
     github.io address are not affected. */

const CACHE = 'spb-cache-v8.36';
const CORE = ['./', './index.html', './manifest.json'];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(CORE.map((url) =>
        // one missing file must not break the whole install
        cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.indexOf('spb-cache-') === 0 && k !== CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function fetchWithTimeout(url, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function pageResponse(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetchWithTimeout(request.url, NETWORK_TIMEOUT_MS);
    if (res && res.ok) {
      cache.put('./index.html', res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const saved = (await cache.match('./index.html', { ignoreSearch: true })) ||
                  (await cache.match('./', { ignoreSearch: true }));
    if (saved) return saved;
    return fetch(request); // nothing saved yet: let the browser show its normal error
  }
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request, { ignoreSearch: true });
  const refresh = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  }).catch(() => saved);
  return saved || refresh;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Google Drive backup etc. go straight to the network
  if (request.mode === 'navigate') {
    event.respondWith(pageResponse(request));
    return;
  }
  event.respondWith(assetResponse(request));
});
