# Builds the live app (index.html, sw.js, manifest.webmanifest) at the repo root from src/.
# Run from anywhere:  python3 tools/build.py
import re, json, hashlib, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
def rd(name): return open(os.path.join(SRC, name), encoding='utf-8').read()
def wr(name, text): open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(text)
style=rd('styles.css')
tpl=rd('template.html')
runtime=rd('runtime.js')
logic=rd('app.js')
extra_css='''
html,body{height:100%;margin:0;background:#000;color:#fff;overscroll-behavior:none}
#root{position:fixed;inset:0}
button,a{touch-action:manipulation}
input,select,textarea{font-size:16px!important}
*{-webkit-tap-highlight-color:transparent}
'''
boot='''
(function () {
  var root = document.getElementById('root');
  var t = null;
  var inst = mountApp(Component, document.getElementById('tpl'), root, function (app) {
    clearTimeout(t); t = setTimeout(function () { app.persist(); }, 250);
  });
  window.addEventListener('pagehide', function () { inst.persist(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') inst.persist(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(function () {}); }
})();
'''
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Better Days</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Better Days">
<meta name="theme-color" content="#000000">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<style>{style}{extra_css}</style>
</head>
<body>
<div id="root"></div>
<template id="tpl">{tpl}</template>
<script>{runtime}</script>
<script>{logic}</script>
<script>{boot}</script>
</body>
</html>
'''
wr('index.html', html)
manifest={"name":"Better Days","short_name":"Better Days","start_url":"./","scope":"./","display":"standalone","background_color":"#000000","theme_color":"#000000",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
wr('manifest.webmanifest', json.dumps(manifest,indent=2))
ver=hashlib.sha1(html.encode()).hexdigest()[:10]
sw=f'''// Better Days offline support: keeps the app files on the phone so it opens without internet.
const CACHE = 'dayscore-{ver}';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {{ e.waitUntil(caches.open(CACHE).then(function (c) {{ return c.addAll(FILES); }}).then(function () {{ return self.skipWaiting(); }})); }});
self.addEventListener('activate', function (e) {{ e.waitUntil(caches.keys().then(function (keys) {{ return Promise.all(keys.filter(function (k) {{ return k !== CACHE; }}).map(function (k) {{ return caches.delete(k); }})); }}).then(function () {{ return self.clients.claim(); }})); }});
self.addEventListener('fetch', function (e) {{
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then(function (hit) {{
    const net = fetch(e.request).then(function (res) {{ if (res && res.ok) {{ const copy = res.clone(); caches.open(CACHE).then(function (c) {{ c.put(e.request, copy); }}); }} return res; }}).catch(function () {{ return hit; }});
    return hit || net;
  }}));
}});
'''
wr('sw.js', sw)
print('built', len(html)//1024, 'KB, cache', ver)
