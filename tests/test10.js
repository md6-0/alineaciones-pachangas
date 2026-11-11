/* Pagos: quien organiza apunta quién ha pagado la pista de cada partido y exporta quién falta;
   con el Firebase simulado, quien no ha entrado no ve la pestaña ni puede leer los pagos. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

const players = {};
['Ana', 'Bea', 'Carla', 'Dani', 'Edu'].forEach((n, i) => { players['p' + i] = { name: n, pos: ['MED'], order: i }; });
const pl = ids => ids.map(i => ({ id: 'p' + i, name: players['p' + i].name, role: 'MED', x: 50, y: 50 }));
const match = (date, w, d) => ({ date, mode: '7', formation: { W: '3-2-1', D: '3-2-1' }, W: pl(w), D: pl(d), score: { W: 1, D: 0 } });
const matches = { '2026-11-01': match('2026-11-01', [0, 1], [2, 3]), '2026-11-08': match('2026-11-08', [0, 1, 4], [2, 3]) };

(async () => {
  // ---------- Sin servidor: quien organiza ----------
  const app = await open({ mode: null }), { page } = app;
  await page.evaluate(async d => {
    for (const id of Object.keys(rawPlayers)) await db.doc('players/' + id).delete();
    for (const id of Object.keys(d.players)) await db.doc('players/' + id).set(d.players[id]);
    for (const id of Object.keys(d.matches)) await db.doc('matches/' + id).set(d.matches[id]);
  }, { players, matches });
  await tab(page, 'pag'); await page.waitForTimeout(150);
  ok('título Pagos', (await page.textContent('#h1')) === 'Pagos');
  ok('una tarjeta por partido, la más reciente arriba', (await page.locator('.pay').count()) === 2 && (await page.getAttribute('.pay >> nth=0', 'data-id')) === '2026-11-08');
  ok('20 € entre 5 = 4,00 €; entre 4 = 5,00 €', /4,00 €/.test(await page.innerText('.pay >> nth=0')) && /5,00 €/.test(await page.innerText('.pay >> nth=1')));
  ok('todo pendiente: 9 pagos, 40 €', /40,00 € por cobrar · 9 pagos pendientes/.test(await page.innerText('#paysum')), await page.innerText('#paysum'));

  await page.click('.pay >> nth=0 >> [data-pid="p0"]'); await page.waitForTimeout(100);
  ok('Ana pagada', await page.evaluate(() => payments['2026-11-08'].paid.p0 === true && payments['2026-11-08'].court === 20));
  ok('1 de 5', /1 de 5/.test(await page.innerText('.pay >> nth=0 >> summary')));
  await page.click('.pay >> nth=1 >> [data-all]'); await page.waitForTimeout(100);
  ok('partido del 1 cobrado y plegado', /Pagado ✓/.test(await page.innerText('.pay >> nth=1 >> summary')) && !(await page.getAttribute('.pay >> nth=1', 'open') !== null));

  // Cambiar el precio de la pista
  await page.fill('.pay >> nth=0 >> [data-court]', '25'); await page.locator('.pay >> nth=0 >> [data-court]').blur(); await page.waitForTimeout(150);
  ok('25 € entre 5 = 5,00 €', /5,00 € cada uno/.test(await page.innerText('.pay >> nth=0')));
  ok('quedan 4 por 20 €', /20,00 € por cobrar · 4 pagos pendientes/.test(await page.innerText('#paysum')), await page.innerText('#paysum'));

  const txt = await page.evaluate(() => pendingText());
  ok('texto de quién falta', txt.startsWith('💶 Falta por pagar la pista') && /\*Domingo 8 nov 2026\* · 5,00 € cada uno\n- Bea\n- Carla\n- Dani\n- Edu/.test(txt) && !/Ana/.test(txt) && !/1 nov/.test(txt), txt);
  await page.click('#paybtn');
  ok('menú con WhatsApp', /wa\.me\/\?text=/.test(await page.getAttribute('#paymenu .s-wa', 'href')));

  // Dos partidos con deudas: total por persona
  await page.keyboard.press('Escape');
  await page.click('.pay >> nth=1 >> summary'); await page.waitForTimeout(100);
  ok('se despliega a mano', (await page.getAttribute('.pay >> nth=1', 'open')) !== null);
  await page.click('.pay >> nth=1 >> [data-pid="p2"]'); await page.waitForTimeout(100);
  const t2 = await page.evaluate(() => pendingText());
  ok('total por persona', /\*Total por persona\*\nCarla: 10,00 €/.test(t2) && /Bea: 5,00 €/.test(t2), t2);

  // Copia de seguridad con los pagos, y borrar el partido borra sus pagos
  ok('la copia lleva los pagos', await page.evaluate(() => !!buildBackup().payments['2026-11-08']));
  await page.evaluate(() => deleteMatch('2026-11-01')); await page.waitForTimeout(100);
  ok('borrar partido borra sus pagos', await page.evaluate(() => !payments['2026-11-01']));
  ok('sin errores (sin servidor)', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // ---------- Con servidor: quien solo ve ----------
  const cloud = { players, matches, payments: { '2026-11-08': { court: 20, paid: { p0: true } } } };
  const v = await open({ cloud, waitFor: '#board' });
  await v.page.waitForTimeout(300);
  ok('sin pestaña Pagos', !(await v.page.isVisible('#t-pag')));
  await v.page.evaluate(() => { st.tab = 'pag'; showTab(); });
  ok('no se puede abrir Pagos', await v.page.evaluate(() => st.tab === 'alin'));
  ok('no ha leído los pagos', await v.page.evaluate(() => !Object.keys(payments).length && !offPayments));
  ok('el servidor no deja leerlos', await v.page.evaluate(() => new Promise(r => db.collection('payments').onSnapshot(() => r(false), () => r(true)))));

  // Entra quien organiza: los ve
  await tab(v.page, 'opc');
  await v.page.fill('#loginmail', 'mario@example.com'); await v.page.fill('#loginpass', 'secreta'); await v.page.click('#loginbtn');
  await v.page.waitForTimeout(400);
  await tab(v.page, 'pag'); await v.page.waitForTimeout(200);
  ok('al entrar, ve los pagos', /1 de 5/.test(await v.page.innerText('#paylist')), await v.page.innerText('#paylist'));
  ok('sin errores (servidor)', !v.errors.length, v.errors.join(' | '));
  await v.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
