/* Calendario del Historial: marca los días con partido, cambia de mes y lleva a la tarjeta. */
const { open, checker, tab } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open({ mode: null }), { page } = app;
  await page.evaluate(async () => {
    const ids = P.slice(0, 2).map(p => p.id), mk = (date, w, d) => ({ date, mode: '7', formation: { W: '3-2-1', D: '3-2-1' },
      W: [{ id: ids[0], name: 'A', role: 'POR', x: 50, y: 94 }], D: [{ id: ids[1], name: 'B', role: 'MED', x: 27, y: 30 }], score: w === null ? {} : { W: w, D: d } });
    await db.doc('matches/2026-10-04').set(mk('2026-10-04', 3, 1));
    await db.doc('matches/2026-10-18').set(mk('2026-10-18', 2, 2));
    await db.doc('matches/2026-09-27').set(mk('2026-09-27', null));
  });
  await tab(page, 'hist'); await page.waitForTimeout(250);
  ok('empieza en la vista del año', /2026/.test(await page.locator('.calhead h2').innerText()) && (await page.locator('.cm').count()) === 12);
  ok('octubre 2 partidos y septiembre 1', /2 partidos/.test(await page.locator('[data-cmonth="2026-10"]').getAttribute('aria-label')) && /1 partido/.test(await page.locator('[data-cmonth="2026-09"]').getAttribute('aria-label')));
  await page.click('[data-cmonth="2026-10"]');
  ok('el historial sigue con sus tarjetas', (await page.locator('.match').count()) === 3);
  ok('mes del último partido', /octubre 2026/i.test(await page.locator('.calhead h2').innerText()));
  ok('dos días marcados en octubre', (await page.locator('button.cd.has').count()) === 2);
  ok('colores por resultado', (await page.locator('button.cd.W').count()) === 1 && (await page.locator('button.cd.draw').count()) === 1);
  await page.click('[data-cnav="-1"]');
  ok('mes anterior con el partido sin resultado', /septiembre 2026/i.test(await page.locator('.calhead h2').innerText()) && (await page.locator('button.cd.none').count()) === 1);
  await page.click('[data-cnav="1"]');
  await page.hover('button.cd.W'); await page.waitForTimeout(150);
  const tip = await page.locator('#caltip').innerText();
  ok('al pasar el ratón sale el detalle', await page.isVisible('#caltip') && /Blanco 3 – 1 Oscuro/.test(tip) && /Gana Blanco/.test(tip), tip);
  await page.mouse.move(5, 5); await page.waitForTimeout(100);
  ok('al salir se oculta', !(await page.isVisible('#caltip')));
  await page.click('button.cd.W'); await page.waitForTimeout(300);
  ok('tocar un día resalta su tarjeta', await page.evaluate(() => document.querySelector('.match[data-id="2026-10-04"]').classList.contains('flash')));
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
