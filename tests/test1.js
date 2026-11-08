/* Primera visita y pestaña Partido: plantilla de ejemplo, lista de apuntados, «Soy…», reparto, formación de cada formato. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  const mags = sel => page.locator(sel + ' .mag').count();
  const boardIds = () => page.locator('#board .mag').evaluateAll(els => els.map(e => e.dataset.n).sort().join(','));

  ok('5 pestañas', (await page.locator('.tabs .tab').count()) === 5);
  ok('empieza en Partido', (await page.getAttribute('#t-alin', 'aria-selected')) === 'true' && !(await page.isHidden('#p-alin')));
  ok('título con la fecha de hoy', /^Partido · \S+ \d+ \w+$/.test(await page.textContent('#h1')), await page.textContent('#h1'));
  ok('grupo por defecto', (await page.textContent('#eyebrow')) === 'Mi pachanga ⚽');
  ok('primera vez: 14 apuntados (los que pide el formato)', (await page.locator('#slist li').count()) === 14);
  ok('por orden de llegada', (await page.locator('#slist li .sname').first().innerText()) === 'Jugador 1');
  ok('14 imanes en el campo', (await mags('#board')) === 14, await mags('#board'));
  ok('contador', (await page.innerText('#count')) === '14 de 14');
  ok('sin avisos de faltan o sobran', (await page.locator('#status').count()) === 0 && await page.evaluate(() => document.getElementById('count').classList.contains('full')));
  ok('se puede apuntar a los 10 que faltan', (await page.locator('#saddsel option').count()) === 11);
  ok('dos equipos', (await page.locator('#teams .sec.team').count()) === 2);
  ok('7 por equipo', (await page.locator('#board .mag.W').count()) === 7 && (await page.locator('#board .mag.D').count()) === 7);
  ok('un portero por equipo con la nota POR', (await page.locator('#board .mag .ptags .pt-POR').count()) >= 2);
  ok('imanes con número o iniciales', /^[A-Z0-9]{1,2}$/.test(await page.locator('#board .mag .disc').first().innerText())
    && (await page.evaluate(() => [initials('Jugador 12'), initials('Juan Pérez'), initials('Mario'), initials('Íñigo')].join())) === '12,JP,MA,ÍÑ');

  // Sin el bloque Alineación (Otra opción, Invertir equipos)
  ok('sin Otra opción ni Invertir', (await page.locator('#shuffle, #swap').count()) === 0);
  const first = await boardIds();
  await page.reload(); await page.waitForSelector('#board .mag');
  ok('el reparto es siempre el mismo', (await boardIds()) === first);

  // «Soy…» y apuntarse
  ok('pide quién eres', await page.isVisible('#mesel'));
  await page.selectOption('#mesel', 'jugador-20');
  ok('Eres…', /Eres Jugador 20/.test(await page.innerText('#me')) && (await page.innerText('#mebtn')) === 'Apuntarme');
  await page.click('#mebtn'); await page.waitForTimeout(100);
  ok('apuntado: aviso', (await toastText(page)) === 'Apuntado. ¡Nos vemos en el campo!');
  ok('15 apuntados', (await page.innerText('#count')) === '15 de 14', await page.innerText('#count'));
  ok('el último de la lista es él, marcado', (await page.locator('#slist li').last().innerText()).includes('Jugador 20') && (await page.locator('#slist li.mine.extra').count()) === 1);
  ok('entra en la pizarra (al banquillo)', (await page.locator('.mag[data-n="jugador-20"]').count()) === 1 && (await mags('#teams .bench')) === 1);
  ok('ahora puede borrarse', (await page.innerText('#mebtn')) === 'Borrarme');
  await page.click('#mebtn'); await page.waitForTimeout(100);
  ok('borrado', (await page.locator('#slist li').count()) === 14 && (await toastText(page)) === 'Te has borrado de la lista.');
  await page.click('#mechange');
  ok('cambiar quién eres', await page.isVisible('#mesel'));

  // Quien organiza: apuntar y quitar a cualquiera
  await page.selectOption('#saddsel', 'jugador-15'); await page.click('#saddform button'); await page.waitForTimeout(100);
  ok('apuntar a otro', (await page.locator('#slist li').count()) === 15);
  for (let i = 0; i < 3; i++) { await page.locator('#slist .sdel').first().click(); await page.waitForTimeout(60); }
  ok('12 apuntados', (await page.innerText('#count')) === '12 de 14' && !(await page.evaluate(() => document.getElementById('count').classList.contains('full'))));
  ok('huecos vacíos en el campo', (await page.locator('#board .slot').count()) === 2);

  // Formación fija de cada formato
  ok('7 vs 7 juega 3-2-1', (await page.evaluate(() => FORMS[st.mode])) === '3-2-1' && (await page.locator('#board .slot, #board .mag').count()) === 14);

  // Formatos (están en Opciones)
  await tab(page, 'opc');
  await page.click('#m11');
  await tab(page, 'alin');
  ok('11 vs 11: campo grande', (await page.evaluate(() => document.getElementById('board').style.aspectRatio)).replace(/\s/g, '') === '72/109');
  ok('11 vs 11: 4-2-3-1', (await page.evaluate(() => FORMS[st.mode])) === '4-2-3-1');
  ok('11 vs 11: huecos POR, 4 DEF, 5 MED (2 pivotes y 3 mediapuntas) y 1 ATQ por equipo', (await page.evaluate(() => slotsFor('W').map(s => s.role).join())) === 'GK,DEF,DEF,DEF,DEF,MED,MED,MED,MED,MED,ATQ'
    && (await page.evaluate(() => new Set(slotsFor('W').filter(s => s.role === 'MED').map(s => s.y)).size)) === 2);
  ok('11 vs 11: de 22', (await page.innerText('#count')) === '12 de 22', await page.innerText('#count'));
  await tab(page, 'opc'); await page.click('#m8'); await tab(page, 'alin');
  ok('8 vs 8: campo de 7', (await page.evaluate(() => document.getElementById('board').style.aspectRatio)).replace(/\s/g, '') === '44/64');
  ok('8 vs 8 juega 3-3-1', (await page.evaluate(() => FORMS[st.mode])) === '3-3-1');

  // Recarga: se conserva
  const sel = await page.locator('#slist li').count();
  await page.reload(); await page.waitForSelector('#board .mag');
  ok('recargar conserva lista y formato', (await page.locator('#slist li').count()) === sel && (await page.innerText('#count')) === '12 de 16');

  // Pestañas por dirección
  await page.goto(app.url + '#estadisticas'); await page.reload(); await page.waitForSelector('#board .mag', { state: 'attached' });
  ok('#estadisticas abre Estadísticas', (await page.getAttribute('#t-stats', 'aria-selected')) === 'true' && (await page.textContent('#h1')) === 'Estadísticas');
  ok('fuera de Partido no se ven Guardar ni Compartir', await page.isHidden('#hctl'));

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
