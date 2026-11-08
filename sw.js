/* Service worker: la app funciona sin conexión.
   Al publicar una versión nueva hay que cambiar VERSION (y la de Opciones, en index.html): así el navegador detecta el cambio y la app avisa.
   Cada archivo nuevo de css/ o js/ tiene que estar también en SHELL. */
const VERSION = "2.4.1";
const CACHE = "mipachanga-" + VERSION;
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png",
  "./css/base.css", "./css/board.css", "./css/lineup.css", "./css/players.css",
  "./css/history.css", "./css/stats.css", "./css/options.css",
  "./js/util.js", "./js/sample-squad.js", "./js/firebase-config.js", "./js/db-local.js", "./js/db-cloud.js", "./js/db.js", "./js/config.js", "./js/state.js",
  "./js/settings.js", "./js/dates.js", "./js/players.js", "./js/teams.js", "./js/formation.js",
  "./js/matches.js", "./js/next-match.js", "./js/stats.js", "./js/backup.js", "./js/ui.js", "./js/views.js",
  "./js/pitch.js", "./js/tab-lineup.js", "./js/drag.js", "./js/share-image.js", "./js/share-teams-image.js", "./js/share-menu.js", "./js/share.js", "./js/share-signup.js",
  "./js/tab-players.js", "./js/tab-history.js", "./js/tab-stats.js", "./js/share-scorers.js", "./js/tab-options.js", "./js/updates.js",
  "./js/main.js",
  "./js/vendor/firebase-app-compat.js", "./js/vendor/firebase-auth-compat.js", "./js/vendor/firebase-firestore-compat.js"
];

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

/* La app: caché primero. Cada versión guarda todos sus archivos al instalarse (SHELL), así que al abrir
   no hace falta preguntar al servidor por cada uno: la app abre al momento, con o sin conexión.
   Los cambios llegan con la versión nueva (VERSION), que se instala aparte y se activa con el aviso.
   Así tampoco se mezclan archivos de dos versiones. */
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
    caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
