/* Sin conexión y versiones: el service worker guarda todos los archivos de la app, que abre sin red,
   y la versión que muestra Opciones coincide con la de sw.js. */
const { open, checker, tab, ROOT } = require('./helpers');
const fs = require('fs'), path = require('path');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page, ctx } = app;
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForSelector('#board .mag');
  ok('controlada por el service worker', await page.evaluate(() => !!navigator.serviceWorker.controller));

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const version = sw.match(/VERSION = "([^"]+)"/)[1];
  await tab(page, 'opc');
  ok('versión de Opciones = sw.js', (await page.innerText('#appver span')) === 'Mi pachanga · versión ' + version, version);

  // Todos los archivos locales que carga index.html están en SHELL
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const local = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('http'));
  const shell = [...sw.matchAll(/"\.\/([^"]*)"/g)].map(m => m[1]);
  const missing = local.filter(u => !shell.includes(u));
  ok('todo lo que carga la página está en SHELL', !missing.length, missing.join(', '));
  const gone = shell.filter(u => u && !fs.existsSync(path.join(ROOT, u)));
  ok('todo SHELL existe', !gone.length, gone.join(', '));

  // Sin red
  await ctx.setOffline(true); await tab(page, 'alin');
  await page.reload(); await page.waitForSelector('#board .mag');
  ok('abre sin conexión', (await page.locator('#board .mag').count()) === 14);
  await tab(page, 'opc'); await page.click('#chk'); await page.waitForTimeout(300);
  ok('buscar actualizaciones sin red avisa', /No se pudo comprobar|Ya tienes/.test(await page.innerText('#toast')), await page.innerText('#toast'));

  ok('sin errores', !app.errors.filter(e => !/Failed to fetch|update/i.test(e)).length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
