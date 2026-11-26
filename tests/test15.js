/* Mezclar equipos: cada pulsación da otro reparto equilibrado, se guarda y deshace los retoques. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open({ mode: null }), { page } = app;
  const sig = () => page.evaluate(() => ['W', 'D'].map(t => idsOf(t).sort().join()).sort().join('/'));
  ok('el botón está para quien organiza', await page.isVisible('#shuffleteams'));
  const seen = new Set([await sig()]);
  for (let i = 0; i < 3; i++) { await page.click('#shuffleteams'); await page.waitForTimeout(250); seen.add(await sig()); }
  ok('cada mezcla da un reparto distinto', seen.size === 4, String(seen.size));
  ok('aviso de equipos mezclados', /mezclados/.test(await toastText(page)), await toastText(page));
  const r = await page.evaluate(() => ({ seed: shuffleSeed, w: idsOf('W').length, d: idsOf('D').length, n: signupIds().length }));
  ok('semilla guardada y equipos completos', r.seed > 0 && r.w + r.d === r.n && Math.abs(r.w - r.d) <= 1, JSON.stringify(r));
  ok('aparece "Rehacer por medias"', await page.isVisible('#autoteams'));
  await page.click('#autoteams'); await page.waitForTimeout(250);
  ok('rehacer vuelve al mejor reparto', await page.evaluate(() => shuffleSeed === 0));
  // Con retoques pide confirmación
  await page.evaluate(() => { const id = idsOf('W')[0]; dropOnBench(id, 'W'); savedLayout = clone(layout); render(); });
  await page.click('#shuffleteams'); ok('pide confirmación con retoques', await page.evaluate(() => !!savedLayout));
  await page.click('#shuffleteams'); await page.waitForTimeout(250);
  ok('sin retoques tras mezclar', await page.evaluate(() => !savedLayout && shuffleSeed > 0));
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
