/* Service worker: la app funciona sin conexión.
   Al publicar una versión nueva hay que cambiar VERSION: así el navegador detecta el cambio y la app avisa. */
const VERSION = "1.6.0";
const CACHE = "mipachanga-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

// Sin skipWaiting automático: la página avisa y el usuario decide cuándo activar la versión nueva.
// Excepción: si viene de una versión antigua (sin aviso de actualización), se activa sola una vez.
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })))))
    .then(() => caches.keys())
    .then(keys => { if (keys.some(k => k.startsWith("pachangas-"))) return self.skipWaiting(); }));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("message", e => {
  const msg = e.data || {};
  if (msg.type === "SKIP_WAITING") self.skipWaiting();
  if (msg.type === "GET_VERSION" && e.ports[0]) e.ports[0].postMessage(VERSION);
});

// Red primero (para recibir cambios) y caché si no hay conexión.
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // Tipografía de Google Fonts: caché primero, para que se vea igual sin conexión.
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match("./index.html")))
  );
});
