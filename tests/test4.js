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
  ok('enlace para reservar el campo', await page.isVisible('#reserve') && (await page.getAttribute('#reserve', 'href')).startsWith('https://deportesua.deporsite.net/reserva-pistas') && (await page.getAttribute('#reserve', 'target')) === '_blank');
  ok('día y hora arriba en Partido, en un solo campo', await page.isVisible('#matchwhen') && (await page.locator('#matchdate, #matchtime').count()) === 0);
  await page.fill('#matchwhen', '2099-03-07T19:30'); await page.dispatchEvent('#matchwhen', 'change');
  ok('fecha elegida: botón Hoy', await page.isVisible('#datereset'));
  ok('título con la fecha elegida', (await page.textContent('#h1')) === 'Sábado 7 mar · 19:30', await page.textContent('#h1'));
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
  await page.locator('#hlist .goals[data-team=D] [data-ginc]').click(); await page.waitForTimeout(100);
  await page.locator('#hlist .goals[data-team=D] [data-ginc]').click(); await page.waitForTimeout(100);
  ok('el + suma otro gol al mismo jugador', /×3/.test(await page.locator('#hlist .goals[data-team=D] .gchip').innerText()) && (await page.inputValue('#hlist input[data-s=D]')) === '4');
  await page.locator('#hlist .goals[data-team=D] [data-gdel]').click(); await page.waitForTimeout(100);
  await page.locator('#hlist .goals[data-team=D] [data-gdel]').click(); await page.waitForTimeout(100);

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
  ok('solo WhatsApp y Compartir imagen', (await page.locator('#scmenu a, #scmenu button').count()) === 2);
  const [sdl] = await Promise.all([page.waitForEvent('download'), page.click('#scmenu .s-share')]);
  ok('imagen de goleadores (descargada en el ordenador)', sdl.suggestedFilename() === 'pachanga-goleadores.png' && await page.isHidden('#scmenu'));
  ok('imagen de goleadores de 1080 de ancho', (await page.evaluate(async () => (await drawScorersImage()).width)) === 1080);

  await tab(page, 'alin');

  // Vaciar la lista para el siguiente partido
  await page.click('#clearlist');
  ok('vaciar pide confirmación', (await page.innerText('#clearlist')) === 'Sí, vaciar la lista');
  await page.click('#clearlist'); await page.waitForTimeout(200);
  ok('lista vacía', (await toastText(page)) === 'Lista vacía: lista para el próximo partido.' && (await page.locator('#slist .sname').count()) === 0 && (await page.locator('#board .mag').count()) === 0);
  await tab(page, 'hist');
  ok('el historial sigue', (await page.locator('#hlist .match').count()) === 1);

  // Cada jugador del partido se guarda con nombre, puesto y sitio (sin nada más)
  await tab(page, 'hist');
  ok('partido guardado sin datos de más', await page.evaluate(() => matches.every(m => ['W', 'D'].every(t => m[t].every(p => Object.keys(p).sort().join() === 'id,name,role,x,y')))));

  // Borrar partido
  await tab(page, 'hist');
  await page.click('#hlist [data-mdel]');
  ok('pide confirmación', (await page.innerText('#hlist [data-mdel]')) === '¿Seguro?');
  await page.click('#hlist [data-mdel]'); await page.waitForTimeout(100);
  ok('borrado', /Aún no hay partidos/.test(await page.innerText('#hlist')));

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
