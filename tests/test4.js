/* Historial y estadísticas: guardar la alineación, resultado, goles, cargarla en la pizarra y borrarla. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  await tab(page, 'hist');
  ok('historial vacío', /Aún no hay partidos/.test(await page.innerText('#hlist')));
  await tab(page, 'stats');
  ok('estadísticas vacías', /Aún no hay partidos/.test(await page.innerText('#stats')));
  await page.click('#scbtn');
  ok('sin goles no comparte', (await toastText(page)) === 'Todavía no hay goles apuntados.' && await page.isHidden('#scmenu'));

  // Día del partido (arriba en la pestaña Partido) y «Partido jugado»
  await tab(page, 'alin');
  ok('día y hora arriba en Partido', await page.isVisible('#matchdate') && await page.isVisible('#matchtime'));
  await page.fill('#matchdate', '2099-03-07'); await page.dispatchEvent('#matchdate', 'change');
  ok('fecha elegida: botón Hoy', await page.isVisible('#datereset'));
  ok('título con la fecha elegida', (await page.textContent('#h1')) === 'Partido · Sábado 7 mar', await page.textContent('#h1'));
  const apuntados = await page.evaluate(() => signupIds());
  await page.click('#fix');
  ok('Partido jugado pide confirmación', (await page.innerText('#fix')) === 'Guardar y vaciar la lista');
  await page.click('#fix'); await page.waitForTimeout(250);
  ok('guardado', (await toastText(page)) === 'Partido guardado: apunta el resultado y los goles. La lista ya está vacía para el próximo.', await toastText(page));
  ok('lleva al historial', (await page.getAttribute('#t-hist', 'aria-selected')) === 'true');
  ok('vacía la lista', (await page.evaluate(() => signupIds().length)) === 0);
  // Si se vuelve a jugar el mismo día, pide reemplazar
  await page.evaluate(ids => Promise.all(ids.map(id => signUp(id))), apuntados);
  await tab(page, 'alin'); await page.waitForTimeout(100);
  await page.click('#fix');
  ok('la segunda vez pide reemplazar', (await page.innerText('#fix')) === 'Reemplazar el ya guardado y vaciar la lista');
  await page.click('#fix'); await page.waitForTimeout(250);
  ok('reemplazado', (await page.innerText('#fix')) === 'Partido jugado' && (await page.evaluate(() => matches.length)) === 1);
  await page.evaluate(ids => Promise.all(ids.map(id => signUp(id))), apuntados);   // para lo que sigue

  await tab(page, 'hist');
  const match = page.locator('#hlist .match');
  ok('un partido', (await match.count()) === 1);
  ok('fecha del partido', (await match.locator('.mdate').textContent()) === 'Sábado 7 mar 2099');
  ok('formato y formaciones', (await match.locator('.msub').innerText()) === '7 vs 7 · Blanco 3-2-1 · Oscuro 3-2-1');
  ok('sin resultado', (await match.locator('.res').innerText()).toLowerCase() === 'sin resultado');
  ok('7 nombres por equipo', (await match.locator('.mteam.W .mline span:not(.r)').allInnerTexts()).join(', ').split(', ').length === 7);

  // Resultado
  await match.locator('input[data-s=W]').fill('3'); await match.locator('input[data-s=W]').press('Tab');
  await match.locator('input[data-s=D]').fill('1'); await match.locator('input[data-s=D]').press('Tab');
  await page.locator('h1').click(); await page.waitForTimeout(150);
  ok('gana Blanco', (await page.locator('#hlist .res').innerText()).toLowerCase() === 'gana blanco');

  // Goles
  const goals = page.locator('#hlist .goals[data-team=D]');
  await goals.locator('[data-gadd]').click();
  ok('sin elegir avisa', (await toastText(page)) === 'Elige quién marcó el gol.');
  const scorer = await goals.locator('[data-gsel] option').nth(1).getAttribute('value');
  const scorerName = await goals.locator('[data-gsel] option').nth(1).innerText();
  await goals.locator('[data-gsel]').selectOption(scorer); await goals.locator('[data-gadd]').click(); await page.waitForTimeout(100);
  await page.locator('#hlist .goals[data-team=D] [data-gsel]').selectOption(scorer); await page.locator('#hlist .goals[data-team=D] [data-gadd]').click(); await page.waitForTimeout(100);
  ok('dos goles', /×2/.test(await page.locator('#hlist .goals[data-team=D] .gchip').innerText()));
  ok('el marcador sube con los goles', (await page.inputValue('#hlist input[data-s=D]')) === '3');
  ok('empate', (await page.locator('#hlist .res').innerText()).toLowerCase() === 'empate');
  await page.locator('#hlist .goals[data-team=D] [data-gdel]').click(); await page.waitForTimeout(100);
  ok('quitar un gol', !/×2/.test(await page.locator('#hlist .goals[data-team=D] .gchip').innerText()) && (await page.inputValue('#hlist input[data-s=D]')) === '2');

  // Estadísticas
  await tab(page, 'stats');
  const cards = page.locator('#stats .scard');
  ok('tres tarjetas', (await cards.count()) === 3);
  ok('goleador', (await cards.nth(0).locator('tbody tr').first().innerText()).replace(/\s+/g, ' ').trim() === `1 ${scorerName} 1 1`);
  ok('14 con un partido', (await cards.nth(1).locator('tbody tr').count()) === 14);
  ok('7 ganados', (await cards.nth(2).locator('td.win').allInnerTexts()).filter(x => x === '1').length === 7);
  ok('nota de partidos con resultado', /\(1 de 1\)/.test(await page.innerText('#stats .hint')));

  // Un partido sin resultado no cuenta como jugado (tampoco en Goleadores)
  const pjs = await page.evaluate(() => {
    const pl = [{ id: 'a', name: 'A' }], rival = [{ id: 'b', name: 'B' }];
    const st = computeStats([
      { id: '2026-01-01', W: pl, D: rival, score: { W: 2, D: 1 }, goals: { W: { a: 2 } } },
      { id: '2026-01-08', W: pl, D: rival, goals: { W: { a: 1 } } }
    ]);
    const a = list => (list.find(r => r.id === 'a') || {}).pj;
    return [a(st.scorers), a(st.played), st.scorers.find(r => r.id === 'a').g];
  });
  ok('sin resultado no suma PJ', pjs[0] === 1 && pjs[1] === 1 && pjs[2] === 3, pjs.join(' '));

  // Compartir goleadores
  await page.click('#scbtn');
  ok('abre el menú de goleadores', await page.isVisible('#scmenu'));
  const sw = decodeURIComponent((await page.getAttribute('#scmenu .s-wa', 'href')).replace('https://wa.me/?text=', '')).split('\n');
  ok('texto de goleadores', /^⚽ Goleadores · .+ · 1 partido$/.test(sw[0]) && sw[2] === `🥇 ${scorerName}: 1 gol (1 PJ)`, sw.join(' / '));
  ok('Telegram de goleadores', (await page.getAttribute('#scmenu .s-tg', 'href')).startsWith('https://t.me/share/url?url=' + encodeURIComponent(sw[0])));
  const [sdl] = await Promise.all([page.waitForEvent('download'), page.click('#scmenu .s-dl')]);
  ok('descarga la imagen de goleadores', sdl.suggestedFilename() === 'pachanga-goleadores.png' && await page.isHidden('#scmenu'));
  await page.click('#scbtn'); await page.click('#scmenu .s-view');
  await page.waitForFunction(() => { const i = document.getElementById('ovimg'); return (i.src || '').startsWith('data:image/png') && i.complete && i.naturalWidth; });
  ok('imagen de goleadores', (await page.evaluate(() => document.getElementById('ovimg').naturalWidth)) === 1080);
  await page.click('#ovclose');

  // Ya no se carga un partido en la pizarra: la pizarra es siempre la del próximo partido
  await tab(page, 'hist');
  ok('sin «Cargar en la pizarra»', (await page.locator('#hlist [data-mload]').count()) === 0);
  await tab(page, 'alin');
  const before = await page.locator('#board .mag.W').evaluateAll(e => e.map(x => x.dataset.n).sort().join());
  await page.click('#swap');
  await page.reload(); await page.waitForSelector('#board .mag'); await page.waitForTimeout(100);
  ok('el retoque (invertir) se conserva al recargar', (await page.locator('#board .mag.D').evaluateAll(e => e.map(x => x.dataset.n).sort().join())) === before);

  // Vaciar la lista para el siguiente partido
  await page.click('#clearlist');
  ok('vaciar pide confirmación', (await page.innerText('#clearlist')) === 'Sí, vaciar la lista');
  await page.click('#clearlist'); await page.waitForTimeout(200);
  ok('lista vacía', (await toastText(page)) === 'Lista vacía: lista para el próximo partido.' && (await page.locator('#slist .sname').count()) === 0 && (await page.locator('#board .mag').count()) === 0);
  await tab(page, 'hist');
  ok('el historial sigue', (await page.locator('#hlist .match').count()) === 1);

  // Sin medias en el historial ni en lo guardado
  await tab(page, 'hist');
  ok('historial sin medias', (await page.locator('#hlist .mteam small').count()) === 0
    && await page.evaluate(() => matches.every(m => ['W', 'D'].every(t => m[t].every(p => !('ovr' in p) && !('por' in p))))));

  // Borrar partido
  await tab(page, 'hist');
  await page.click('#hlist [data-mdel]');
  ok('pide confirmación', (await page.innerText('#hlist [data-mdel]')) === '¿Seguro?');
  await page.click('#hlist [data-mdel]'); await page.waitForTimeout(100);
  ok('borrado', /Aún no hay partidos/.test(await page.innerText('#hlist')));

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
