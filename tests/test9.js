/* Rewind del año: los premios y los cromos salen de los partidos guardados; se ve en historias; solo quien organiza
   lo ve antes de publicarlo; al publicarlo, lo ven todos (con el Firebase simulado). */
const { open, checker, tab, toastText } = require('./helpers');
const { ok, done } = checker();

// 6 jugadores; 5 partidos en 2025 con resultados y goles pensados para saber quién gana cada premio
const players = {};
['Ana', 'Bea', 'Carla', 'Dani', 'Edu', 'Fran'].forEach((n, i) => { players['p' + i] = { name: n, pos: i === 0 ? ['POR'] : ['MED'], order: i }; });
const pl = (ids, y) => ids.map(i => ({ id: 'p' + i, name: players['p' + i].name, role: 'MED', x: 50, y }));
const match = (date, w, d, sW, sD, goals) => ({ date, mode: '7', formation: { W: '3-2-1', D: '3-2-1' }, W: pl(w, 70), D: pl(d, 30), score: { W: sW, D: sD }, goals });
const matches = {
  '2025-01-05': match('2025-01-05', [0, 1, 2], [3, 4], 3, 1, { W: { p1: 3 }, D: { p3: 1 } }),
  '2025-02-05': match('2025-02-05', [0, 1, 3], [2, 4], 2, 0, { W: { p1: 2 }, D: {} }),
  '2025-03-05': match('2025-03-05', [0, 1, 4], [2, 3], 1, 1, { W: { p1: 1 }, D: { p2: 1 } }),
  '2025-04-05': match('2025-04-05', [0, 1, 2], [3, 4], 4, 0, { W: { p0: 1, p2: 3 }, D: {} }),
  '2025-05-05': match('2025-05-05', [0, 1, 5], [2, 3], 2, 1, { W: { p1: 2 }, D: { p3: 1 } }),
  '2026-01-05': match('2026-01-05', [0, 1], [2, 3], 1, 0, { W: { p1: 1 }, D: {} })
};

(async () => {
  // ---------- Quien organiza (sin servidor, edita) ----------
  const app = await open({ mode: null }), { page } = app;
  await page.evaluate(async d => {
    for (const id of Object.keys(rawPlayers)) await db.doc('players/' + id).delete();
    for (const id of Object.keys(d.players)) await db.doc('players/' + id).set(d.players[id]);
    for (const id of Object.keys(d.matches)) await db.doc('matches/' + id).set(d.matches[id]);
  }, { players, matches });
  await tab(page, 'stats'); await page.waitForTimeout(150);
  ok('recuadro del Rewind con los años', (await page.locator('#rwyear option').allInnerTexts()).join() === '2026,2025');
  ok('sin publicar', /Sin publicar/.test(await page.innerText('#rwbox')));

  const cards = await page.evaluate(() => rewindCards('2025'));
  const by = k => cards.find(c => c.kicker === k) || {};
  ok('números del año', by('El año en números').title === '5 partidos' && by('El año en números').lines[0].startsWith('⚽ 15 goles'), JSON.stringify(by('El año en números')));
  ok('Blanco contra Oscuro', by('Blanco contra Oscuro').title === '4 – 0');
  ok('pichichi', by('Pichichi').title === 'Bea' && by('Pichichi').big === '8 goles');
  ok('el fijo', by('El fijo').title === 'Ana, Bea, Carla y Dani' && by('El fijo').big === '5 de 5 partidos');
  ok('la racha', by('La racha').title === 'Ana y Bea' && by('La racha').big === '2 victorias seguidas', JSON.stringify(by('La racha')));
  ok('noches mágicas (hat-tricks)', by('Noches mágicas').title === '2 hat-tricks');
  ok('mayor goleada', by('La mayor goleada').title === '4 – 0');
  const squad = cards.filter(c => c.kind === 'squad').flatMap(c => c.cromos);
  ok('un cromo para cada uno con 4 o más partidos', squad.map(k => k.name).sort().join() === 'Ana,Bea,Carla,Dani,Edu', squad.map(k => k.name).join());
  ok('cada cromo con mote y números', squad.every(k => k.nick && /^\d+ partidos · \d+ gol(es)?/.test(k.stats)), JSON.stringify(squad));
  ok('Fran (1 partido) no tiene cromo pero se le echa de menos', !squad.some(k => k.name === 'Fran') && by('Se le echó de menos').title === 'Fran');

  // Historias
  await page.selectOption('#rwyear', '2025'); await page.click('#rwbox [data-rw]');
  ok('abre las historias', await page.isVisible('#rw') && /Pachanga Rewind 2025/i.test(await page.innerText('#rwcard')));
  ok('una barra por historia', (await page.locator('#rwbars i').count()) === cards.length);
  await page.click('#rwnext');
  ok('tocar a la derecha avanza', /El año en números/i.test(await page.innerText('#rwcard')));
  await page.click('#rwprev');
  ok('tocar a la izquierda vuelve', /Pachanga Rewind/i.test(await page.innerText('#rwcard')));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rwshare')]);
  ok('compartir esta (en el ordenador, se descarga)', dl.suggestedFilename() === 'pachanga-rewind-2025-1.png');
  ok('imagen vertical', (await page.evaluate(() => { const c = drawRewindCard(rw.cards[3], 3); return [c.width, c.height].join('x'); })) === '1080x1920');
  await page.keyboard.press('Escape');
  ok('Escape cierra', await page.isHidden('#rw'));

  // Publicar
  await page.click('#rwpub'); await page.waitForTimeout(100);
  ok('publicado', (await toastText(page)) === 'Rewind 2025 publicado: ya lo ven todos.' && (await page.evaluate(() => publishedRewind())) === '2025');
  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close();

  // ---------- Quien solo ve (servidor) ----------
  const view = async rewind => {
    const a = await open({ cloud: { players, matches, settings: { general: { groupName: 'Los del domingo', rewind } } }, mode: null, waitFor: '#t-stats' });
    await tab(a.page, 'stats'); await a.page.waitForTimeout(200); return a;
  };
  const v1 = await view(null);
  ok('sin publicar, los demás no lo ven', (await v1.page.locator('#rwbox *').count()) === 0);
  await v1.close();
  const v2 = await view('2025');
  ok('publicado, los demás ven el botón', /Pachanga Rewind 2025/i.test(await v2.page.innerText('#rwbox')) && (await v2.page.locator('#rwyear, #rwpub').count()) === 0);
  await v2.page.click('.rwopen');
  ok('y las historias', await v2.page.isVisible('#rw'));
  ok('sin errores (solo ver)', !v2.errors.length, v2.errors.join(' | '));
  await v2.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
