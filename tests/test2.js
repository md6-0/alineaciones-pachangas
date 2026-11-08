/* Jugadores: añadir, cambiar nombre y posiciones, y quitar. Los cambios llegan a la pizarra. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  await tab(page, 'jug');
  ok('título', (await page.textContent('#h1')) === 'Jugadores');
  ok('24 jugadores', (await page.innerText('#pcount')) === '24 jugadores');
  ok('tabla con 24 filas', (await page.locator('#plist tbody tr').count()) === 24);

  // Añadir
  await page.fill('#newname', '  Íñigo Pérez ');
  await page.click('#addform button[type=submit]');
  await page.waitForTimeout(100);
  ok('añadido', (await page.innerText('#pcount')) === '25 jugadores');
  ok('aviso de añadido', (await toastText(page)) === 'Íñigo Pérez añadido.', await toastText(page));
  ok('campo vacío', (await page.inputValue('#newname')) === '');
  const row = page.locator('#plist tbody tr').last();
  const id = await row.getAttribute('data-id');
  ok('id a partir del nombre', /^inigo-perez-[a-z0-9]{1,4}$/.test(id), id);
  ok('sin medias', (await page.locator('#plist input[type=number], #plist .ov').count()) === 0);
  ok('vacío no añade', await (async () => { await page.fill('#newname', '   '); await page.click('#addform button[type=submit]'); return (await page.innerText('#pcount')) === '25 jugadores'; })());

  // Posiciones
  await row.locator('[data-pos=DEF]').click(); await page.waitForTimeout(100);
  const row2 = page.locator(`#plist tr[data-id="${id}"]`);
  ok('DEF marcada', (await row2.locator('[data-pos=DEF]').getAttribute('aria-pressed')) === 'true');
  await row2.locator('[data-pos=ATQ]').click(); await page.waitForTimeout(100);
  ok('DEF y ATQ marcadas', (await page.locator(`#plist tr[data-id="${id}"] [aria-pressed=true]`).count()) === 2);
  const nameIn = page.locator(`#plist tr[data-id="${id}"] input[data-f=name]`);
  await nameIn.fill(''); await nameIn.press('Tab'); await page.waitForTimeout(100);
  ok('nombre vacío vuelve al anterior', (await nameIn.inputValue()) === 'Íñigo Pérez');
  await nameIn.fill('Íñigo'); await nameIn.press('Tab'); await page.waitForTimeout(150);
  ok('nombre cambiado', (await page.locator(`#plist tr[data-id="${id}"] input[data-f=name]`).inputValue()) === 'Íñigo');

  // Llega a la convocatoria y a la pizarra
  await tab(page, 'alin');
  const chip = page.locator(`#chips .chip[data-n="${id}"]`);
  ok('aparece en la convocatoria sin marcar', (await chip.getAttribute('aria-pressed')) === 'false' && /Íñigo/.test(await chip.innerText()));
  await chip.click();
  ok('convocado: aparece su imán', (await page.locator(`.mag[data-n="${id}"]`).count()) === 1);

  // Orden de lista
  await tab(page, 'jug');
  ok('orden de lista: el nuevo al final', (await page.locator('#plist tbody tr').last().getAttribute('data-id')) === id);

  // Quitar (pide confirmación)
  const del = page.locator(`#plist tr[data-id="${id}"] [data-del]`);
  await del.click();
  ok('pide confirmación', (await del.innerText()) === '¿Seguro?');
  await del.click(); await page.waitForTimeout(100);
  ok('quitado', (await page.innerText('#pcount')) === '24 jugadores');
  await tab(page, 'alin');
  ok('desaparece de la pizarra', (await page.locator(`.mag[data-n="${id}"]`).count()) === 0 && (await page.locator('#board .mag').count()) === 14);

  // Persistencia
  await page.reload(); await page.waitForSelector('#board .mag');
  await tab(page, 'jug');
  ok('persiste tras recargar', (await page.innerText('#pcount')) === '24 jugadores');

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
