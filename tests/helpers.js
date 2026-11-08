/* Piezas comunes de las pruebas: un servidor local con la app, el navegador y el registro de resultados.
   APP_ROOT permite apuntar a otra copia de la app (por ejemplo, para comparar con una versión anterior). */
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(process.env.APP_ROOT || path.join(__dirname, '..'));
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

/** Sirve la carpeta de la app en un puerto libre. Devuelve { url, close }. */
function serve(root = ROOT) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(f));
    }).listen(0, () => resolve({ url: `http://localhost:${srv.address().port}/`, close: () => srv.close() }));
  });
}

/** Hace que la app use el servidor, con el Firebase simulado de fake-firebase.js. server: datos iniciales del servidor. */
async function useFakeCloud(ctx, server = {}) {
  await ctx.route(/\/js\/firebase-config\.js$/, r => r.fulfill({ contentType: 'text/javascript', body: 'const FIREBASE_CONFIG = { projectId: "pruebas" };' }));
  await ctx.route(/\/js\/vendor\/firebase-app-compat\.js$/, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'fake-firebase.js'), 'utf8') }));
  await ctx.route(/\/js\/vendor\/firebase-(auth|firestore)-compat\.js$/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await ctx.addInitScript(d => { if (!localStorage.getItem('fake-firestore')) localStorage.setItem('fake-firestore', JSON.stringify(d)); }, server);
}

/** Abre la app en un móvil (o en el tamaño indicado) y recoge los errores de la página.
    Las pruebas se escribieron con 7 vs 7: mode lo fija la primera vez (null = el formato por defecto de la app).
    cloud: datos del servidor simulado (si se da, la app usa el servidor); waitFor: lo que se espera al abrir. */
async function open({ viewport, offline = false, mode = "7", cloud = null, waitFor = '#board .mag' } = {}) {
  const server = await serve();
  const browser = await chromium.launch();
  const opts = viewport ? { viewport, acceptDownloads: true } : { ...devices['Pixel 7'], acceptDownloads: true };
  if (cloud) opts.serviceWorkers = 'block';   // que no guarde en caché la configuración ni el Firebase de verdad
  const ctx = await browser.newContext(opts);
  if (cloud) await useFakeCloud(ctx, cloud);
  // Sin internet: la tipografía de Google Fonts no se descarga (cae a la del sistema) y las pruebas no dependen de la red
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (mode) await ctx.addInitScript(m => { try { if (!localStorage.getItem('pach-v4')) localStorage.setItem('pach-v4', JSON.stringify({ mode: m })); } catch {} }, mode);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => { errors.push('diálogo nativo: ' + d.message()); d.dismiss(); });
  await page.goto(server.url);
  if (waitFor) await page.waitForSelector(waitFor);
  return { page, ctx, browser, server, errors, url: server.url,
    async close() { await browser.close(); server.close(); } };
}

/** Registro de comprobaciones: ok('qué', condición, detalle). Al terminar imprime OK/FAIL y sale con error si algo falla. */
function checker() {
  const results = [];
  const ok = (name, cond, extra = '') => results.push([cond ? 'OK  ' : 'FAIL', name, cond ? '' : String(extra)]);
  const done = () => {
    for (const [s, n, e] of results) console.log(`${s} ${n}${e ? '  → ' + e : ''}`);
    const bad = results.filter(r => r[0] === 'FAIL').length;
    console.log(bad ? `\n${bad} fallo(s)` : `\nOK (${results.length})`);
    process.exit(bad ? 1 : 0);
  };
  return { ok, done };
}

const tab = (page, id) => page.click('#t-' + id);
const toastText = async page => (await page.locator('#toast').isVisible()) ? page.innerText('#toast') : '';

module.exports = { ROOT, serve, open, useFakeCloud, checker, tab, toastText };
