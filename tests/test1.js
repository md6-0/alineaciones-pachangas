/* Primera visita y pizarra: plantilla de ejemplo, reparto, convocatoria, formaciones, formatos e invertir equipos. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  const mags = sel => page.locator(sel + ' .mag').count();
  const boardIds = () => page.locator('#board .mag').evaluateAll(els => els.map(e => e.dataset.n).sort().join(','));

  ok('5 pestañas', (await page.locator('.tabs .tab').count()) === 5);
  ok('empieza en Alineación', (await page.getAttribute('#t-alin', 'aria-selected')) === 'true' && !(await page.isHidden('#p-alin')));
  ok('título con la fecha de hoy', /^Alineación · \S+ \d+ \w+$/.test(await page.textContent('#h1')), await page.textContent('#h1'));
  ok('grupo por defecto', (await page.textContent('#eyebrow')) === 'Mi pachanga ⚽');
  ok('plantilla de ejemplo: 24 jugadores en la convocatoria', (await page.locator('#chips .chip').count()) === 24);
  ok('14 convocados', (await page.locator('#chips .chip[aria-pressed=true]').count()) === 14);
  ok('14 imanes en el campo', (await mags('#board')) === 14, await mags('#board'));
  ok('contador', (await page.innerText('#count')) === '14 en el campo');
  ok('sin aviso de convocatoria', await page.isHidden('#status'));
  ok('dos equipos', (await page.locator('#teams .sec.team').count()) === 2);
  ok('7 por equipo', (await page.locator('#board .mag.W').count()) === 7 && (await page.locator('#board .mag.D').count()) === 7);
  ok('un portero por equipo con la nota POR', (await page.locator('#board .mag .ptags .pt-POR').count()) >= 2);
  ok('sin medias', (await page.locator('#teams .tmeta, #chips .r').count()) === 0 && /^[A-Z0-9]{1,2}$/.test(await page.locator('#board .mag .disc').first().innerText())
    && (await page.evaluate(() => [initials('Jugador 12'), initials('Juan Pérez'), initials('Mario'), initials('Íñigo')].join())) === '12,JP,MA,ÍÑ');

  // Otra opción cambia el reparto y es determinista
  const first = await boardIds();
  const whites = () => page.locator('#board .mag.W').evaluateAll(els => els.map(e => e.dataset.n).sort().join(','));
  const w0 = await whites();
  await page.click('#shuffle'); const w1 = await whites();
  ok('Otra opción cambia el reparto', w1 !== w0);
  ok('Otra opción mantiene a los mismos 14', (await boardIds()) === first);

  // Invertir
  const wBefore = await whites();
  await page.click('#swap');
  const darks = await page.locator('#board .mag.D').evaluateAll(els => els.map(e => e.dataset.n).sort().join(','));
  ok('Invertir: el Blanco pasa a Oscuro', darks === wBefore);
  ok('Invertir: aviso', (await toastText(page)) === 'Equipos invertidos.');

  // Convocatoria
  await page.locator('#chips .chip[aria-pressed=false]').first().click();
  ok('15 convocados → sobra 1', (await page.innerText('#status')) === 'Sobra 1 para 7 vs 7; van al banquillo.');
  ok('uno al banquillo', (await mags('#teams .bench')) === 1);
  for (let i = 0; i < 3; i++) await page.locator('#chips .chip[aria-pressed=true]').first().click();
  ok('12 convocados → faltan 2', (await page.innerText('#status')) === 'Faltan 2 jugadores para 7 vs 7.');
  ok('huecos vacíos en el campo', (await page.locator('#board .slot').count()) === 2);

  // Formaciones
  await page.locator('#teams .form[data-team=W][data-f="3-2-1"]').click();
  ok('formación 3-2-1 marcada', (await page.getAttribute('#teams .form[data-team=W][data-f="3-2-1"]', 'aria-pressed')) === 'true');

  // Formatos (están en Opciones)
  await tab(page, 'opc');
  await page.click('#m11');
  await tab(page, 'alin');
  ok('11 vs 11: campo grande', (await page.evaluate(() => document.getElementById('board').style.aspectRatio)).replace(/\s/g, '') === '72/109');
  ok('11 vs 11: formaciones de 11', (await page.locator('#teams .form[data-team=D]').allInnerTexts()).join() === '4-4-2,4-3-3,3-5-2,4-5-1');
  ok('11 vs 11: faltan', /^Faltan 10 jugadores para 11 vs 11\.$/.test(await page.innerText('#status')), await page.innerText('#status'));
  await tab(page, 'opc'); await page.click('#m8'); await tab(page, 'alin');
  ok('8 vs 8: campo de 7', (await page.evaluate(() => document.getElementById('board').style.aspectRatio)).replace(/\s/g, '') === '44/64');

  // Recarga: se conserva
  const sel = await page.locator('#chips .chip[aria-pressed=true]').count();
  await page.reload(); await page.waitForSelector('#board .mag');
  ok('recargar conserva convocatoria y formato', (await page.locator('#chips .chip[aria-pressed=true]').count()) === sel && /8 vs 8/.test(await page.innerText('#status')));

  // Pestañas por dirección
  await page.goto(app.url + '#estadisticas'); await page.reload(); await page.waitForSelector('#board .mag', { state: 'attached' });
  ok('#estadisticas abre Estadísticas', (await page.getAttribute('#t-stats', 'aria-selected')) === 'true' && (await page.textContent('#h1')) === 'Estadísticas');
  ok('fuera de Alineación no se ven Guardar ni Compartir', await page.isHidden('#hctl'));

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
