const CACHE_NAME='sale-profit-book-v5.05';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(['./','./index.html','./manifest.json'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET') return;
 const url=new URL(event.request.url);
 if(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put(event.request,c));return r}).catch(()=>caches.match(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));
});
