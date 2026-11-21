/* MVP del partido: quien organiza lo elige entre los que jugaron y lo puede quitar; los demás lo ven como insignia. */
const { open, checker, tab } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open({ mode: null }), { page } = app;
  const ids = await page.evaluate(async () => {
    const ids = P.slice(0, 4).map(p => p.id);
    await db.doc('matches/2026-10-04').set({ date: '2026-10-04', mode: '7', formation: { W: '3-2-1', D: '3-2-1' },
      W: [{ id: ids[0], name: 'Zeta', role: 'POR' }, { id: ids[1], name: 'Beta', role: 'MED' }],
      D: [{ id: ids[2], name: 'Alfa', role: 'MED' }, { id: ids[3], name: 'Gamma', role: 'ATQ' }], score: { W: 1, D: 0 } });
    return ids;
  });
  await tab(page, 'hist'); await page.waitForTimeout(150);
  const sel = page.locator('.match[data-id="2026-10-04"] select[data-mvp]');
  ok('hay hueco de MVP para quien organiza', await sel.isVisible());
  ok('ofrece los 4 jugadores, por orden alfabético', (await sel.locator('option').allInnerTexts()).join() === 'Sin elegir…,Alfa,Beta,Gamma,Zeta');
  await sel.selectOption(ids[1]); await page.waitForTimeout(300);
  ok('se guarda el MVP', (await page.evaluate(() => matchById('2026-10-04').mvp)) === ids[1]);
  ok('queda elegido tras repintar', (await page.locator('.match[data-id="2026-10-04"] select[data-mvp]').inputValue()) === ids[1]);
  // Lo que ve quien no organiza: la insignia, sin desplegable
  const html = await page.evaluate(() => { const c = db.cloud, u = db.user; db.cloud = true; db.user = null; const h = mvpHTML(matchById('2026-10-04')); db.cloud = c; db.user = u; return h; });
  ok('los demás ven la insignia con el nombre', /class="mvpname">Beta</.test(html) && !/<select/.test(html), html);
  const sin = await page.evaluate(() => { const c = db.cloud, u = db.user; db.cloud = true; db.user = null; const h = mvpHTML({ ...matchById('2026-10-04'), mvp: null }); db.cloud = c; db.user = u; return h; });
  ok('sin MVP, los demás no ven nada', sin === '');
  await sel.selectOption(''); await page.waitForTimeout(300);
  ok('se puede quitar', (await page.evaluate(() => matchById('2026-10-04').mvp)) == null);
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
