/*
 * Sek-Sek service worker: çevrimdışı oynanış (elle yazılmış, bağımlılıksız).
 *  - Uygulama kabuğu ve /_next/static/* (adı içerik özetli, değişmez): önce önbellek.
 *  - Sayfa gezinmesi: önce ağ; ağ yoksa önbellekteki sayfa, o da yoksa önbellekteki "/".
 *  - /api/* asla önbelleğe alınmaz (skor, hesap, hayalet: hep canlı).
 *  - Sürüm adı değişince eski önbellekler silinir.
 */
const VERSION = 'seksek-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon.png', '/apple-icon.png', '/logo-emblem.png']

const sameOrigin = (url) => url.origin === self.location.origin
const isStatic = (url) => url.pathname.startsWith('/_next/static/') || /^\/(sehirler|portreler)\//.test(url.pathname) || SHELL.includes(url.pathname)

/** "/" sayfasının yüklediği /_next/static dosyaları: ilk ziyarette sayfa denetim altında değilken indirildiler */
async function precacheShell(cache) {
  await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})))
  const res = await cache.match('/')
  if (!res) return
  const html = await res.text()
  const urls = new Set(Array.from(html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g), (m) => m[0]))
  await Promise.all(Array.from(urls, (u) => cache.add(u).catch(() => {})))
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then(precacheShell).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('seksek-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** sayfa, kayıttan önce indirdiği dosyaları bildirir (tembel yüklenen parçalar HTML'de yazmaz) */
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'cache-urls' || !Array.isArray(data.urls)) return
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      Promise.all(
        data.urls
          .map((u) => new URL(u, self.location.origin))
          .filter((u) => sameOrigin(u) && isStatic(u))
          .map((u) => cache.match(u.pathname).then((hit) => hit || cache.add(u.pathname).catch(() => {}))),
      ),
    ),
  )
})

async function cacheFirst(request) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') cache.put(request, res.clone())
  return res
}

async function networkFirstPage(request) {
  const cache = await caches.open(VERSION)
  try {
    const res = await fetch(request)
    // yalnız oyunun kendisi ("/", sorgusuz anahtarla) saklanır: çevrimdışı açılışın yedeği
    if (res.ok && new URL(request.url).pathname === '/') cache.put('/', res.clone())
    return res
  } catch (err) {
    const hit = (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/'))
    if (hit) return hit
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!sameOrigin(url) || url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
  if (isStatic(url)) event.respondWith(cacheFirst(request))
})
