// Anime Ultimate Team service worker: makes repeat visits load fast.
// Card art / items / arenas never change name once built -> cache-first.
// Code + css carry ?v=<build> so new builds are new URLs -> cache-first too.
// The page itself and data files -> network-first, falling back to cache when offline.
const C = 'aut-v1'
const LONG = /\/(atg|forms|items|arenas)\/|\.(woff2?|png|jpg|jpeg|webp|avif)(\?|$)|[?&]v=/
self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.pathname.startsWith('/api/')) return
  if (u.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return
  const replaceableArt = /\/atg\/M_(nel_gamuza|barragan_release_drop)_form1\.png$/.test(u.pathname)
  if (!replaceableArt && (LONG.test(u.pathname + u.search) || /fonts\.gstatic\.com$/.test(u.hostname))) {
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res }))
    return
  }
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cl = res.clone(); caches.open(C).then(c => c.put(r, cl)) } return res }).catch(() => caches.match(r)))
})
