/* Servidor (Firebase simulado): quien abre el enlace ve el próximo partido, el historial y las estadísticas sin poder
   cambiar nada; quien organiza entra y edita todo; los cambios llegan en directo a los demás;
   los datos antiguos del dispositivo se suben sin las medias. */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

// Servidor: 17 jugadores (con notas antiguas, que no deben verse), 14 apuntados, el próximo partido y uno jugado
const players = {};
for (let i = 1; i <= 17; i++) players['p' + i] = { name: 'Amigo ' + i, pos: i === 1 || i === 9 ? ['POR'] : ['MED'], order: i, atq: 80 };
const signups = {};
for (let i = 1; i <= 14; i++) signups['p' + i] = { at: `2026-11-09T10:00:${String(i).padStart(2, '0')}.000Z` };
const snap = ids => ids.map((i, j) => ({ id: 'p' + i, name: 'Amigo ' + i, ovr: 77, role: j === 0 ? 'POR' : 'MED', x: j === 0 ? 50 : 20 + j * 8, y: null }));
const W = snap([1, 2, 3, 4, 5, 6, 7, 8]).map((p, j) => Object.assign(p, { y: j === 0 ? 94 : 69.5 }));
const D = snap([9, 10, 11, 12, 13, 14, 15, 16]).map((p, j) => Object.assign(p, { y: j === 0 ? 6 : 30.5 }));
const server = {
  players, signups,
  next: { current: { date: '2099-11-15', time: '12:00', mode: '8', layout: null } },
  matches: { '2026-11-08': { date: '2026-11-08', mode: '8', formation: { W: '3-3-1', D: '3-3-1' }, W, D, score: { W: 3, D: 2 }, goals: { W: { p2: 2, p3: 1 }, D: { p10: 2 } } } },
  settings: { general: { groupName: 'Los del domingo' } }
};
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('fake-firestore')));
const positions = page => page.locator('#board .mag').evaluateAll(els => Object.fromEntries(els.map(e => [e.dataset.n, e.className + ' ' + e.style.left + ' ' + e.style.top])));

(async () => {
  // ---------- Quien abre el enlace ----------
  const app = await open({ cloud: server, mode: null }), { page, ctx } = app;
  ok('no puede editar', await page.evaluate(() => document.body.classList.contains('viewer')));
  ok('nombre del grupo del servidor', (await page.textContent('#eyebrow')) === 'Los del domingo');
  ok('título con día y hora del partido', /^\S+ 15 nov · 12:00$/.test(await page.textContent('#h1')), await page.textContent('#h1'));
  ok('lista de apuntados', (await page.locator('#slist .sname').count()) === 14 && (await page.innerText('#count')) === '14 de 16');
  ok('alineación de los apuntados', (await page.locator('#board .mag').count()) === 14);
  ok('sin quitar, apuntar a otros, retocar ni guardar', (await page.locator('#slist .sdel').count()) === 0 && await page.isHidden('#saddform')
    && await page.isHidden('#fix') && await page.isHidden('#t-jug'));
  ok('puede compartir', await page.isVisible('#sharebtn'));
  const mag = page.locator('#board .mag.W').nth(3), before = await mag.getAttribute('style'), box = await mag.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down(); await page.mouse.move(box.x + 10, box.y - 200, { steps: 5 }); await page.mouse.up();
  ok('no se puede arrastrar', (await page.locator('#board .mag.W').nth(3).getAttribute('style')) === before);
  ok('sin medias en ningún sitio', !(await page.innerText('body')).includes('77') && !(await page.innerText('body')).includes('80'));

  // No puede apuntarse ni tocar la lista (solo la ve)
  ok('sin «Soy…» ni Apuntarme', (await page.locator('#me, #mesel, #mebtn').count()) === 0);
  ok('no puede apuntar', await page.evaluate(() => db.doc('signups/p17').set({ at: 'x' }).then(() => false, e => e.code === 'invalid_argument')));
  ok('ni borrar', await page.evaluate(() => db.doc('signups/p5').delete().then(() => false, e => e.code === 'invalid_argument')));
  ok('ni cambiar jugadores', await page.evaluate(() => db.doc('players/p1').update({ name: 'X' }).then(() => false, e => e.code === 'invalid_argument')));

  await tab(page, 'hist');
  ok('historial sin casillas ni botones', (await page.locator('#hlist input:visible, #hlist select:visible, #hlist button:visible').count()) === 0);
  ok('marcador como texto', (await page.locator('#hlist .sval').allInnerTexts()).join('-') === '3-2');
  await tab(page, 'stats');
  ok('estadísticas', /Amigo 2/.test(await page.innerText('#stats')));
  await tab(page, 'opc');
  ok('Opciones: solo entrar y versión', await page.isVisible('#loginform') && await page.isHidden('#groupname') && await page.isHidden('#wipe') && await page.isVisible('#chk'));

  // ---------- Quien organiza (en otra pestaña) ----------
  const admin = await ctx.newPage();
  await admin.goto(app.url); await admin.waitForSelector('#board .mag', { state: 'attached' });
  await tab(admin, 'opc');
  await admin.fill('#loginmail', 'mario@example.com'); await admin.fill('#loginpass', 'mala'); await admin.click('#loginbtn');
  await admin.waitForTimeout(100);
  ok('contraseña mala', (await toastText(admin)) === 'Correo o contraseña incorrectos.');
  await admin.fill('#loginpass', 'secreta'); await admin.click('#loginbtn'); await admin.waitForTimeout(150);
  ok('entra', (await toastText(admin)) === 'Has entrado: ya puedes cambiar los datos.' && !(await admin.evaluate(() => document.body.classList.contains('viewer'))));
  ok('dice con quién', /mario@example\.com/.test(await admin.innerText('#acchint')) && await admin.isVisible('#logout'));
  ok('sin datos del dispositivo no ofrece subirlos', await admin.isHidden('#migrate'));
  await tab(admin, 'alin');
  ok('puede quitar y apuntar a cualquiera', (await admin.locator('#slist .sdel').count()) === 14 && await admin.isVisible('#saddform'));
  await admin.selectOption('#saddsel', 'p17'); await admin.click('#saddform button'); await admin.waitForTimeout(150);
  await page.waitForTimeout(150); await tab(page, 'alin');
  ok('el amigo ve al nuevo apuntado en directo', (await page.innerText('#count')) === '15 de 16');

  // Retocar la alineación: el amigo ve la misma
  await admin.locator('#board').scrollIntoViewIfNeeded();
  const a1 = admin.locator('#board .mag.W').nth(2), b1 = await a1.boundingBox(), bd = await admin.locator('#board').boundingBox();
  await admin.mouse.move(b1.x + b1.width / 2, b1.y + 8); await admin.mouse.down();
  await admin.mouse.move(bd.x + bd.width * 0.5, bd.y + bd.height * 0.25, { steps: 6 }); await admin.mouse.up();
  await admin.waitForTimeout(200);
  ok('el retoque se guarda en el servidor', !!(await stored(admin)).next.current.layout);
  await page.waitForTimeout(150);
  ok('el amigo ve la alineación retocada', JSON.stringify(await positions(page)) === JSON.stringify(await positions(admin)));

  // Día y hora
  await tab(admin, 'opc');
  await admin.evaluate(() => { const i = document.getElementById('matchwhen'); i.value = '2099-11-15T10:30'; i.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(150);
  ok('el amigo ve la hora nueva', / · 10:30$/.test(await page.textContent('#h1')), await page.textContent('#h1'));

  // Resultado y goles
  await tab(admin, 'hist');
  const sW = admin.locator('#hlist input[data-s=W]');
  await sW.fill('5'); await sW.press('Tab'); await admin.waitForTimeout(150);
  await admin.locator('#hlist .goals[data-team=D] [data-gsel]').selectOption('p11');
  await admin.locator('#hlist .goals[data-team=D] [data-gadd]').click(); await admin.waitForTimeout(150);
  const m = (await stored(admin)).matches['2026-11-08'];
  ok('el cambio de marcador solo toca su equipo', m.score.W === 5 && m.score.D === 3, JSON.stringify(m.score));
  ok('el gol nuevo se suma sin borrar los demás', m.goals.D.p10 === 2 && m.goals.D.p11 === 1 && m.goals.W.p2 === 2, JSON.stringify(m.goals));
  await tab(page, 'hist'); await page.waitForTimeout(150);
  ok('el amigo ve el resultado nuevo', (await page.locator('#hlist .sval').allInnerTexts()).join('-') === '5-3');

  // Salir
  await tab(admin, 'opc'); await admin.click('#logout'); await admin.waitForTimeout(100);
  ok('sale: no puede editar', await admin.evaluate(() => document.body.classList.contains('viewer')) && await admin.isVisible('#loginform'));
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // ---------- Subir los datos antiguos del dispositivo ----------
  const old = { players: { viejo: { name: 'Veterano', atq: 90, def: 80, por: 70, pos: ['DEF'], order: 1 } },
    matches: { '2026-01-04': { date: '2026-01-04', mode: '7', W: [{ id: 'viejo', name: 'Veterano', ovr: 85, por: 70, role: 'DEF', x: 50, y: 82 }], D: [], score: { W: 1, D: 0 } } },
    settings: { general: { groupName: 'Los de siempre' } } };
  const app2 = await open({ cloud: server, mode: null }), p2 = app2.page;
  await p2.evaluate(o => { localStorage.setItem('pachangas-db-v1', JSON.stringify(o)); sessionStorage.setItem('fake-user', JSON.stringify({ uid: 'admin-uid', email: 'mario@example.com', isAnonymous: false })); }, old);
  await p2.reload(); await p2.waitForSelector('#board .mag');
  await tab(p2, 'opc');
  ok('ofrece subir los datos del dispositivo', await p2.isVisible('#migrate'));
  await p2.click('#migbtn');
  ok('pide confirmación', (await p2.innerText('#migbtn')) === 'Sí, subir y sustituir los del servidor');
  await p2.click('#migbtn'); await p2.waitForFunction(() => document.getElementById('migrate').hidden);
  ok('aviso de subida', (await toastText(p2)) === 'Subidos 1 jugador y 1 partido.', await toastText(p2));
  const up = await stored(p2);
  ok('sustituye a los del servidor', Object.keys(up.players).join() === 'viejo' && Object.keys(up.matches).join() === '2026-01-04');
  ok('sin medias en el servidor', !('atq' in up.players.viejo) && !('def' in up.players.viejo) && !('por' in up.players.viejo)
    && !('ovr' in up.matches['2026-01-04'].W[0]) && !('por' in up.matches['2026-01-04'].W[0]), JSON.stringify(up.players.viejo));
  ok('sube el nombre del grupo', up.settings.general.groupName === 'Los de siempre');
  ok('no vuelve a ofrecerlo', await p2.isHidden('#migrate'));
  ok('sin errores (subida)', !app2.errors.length, app2.errors.join(' | '));
  await app2.close();

  // ---------- Servidor sin apuntados: nadie se inventa una alineación ----------
  const app3 = await open({ cloud: { players }, mode: null, waitFor: '#teams .status' }), p3 = app3.page;
  await p3.waitForTimeout(200);
  ok('sin apuntados no hay alineación', (await p3.locator('#board .mag').count()) === 0 && /Todavía no se ha apuntado nadie/.test(await p3.innerText('#slist')));
  ok('sin errores (vacío)', !app3.errors.length, app3.errors.join(' | '));
  await app3.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
