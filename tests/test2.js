/* Jugadores: añadir, cambiar nombre, notas y posiciones, ordenar por media y quitar. Los cambios llegan a la pizarra. */
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
  ok('aviso de añadido', (await toastText(page)) === 'Íñigo Pérez añadido con 70 en todo.', await toastText(page));
  ok('campo vacío', (await page.inputValue('#newname')) === '');
  const row = page.locator('#plist tbody tr').last();
  const id = await row.getAttribute('data-id');
  ok('id a partir del nombre', /^inigo-perez-[a-z0-9]{1,4}$/.test(id), id);
  ok('media 70', (await row.locator('.ov').innerText()) === '70');
  ok('vacío no añade', await (async () => { await page.fill('#newname', '   '); await page.click('#addform button[type=submit]'); return (await page.innerText('#pcount')) === '25 jugadores'; })());

  // Notas y posiciones
  const num = f => row.locator(`input[data-f=${f}]`);
  await num('atq').fill('150'); await num('atq').press('Tab'); await page.waitForTimeout(150);
  ok('ATQ se limita a 99', (await num('atq').inputValue()) === '99');
  ok('media sin posición: (99+70)/2 → 85', (await row.locator('.ov').innerText()) === '85', await row.locator('.ov').innerText());
  await row.locator('[data-pos=DEF]').click(); await page.waitForTimeout(100);
  const row2 = page.locator(`#plist tr[data-id="${id}"]`);
  ok('DEF marcada', (await row2.locator('[data-pos=DEF]').getAttribute('aria-pressed')) === 'true');
  ok('media de defensa: 99·.25+70·.75 → 78', (await row2.locator('.ov').innerText()) === '78', await row2.locator('.ov').innerText());
  await row2.locator('[data-pos=ATQ]').click(); await page.waitForTimeout(100);
  ok('DEF+ATQ promedian → 85', (await page.locator(`#plist tr[data-id="${id}"] .ov`).innerText()) === '85');
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

  // Orden por media
  await tab(page, 'jug');
  await page.click('#s-media');
  const ovs = (await page.locator('#plist .ov').allInnerTexts()).map(Number);
  ok('por media: de mayor a menor', ovs.every((v, i) => !i || ovs[i - 1] >= v));
  await page.click('#s-list');
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
  ok('persiste tras recargar', (await page.innerText('#pcount')) === '24 jugadores' && (await page.getAttribute('#s-list', 'aria-pressed')) === 'true');

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
