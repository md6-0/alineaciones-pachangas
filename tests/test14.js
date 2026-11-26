/* Fijos y wildcards: dos listas en la pestaña Jugadores; se puede añadir a cualquiera de las dos y pasar de una a otra. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  await tab(page, 'jug');
  const titles = () => page.locator('#plist .plgroup h2').evaluateAll(h => h.map(x => x.textContent));
  ok('dos listas: fijos y wildcards', (await titles()).join('|') === 'Fijos · 24|Wildcards · 0', (await titles()).join('|'));
  ok('el contador solo habla de fijos si no hay wildcards', (await page.innerText('#pcount')) === '24 fijos');
  ok('wildcards vacía, con su explicación', /Sin wildcards/.test(await page.innerText('#plist .plgroup:nth-child(2)')));

  // Añadir un wildcard
  await page.selectOption('#newkind', 'wild'); await page.fill('#newname', 'Invitado Uno'); await page.click('#addform button[type=submit]'); await page.waitForTimeout(150);
  ok('el nuevo va a wildcards', (await titles()).join('|') === 'Fijos · 24|Wildcards · 1');
  ok('aviso con la lista', /añadido a wildcards/.test(await toastText(page)));
  ok('contador con fijos y wildcards', (await page.innerText('#pcount')) === '24 fijos · 1 wildcard');
  const row = page.locator('#plist .plgroup').nth(1).locator('.plrow');
  ok('está en la lista de wildcards', (await row.count()) === 1 && (await row.locator('input[data-f=name]').inputValue()) === 'Invitado Uno');
  ok('se guarda como wildcard', await page.evaluate(() => Object.values(rawPlayers).some(v => v.name === 'Invitado Uno' && v.kind === 'wild')));

  // En «Apuntar a…» salen separados
  await tab(page, 'alin'); await page.waitForTimeout(100);
  const grp = await page.locator('#saddsel optgroup').evaluateAll(g => g.map(x => ({ l: x.label, n: x.children.length, t: [...x.children].map(o => o.textContent) })));
  const libres = await page.evaluate(() => P.filter(p => !p.wild && !isSignedUp(p.id)).length);
  ok('el desplegable separa fijos y wildcards', grp.map(g => g.l).join('|') === 'Fijos|Wildcards' && grp[0].n === libres && grp[1].t.join() === 'Invitado Uno', JSON.stringify(grp.map(g => [g.l, g.n])));
  await tab(page, 'jug');

  // Pasarlo a fijos y de vuelta
  await row.first().locator('[data-kind]').click(); await page.waitForTimeout(150);
  ok('pasa a fijos', (await titles()).join('|') === 'Fijos · 25|Wildcards · 0' && (await page.innerText('#pcount')) === '25 fijos');
  ok('el botón ahora ofrece pasarlo a wildcards', (await page.locator('#plist .plgroup').first().locator('.plrow').last().locator('[data-kind]').innerText()) === 'A wildcards');
  await page.locator('#plist .plrow', { has: page.locator('input[value="Invitado Uno"]') }).locator('[data-kind]').click(); await page.waitForTimeout(150);
  ok('y vuelve a wildcards', (await titles()).join('|') === 'Fijos · 24|Wildcards · 1');

  // Persiste al recargar
  await page.reload(); await tab(page, 'jug'); await page.waitForTimeout(200);
  ok('persiste tras recargar', (await titles()).join('|') === 'Fijos · 24|Wildcards · 1');
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
