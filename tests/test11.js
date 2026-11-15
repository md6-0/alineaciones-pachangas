/* Medias: quien organiza escribe la media de cada uno y sale su color; el reparto las usa para igualar equipos;
   con el Firebase simulado, quien no ha entrado no puede leerlas pero ve los mismos equipos que quien organiza. */
const { open, checker, tab } = require('./helpers');
const { ok, done } = checker();

// 8 jugadores: 2 porteros y 6 de campo; tres cracks y el resto flojos
const names = ['Pepe', 'Paco', 'Ana', 'Bea', 'Carla', 'Dani', 'Edu', 'Fran'];
const players = {}, signups = {};
names.forEach((n, i) => { players['p' + i] = { name: n, pos: i < 2 ? ['POR'] : ['MED'], order: i }; signups['p' + i] = { at: '2026-11-0' + 1 + 'T10:00:0' + i + '.000Z' }; });
const ratings = { p0: { media: 75 }, p1: { media: 75 }, p2: { media: 92 }, p3: { media: 90 }, p4: { media: 91 }, p5: { media: 55 }, p6: { media: 56 }, p7: { media: 57 } };

(async () => {
  // ---------- Reglas de la media, sin servidor ----------
  const app = await open({ mode: null }), { page } = app;
  const r = await page.evaluate(async () => {
    const id = P[0].id, out = {};
    out.none = mediaOf(id);
    await setMedia(id, 83); out.set = mediaOf(id);
    out.tiers = [58, 64, 65, 74, 75, 89, 90, 99].map(tierOf).join();
    return out;
  });
  ok('sin media, null', r.none === null);
  ok('guarda la media', r.set === 83);
  ok('bronce, plata, oro y azul', r.tiers === 'bronze,bronze,silver,silver,gold,gold,blue,blue', r.tiers);
  await tab(page, 'jug'); await page.waitForTimeout(150);
  const card = page.locator('#plist .plrow >> nth=0 >> input.mcard');
  ok('carta dorada con la media en Jugadores', (await card.inputValue()) === '83' && /gold/.test(await card.getAttribute('class')));
  await card.fill('94'); await card.blur(); await page.waitForTimeout(150);
  ok('escribir la media la guarda y cambia el color', await page.evaluate(() => mediaOf(P[0].id) === 94) && /blue/.test(await page.getAttribute('#plist .plrow >> nth=0 >> input.mcard', 'class')));
  await page.fill('#plist .plrow >> nth=0 >> input.mcard', '150'); await page.locator('#plist .plrow >> nth=0 >> input.mcard').blur(); await page.waitForTimeout(150);
  ok('fuera de 1-99 no se guarda', await page.evaluate(() => mediaOf(P[0].id) === 94));
  await page.fill('#plist .plrow >> nth=0 >> input.mcard', ''); await page.locator('#plist .plrow >> nth=0 >> input.mcard').blur(); await page.waitForTimeout(150);
  ok('vacía, sin media', await page.evaluate(() => mediaOf(P[0].id) === null));
  // Ordenar por media
  await page.evaluate(async () => { await setMedia(P[1].id, 99); await setMedia(P[2].id, 60); });
  await page.click('#psortseg [data-psort=media]'); await page.waitForTimeout(150);
  const order = await page.evaluate(() => [...document.querySelectorAll('#plist .plrow')].slice(0, 2).map(r => r.dataset.id));
  ok('ordenar por media: la más alta arriba', order[0] === await page.evaluate(() => P[1].id) && await page.evaluate(() => st.psort === 'media'), JSON.stringify(order));
  await page.click('#psortseg [data-psort=list]'); await page.waitForTimeout(150);
  ok('volver al orden de la lista', await page.evaluate(() => document.querySelector('#plist .plrow').dataset.id === P[0].id));
  ok('sin errores (sin servidor)', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // ---------- Con servidor: el reparto ----------
  const cloud = { players, signups, ratings, next: { current: { mode: '7' } } };
  const v = await open({ cloud, mode: '7', waitFor: '#board .mag' });
  const teamsOf = pg => pg.evaluate(() => ({ W: idsOf('W').sort().join(), D: idsOf('D').sort().join() }));
  const viewerBefore = await teamsOf(v.page);
  ok('quien solo ve no lee las medias', await v.page.evaluate(() => !ratingsLoaded && !Object.keys(ratings).length));

  // Quien organiza entra en otra página
  const adminPage = await v.ctx.newPage();
  await adminPage.goto(v.url); await adminPage.waitForSelector('#board .mag');
  await adminPage.click('#t-opc');
  await adminPage.fill('#loginmail', 'mario@example.com'); await adminPage.fill('#loginpass', 'secreta'); await adminPage.click('#loginbtn');
  await adminPage.waitForTimeout(600);
  ok('quien organiza lee las medias', await adminPage.evaluate(() => ratingsLoaded));
  const admin = await teamsOf(adminPage);
  const cracks = t => ['p2', 'p3', 'p4'].filter(id => t.split(',').includes(id)).length;
  ok('las medias igualan: los tres cracks no van juntos', cracks(admin.W) < 3 && cracks(admin.D) < 3, JSON.stringify(admin));
  ok('un portero en cada equipo', admin.W.includes('p0') !== admin.D.includes('p0') && admin.W.includes('p1') !== admin.D.includes('p1'));
  ok('guarda el reparto para los demás', await adminPage.evaluate(() => { const d = JSON.parse(localStorage.getItem('fake-firestore')).next.current; return !!(d.split && d.split.W.length); }));

  await v.page.waitForTimeout(400);
  const viewer = await teamsOf(v.page);
  ok('quien solo ve, los mismos equipos que quien organiza', viewer.W === admin.W && viewer.D === admin.D, JSON.stringify({ viewer, admin, viewerBefore }));
  ok('quien solo ve no tiene pestaña Jugadores ni números', !(await v.page.isVisible('#t-jug')) && !(await v.page.locator('.mcard').count()));
  ok('sin errores (servidor)', !v.errors.length, v.errors.join(' | '));
  await v.close();
  done();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
