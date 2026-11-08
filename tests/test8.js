/* Servidor (Firebase simulado): quien abre el enlace solo ve; quien entra edita; los cambios llegan en directo
   a los demás; los datos antiguos del dispositivo se suben sin las medias. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

// Servidor con 16 jugadores (con notas antiguas, que no deben verse) y un partido con resultado y goles
const players = {};
for (let i = 1; i <= 16; i++) players['p' + i] = { name: 'Amigo ' + i, pos: i === 1 || i === 9 ? ['POR'] : ['MED'], order: i, atq: 80 };
const snap = ids => ids.map((i, j) => ({ id: 'p' + i, name: 'Amigo ' + i, ovr: 77, role: j === 0 ? 'POR' : 'MED', x: j === 0 ? 50 : 10 + j * 10, y: null }));
const W = snap([1, 2, 3, 4, 5, 6, 7, 8]).map((p, j) => Object.assign(p, { y: j === 0 ? 94 : 69.5 }));
const D = snap([9, 10, 11, 12, 13, 14, 15, 16]).map((p, j) => Object.assign(p, { y: j === 0 ? 6 : 30.5 }));
const server = {
  players,
  matches: { '2026-11-15': { date: '2026-11-15', mode: '8', formation: { W: '3-3-1', D: '3-3-1' }, W, D, score: { W: 3, D: 2 }, goals: { W: { p2: 2, p3: 1 }, D: { p10: 2 } } } },
  settings: { general: { groupName: 'Los del domingo' } }
};

(async () => {
  // ---------- Quien solo ve ----------
  const app = await open({ cloud: server, mode: null }), { page, ctx } = app;
  ok('modo solo ver', await page.evaluate(() => document.body.classList.contains('viewer')));
  ok('nombre del grupo del servidor', (await page.textContent('#eyebrow')) === 'Los del domingo');
  ok('pizarra con la alineación guardada', (await page.locator('#board .mag').count()) === 16);
  ok('título con la fecha del partido', /Domingo 15 nov/.test(await page.textContent('#h1')), await page.textContent('#h1'));
  ok('sin convocatoria, guardar ni pestaña Jugadores', await page.isHidden('#chips') && await page.isHidden('#fix') && await page.isHidden('#t-jug') && await page.isHidden('#signup'));
  ok('sin formaciones', !(await page.locator('#teams .forms').first().isVisible()));
  ok('puede compartir', await page.isVisible('#sharebtn'));
  // Arrastrar no mueve nada
  const mag = page.locator('#board .mag.W').nth(3), before = await mag.getAttribute('style');
  const box = await mag.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down(); await page.mouse.move(box.x + 10, box.y - 200, { steps: 5 }); await page.mouse.up();
  ok('no se puede arrastrar', (await page.locator('#board .mag.W').nth(3).getAttribute('style')) === before);
  ok('sin medias en ningún sitio', !(await page.innerText('body')).includes('77'));

  await tab(page, 'hist');
  ok('historial sin casillas ni botones', (await page.locator('#hlist input:visible, #hlist select:visible, #hlist button:visible').count()) === 0);
  ok('marcador como texto', (await page.locator('#hlist .sval').allInnerTexts()).join('-') === '3-2');
  await tab(page, 'stats');
  ok('estadísticas', /Amigo 2/.test(await page.innerText('#stats')));
  await tab(page, 'opc');
  ok('Opciones: solo entrar y versión', await page.isVisible('#loginform') && await page.isHidden('#groupname') && await page.isHidden('#wipe') && await page.isVisible('#chk'));
  ok('escribir sin entrar lo rechaza el servidor', await page.evaluate(() => db.doc('players/p1').update({ name: 'X' }).then(() => false, e => e.code === 'invalid_argument')));

  // ---------- Entrar ----------
  await page.fill('#loginmail', 'mario@example.com'); await page.fill('#loginpass', 'mala'); await page.click('#loginbtn');
  await page.waitForTimeout(100);
  ok('contraseña mala', (await toastText(page)) === 'Correo o contraseña incorrectos.' && await page.evaluate(() => document.body.classList.contains('viewer')));
  await page.fill('#loginpass', 'secreta'); await page.click('#loginbtn');
  await page.waitForTimeout(150);
  ok('entra', (await toastText(page)) === 'Has entrado: ya puedes cambiar los datos.' && !(await page.evaluate(() => document.body.classList.contains('viewer'))));
  ok('dice con quién', /mario@example\.com/.test(await page.innerText('#acchint')) && await page.isVisible('#logout') && await page.isHidden('#loginform'));
  ok('ya ve las opciones de editar', await page.isVisible('#groupname') && await page.isVisible('#t-jug'));
  ok('sin datos del dispositivo no ofrece subirlos', await page.isHidden('#migrate'));
  await tab(page, 'alin');
  ok('la pizarra sigue con la alineación guardada', (await page.locator('#board .mag').count()) === 16 && await page.isVisible('#fix'));

  // ---------- Los cambios llegan en directo a otro que solo ve ----------
  const friend = await ctx.newPage();
  await friend.goto(app.url); await friend.waitForSelector('#board .mag');
  ok('el amigo solo ve', await friend.evaluate(() => document.body.classList.contains('viewer')));
  await tab(page, 'hist');
  const sW = page.locator('#hlist input[data-s=W]');
  await sW.fill('5'); await sW.press('Tab'); await page.waitForTimeout(150);
  await page.locator('#hlist .goals[data-team=D] [data-gsel]').selectOption('p11');
  await page.locator('#hlist .goals[data-team=D] [data-gadd]').click(); await page.waitForTimeout(150);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fake-firestore')).matches['2026-11-15']);
  ok('el cambio de marcador solo toca su equipo', stored.score.W === 5 && stored.score.D === 3, JSON.stringify(stored.score));
  ok('el gol nuevo se suma sin borrar los demás', stored.goals.D.p10 === 2 && stored.goals.D.p11 === 1 && stored.goals.W.p2 === 2, JSON.stringify(stored.goals));
  await tab(friend, 'hist'); await friend.waitForTimeout(150);
  ok('el amigo ve el resultado nuevo', (await friend.locator('#hlist .sval').allInnerTexts()).join('-') === '5-3');

  // ---------- Salir ----------
  await tab(page, 'opc'); await page.click('#logout'); await page.waitForTimeout(100);
  ok('sale: vuelve a solo ver', await page.evaluate(() => document.body.classList.contains('viewer')) && await page.isVisible('#loginform'));
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // ---------- Subir los datos antiguos del dispositivo ----------
  const old = { players: { viejo: { name: 'Veterano', atq: 90, def: 80, por: 70, pos: ['DEF'], order: 1 } },
    matches: { '2026-01-04': { date: '2026-01-04', mode: '7', W: [{ id: 'viejo', name: 'Veterano', ovr: 85, por: 70, role: 'DEF', x: 50, y: 82 }], D: [], score: { W: 1, D: 0 } } },
    settings: { general: { groupName: 'Los de siempre' } } };
  const app2 = await open({ cloud: server, mode: null }), p2 = app2.page;
  await p2.evaluate(o => { localStorage.setItem('pachangas-db-v1', JSON.stringify(o)); sessionStorage.setItem('fake-user', JSON.stringify({ uid: 'admin-uid', email: 'mario@example.com' })); }, old);
  await p2.reload(); await p2.waitForSelector('#board .mag');
  await tab(p2, 'opc');
  ok('ofrece subir los datos del dispositivo', await p2.isVisible('#migrate'));
  await p2.click('#migbtn');
  ok('pide confirmación', (await p2.innerText('#migbtn')) === 'Sí, subir y sustituir los del servidor');
  await p2.click('#migbtn'); await p2.waitForFunction(() => document.getElementById('migrate').hidden);
  ok('aviso de subida', (await toastText(p2)) === 'Subidos 1 jugador y 1 partido.', await toastText(p2));
  const up = await p2.evaluate(() => JSON.parse(localStorage.getItem('fake-firestore')));
  ok('sustituye a los del servidor', Object.keys(up.players).join() === 'viejo' && Object.keys(up.matches).join() === '2026-01-04');
  ok('sin medias en el servidor', !('atq' in up.players.viejo) && !('def' in up.players.viejo) && !('por' in up.players.viejo)
    && !('ovr' in up.matches['2026-01-04'].W[0]) && !('por' in up.matches['2026-01-04'].W[0]), JSON.stringify(up.players.viejo));
  ok('sube el nombre del grupo', up.settings.general.groupName === 'Los de siempre');
  ok('no vuelve a ofrecerlo', await p2.isHidden('#migrate'));
  ok('sin errores (subida)', !app2.errors.length, app2.errors.join(' | '));
  await app2.close();

  // ---------- Servidor vacío: quien solo ve no se inventa una alineación ----------
  const app3 = await open({ cloud: { players }, mode: null, waitFor: '#teams .status' }), p3 = app3.page;
  await p3.waitForTimeout(200);
  ok('sin alineación guardada', (await p3.locator('#board .mag').count()) === 0 && /Todavía no hay ninguna alineación guardada/.test(await p3.innerText('#teams')));
  ok('sin errores (vacío)', !app3.errors.length, app3.errors.join(' | '));
  await app3.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
