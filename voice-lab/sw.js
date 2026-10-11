/* Keep only the small static editor shell offline.
 * Voice recordings and availability manifest are intentionally NOT cached,
 * so users see newly published samples and do not accumulate dozens of MP3s.
 */
const CACHE='lewis-voice-lab-shell-v4';
const ASSETS=['./','./index.html','./style.css','./app.js','./engine-worker.js','./icon.svg','./manifest.webmanifest','./voice-catalog.json'];
const SHELL_URLS = new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET' || !SHELL_URLS.has(req.url))return;
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
    if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(req,clone));}
    return response;
  })));
});
