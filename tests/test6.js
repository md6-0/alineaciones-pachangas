/* Compartir: texto para WhatsApp y Telegram, imagen descargada y vista de la imagen. */
const { open, checker, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  await page.click('#sharebtn');
  ok('abre el menú', await page.isVisible('#smenu') && (await page.getAttribute('#sharebtn', 'aria-expanded')) === 'true');
  const fit = await page.evaluate(() => { const r = document.getElementById('smenu').getBoundingClientRect(), W = document.documentElement.clientWidth;
    return [r.left >= 0 && r.right <= W && document.documentElement.scrollWidth <= W, Math.round(r.left), Math.round(r.right), W]; });
  ok('el menú cabe en la pantalla', fit[0], fit.slice(1).join(' '));
  const wa = decodeURIComponent((await page.getAttribute('#s-wa', 'href')).replace('https://wa.me/?text=', ''));
  const lines = wa.split('\n');
  ok('primera línea', /^⚽ Alineación · \S+ \d+ \w+ \(7 vs 7\)$/.test(lines[0]), lines[0]);
  ok('equipos', lines.includes('⚪ Equipo Blanco') && lines.includes('⚫ Equipo Oscuro'));
  ok('porteros', lines.filter(l => l.startsWith('Portero: ')).length === 2);
  ok('sin medias en el texto', !/\b\d{2}\b/.test(lines.slice(1).join(' ').replace(/Jugador \d+/g, '')));
  const tg = await page.getAttribute('#s-tg', 'href');
  ok('Telegram: título en url y resto en text', tg.startsWith('https://t.me/share/url?url=' + encodeURIComponent(lines[0]) + '&text='));
  await page.keyboard.press('Escape');
  ok('Escape cierra', await page.isHidden('#smenu'));

  await page.click('#sharebtn');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  ok('descarga la imagen', dl.suggestedFilename() === 'pachanga-alineaciones.png');
  ok('aviso', (await toastText(page)) === 'Imagen guardada.');
  ok('el menú se cierra al elegir', await page.isHidden('#smenu'));
  const size = (await require('fs').promises.stat(await dl.path())).size;
  ok('imagen no vacía', size > 20000, size);

  await page.click('#sharebtn'); await page.click('#viewimg');
  await page.waitForFunction(() => (document.getElementById('ovimg').src || '').startsWith('data:image/png'));
  ok('ver imagen', await page.isVisible('#overlay'));
  const dims = await page.evaluate(() => { const i = document.getElementById('ovimg'); return [i.naturalWidth, i.naturalHeight]; });
  ok('imagen de 1080 de ancho', dims[0] === 1080 && dims[1] > 1500, dims.join('x'));
  await page.click('#ovclose');
  ok('cerrar', await page.isHidden('#overlay'));

  // Imagen de los equipos (sin alineación)
  await page.click('#sharebtn'); await page.click('#whatseg [data-what=teams]');
  ok('el selector no cierra el menú', await page.isVisible('#smenu'));
  const wa2 = decodeURIComponent((await page.getAttribute('#s-wa', 'href')).replace('https://wa.me/?text=', '')).split('\n');
  ok('texto de equipos', /^⚽ Equipos · /.test(wa2[0]) && wa2.includes('⚪ Equipo Blanco') && wa2.includes('⚫ Equipo Oscuro'), wa2[0]);
  ok('equipos: un jugador por línea, sin posiciones', wa2.filter(l => /^Jugador \d+$/.test(l)).length === 14 && !wa2.some(l => /Portero|Banquillo|:/.test(l)));
  const tg2 = await page.getAttribute('#s-tg', 'href');
  ok('Telegram con el texto de equipos', tg2.startsWith('https://t.me/share/url?url=' + encodeURIComponent(wa2[0])));
  ok('subtítulo cambia', (await page.innerText('#s-wa small')) === 'Equipos en texto');
  ok('selector marcado', (await page.getAttribute('#whatseg [data-what=teams]', 'aria-pressed')) === 'true');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  ok('descarga la imagen de equipos', dl2.suggestedFilename() === 'pachanga-equipos.png');
  await page.click('#sharebtn'); await page.click('#viewimg');
  await page.waitForFunction(w => { const i = document.getElementById('ovimg'); return i.complete && i.naturalWidth && i.naturalHeight !== w; }, dims[1]);
  const dims2 = await page.evaluate(() => { const i = document.getElementById('ovimg'); return [i.naturalWidth, i.naturalHeight]; });
  ok('imagen de equipos más corta que la del campo', dims2[0] === 1080 && dims2[1] < dims[1], dims2.join('x'));
  await page.click('#ovclose');
  await page.reload(); await page.click('#sharebtn');
  ok('recuerda la imagen elegida', (await page.getAttribute('#whatseg [data-what=teams]', 'aria-pressed')) === 'true');
  await page.click('#whatseg [data-what=lineup]'); await page.keyboard.press('Escape');

  // Lista para apuntarse
  await page.evaluate(() => document.getElementById('signup').addEventListener('click', e => e.preventDefault()));
  await page.click('#signup');
  const su = decodeURIComponent((await page.getAttribute('#signup', 'href')).replace('https://wa.me/?text=', '')).split('\n');
  ok('lista para apuntarse con los apuntados', /^⚽ Pachanga · [^·]+$/.test(su[0]) && su[1] === '' && su[2] === '' && su[3] === '1. Jugador 1' && su[su.length - 1] === '14. Jugador 14' && su.length === 17, su.join('|'));
  // Con hora (Opciones) y huecos libres
  await page.evaluate(() => { const i = document.getElementById('matchtime'); i.value = '12:00'; i.dispatchEvent(new Event('change')); });
  ok('la hora sale en el título', / · 12:00$/.test(await page.textContent('#h1')), await page.textContent('#h1'));
  await page.locator('#slist .sdel').first().click(); await page.waitForTimeout(100);
  await page.click('#signup');
  const su2 = decodeURIComponent((await page.getAttribute('#signup', 'href')).replace('https://wa.me/?text=', '')).split('\n');
  ok('lista con hora y hueco libre', / · 12:00$/.test(su2[0]) && su2[3] === '1. Jugador 2' && su2[16] === '14.', su2.join('|'));
  await page.evaluate(() => { const i = document.getElementById('matchtime'); i.value = ''; i.dispatchEvent(new Event('change')); });
  ok('sin hora no sale', (await page.evaluate(() => [st.time, signupText().split('\n')[0].split(' · ').length])).join() === ',2');

  // Clic fuera cierra el menú
  await page.click('#sharebtn'); await page.click('h1');
  ok('clic fuera cierra', await page.isHidden('#smenu'));

  // Sin jugadores
  while (await page.locator('#slist .sdel').count()) { await page.locator('#slist .sdel').first().click(); await page.waitForTimeout(30); }
  await page.click('#sharebtn');
  ok('sin jugadores avisa', (await toastText(page)) === 'Todavía no hay alineación para compartir.' && await page.isHidden('#smenu'));
  await page.click('#fix');
  ok('guardar sin jugadores avisa', (await toastText(page)) === 'Necesitas al menos dos apuntados para guardar el partido.');
  ok('espera a dos apuntados', /al menos dos jugadores/.test(await page.innerText('#teams')));

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // Primera vez, con el formato por defecto: 8 vs 8, 16 convocados y 16 huecos en la lista
  const fresh = await open({ mode: null }), p2 = fresh.page;
  ok('8 vs 8 por defecto', (await p2.evaluate(() => [st.mode, signupIds().length])).join() === '8,16');
  await p2.evaluate(() => document.getElementById('signup').addEventListener('click', e => e.preventDefault()));
  await p2.click('#signup');
  const su8 = decodeURIComponent((await p2.getAttribute('#signup', 'href')).replace('https://wa.me/?text=', '')).split('\n');
  ok('lista de 16', su8[su8.length - 1] === '16. Jugador 16' && su8.length === 19, su8.join('|'));
  ok('sin errores (8 vs 8)', !fresh.errors.length, fresh.errors.join(' | '));
  await fresh.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
