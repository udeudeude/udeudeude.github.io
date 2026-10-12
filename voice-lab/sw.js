/* Network-first service worker: ALWAYS fetch new interface/code while online.
 * Cache is a fallback for offline editing, never a source of stale releases.
 * Voice audition MP3s and availability manifest are never cached.
 */
const CACHE='kokoro-voice-lab-shell-v5';
const REV='?rev=kokoro-54-v2';
const ASSETS=['./','./index.html','./style.css'+REV,'./app.js'+REV,
  './engine-worker.js'+REV,'./icon.svg','./manifest.webmanifest','./voice-catalog.json'+REV];
const SHELL_URLS=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||!SHELL_URLS.has(req.url))return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){
      const copy=response.clone();
      // Do not delay playback or paint while cache storage updates.
      caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
    }
    return response;
  }).catch(async()=>{
    const saved=await caches.match(req);
    return saved||Response.error();
  }));
});
