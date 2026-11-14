// Better Days offline support: keeps the app files on the phone so it opens without internet.
const CACHE = 'dayscore-3be2eed751';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
// cache: 'reload' skips the phone's 10-minute web cache so a new version never saves an old copy.
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // The app page itself: newest from GitHub when online (checked, not re-downloaded if unchanged); saved copy if
  // offline or GitHub doesn't answer within 4 seconds.
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(function (hit) {
      const net = fetch(e.request, { cache: 'no-cache' }).then(function (res) { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); } return res; });
      if (!hit) return net;
      return Promise.race([net.catch(function () { return hit; }), new Promise(function (r) { setTimeout(function () { r(hit); }, 4000); })]);
    }));
    return;
  }
  // Everything else (icons, the Scan reader): saved copy first, refreshed in the background.
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    const net = fetch(e.request).then(function (res) { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); } return res; }).catch(function () { return hit; });
    return hit || net;
  }));
});
