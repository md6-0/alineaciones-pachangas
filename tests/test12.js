/* Cargar un partido del historial en la pizarra (lista, colocación y formato) y rehacer los equipos por medias. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open({ mode: null }), { page } = app;
  // Un partido de 8 vs 8 con 4 jugadores, uno de ellos ya fuera de la plantilla; en la lista, otros dos apuntados
  const ids = await page.evaluate(async () => {
    const ids = P.slice(0, 5).map(p => p.id);
    for (const id of Object.keys(signups)) await signOff(id);
    await signUp(ids[3]); await signUp(ids[4]);
    await db.doc('matches/2026-10-04').set({ date: '2026-10-04', mode: '7', formation: { W: '3-2-1', D: '3-2-1' },
      W: [{ id: ids[0], name: 'A', role: 'POR', x: 50, y: 94 }, { id: ids[1], name: 'B', role: 'SUP', x: null, y: null }],
      D: [{ id: ids[2], name: 'C', role: 'MED', x: 27, y: 30 }, { id: 'ya-no-esta', name: 'Viejo', role: 'ATQ', x: 50, y: 45 }], score: { W: 1, D: 1 } });
    return ids;
  });
  await tab(page, 'hist'); await page.waitForTimeout(150);
  const btn = page.locator('.match[data-id="2026-10-04"] [data-mload]');
  await btn.click(); ok('pide confirmación', /seguro/.test(await btn.innerText()));
  await btn.click(); await page.waitForTimeout(400);
  ok('vuelve a Partido', await page.evaluate(() => st.tab === 'alin'));
  ok('aviso con el jugador que ya no está', /1 jugador ya no está/.test(await toastText(page)), await toastText(page));
  const r = await page.evaluate(ids => ({
    list: signupIds().sort().join(), mode: st.mode,
    a: layout[ids[0]], b: layout[ids[1]], c: layout[ids[2]], saved: !!savedLayout
  }), ids);
  ok('la lista son los del partido', r.list === [ids[0], ids[1], ids[2]].sort().join(), r.list);
  ok('formato del partido', r.mode === '7');
  ok('misma colocación', r.a.team === 'W' && r.a.zone === 'pitch' && r.a.x === 50 && r.a.y === 94 && r.c.team === 'D' && r.c.x === 27 && r.b.zone === 'bench', JSON.stringify(r));
  ok('queda como alineación retocada', r.saved && await page.isVisible('#autoteams'));

  // Rehacer por medias
  await page.click('#autoteams'); await page.click('#autoteams'); await page.waitForTimeout(200);
  ok('rehecha: sin retoques', await page.evaluate(() => !savedLayout) && !(await page.isVisible('#autoteams')));
  ok('media de cada equipo para quien organiza', (await page.locator('#teams .tavg').count()) === 2);
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
