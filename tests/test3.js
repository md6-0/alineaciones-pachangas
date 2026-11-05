/* Arrastrar imanes: al banquillo, de vuelta al campo (salta al hueco libre), intercambio y cambio de equipo. */
const { open, checker } = require('./helpers');
const { ok, done } = checker();

(async () => {
  const app = await open({ viewport: { width: 1280, height: 1800 } }), { page } = app;
  const center = async loc => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  async function dragTo(loc, x, y) {
    const a = await center(loc.locator('.disc'));
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(a.x + 10, a.y + 10, { steps: 3 });
    await page.mouse.move(x, y, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(50);
  }
  const team = id => page.locator(`.mag[data-n="${id}"]`).getAttribute('class');

  const m = page.locator('#board .mag.W').first(), id = await m.getAttribute('data-n');
  const bench = await center(page.locator('#teams .bench[data-team=W]'));
  await dragTo(m, bench.x, bench.y);
  ok('al banquillo del Blanco', (await page.locator(`#teams .bench[data-team=W] .mag[data-n="${id}"]`).count()) === 1);
  ok('deja un hueco en el campo', (await page.locator('#board .slot').count()) === 1);
  ok('6 en el campo del Blanco', /6 en el campo/.test(await page.locator('#teams .sec.team.W .tsub').innerText()));

  // De vuelta al hueco libre
  const slot = await center(page.locator('#board .slot'));
  await dragTo(page.locator(`.mag[data-n="${id}"]`), slot.x + 6, slot.y + 4);
  ok('vuelve al campo', (await page.locator(`#board .mag[data-n="${id}"]`).count()) === 1 && (await page.locator('#board .slot').count()) === 0);

  // Intercambio con otro del mismo equipo
  const other = page.locator('#board .mag.W').nth(3), oid = await other.getAttribute('data-n');
  const posOf = n => page.locator(`#board .mag[data-n="${n}"]`).evaluate(e => e.style.left + ' ' + e.style.top);
  const p1 = await posOf(id), p2 = await posOf(oid);
  const to = await center(other.locator('.disc'));
  await dragTo(page.locator(`#board .mag[data-n="${id}"]`), to.x, to.y);
  ok('intercambian el sitio', (await posOf(id)) === p2 && (await posOf(oid)) === p1, `${await posOf(id)} / ${await posOf(oid)}`);

  // Soltar en la otra mitad: cambia de equipo
  const board = await page.locator('#board').boundingBox();
  await dragTo(page.locator(`#board .mag[data-n="${id}"]`), board.x + board.width * 0.5, board.y + board.height * 0.2);
  ok('cambia al Oscuro', /\bD\b/.test(await team(id)));
  ok('el que ocupaba ese sitio pasa al Blanco (7 y 7)', (await page.locator('#board .mag.D').count()) === 7 && (await page.locator('#board .mag.W').count()) === 7);

  // Un clic sin mover no hace nada
  const before = await page.innerHTML('#board');
  const c = await center(page.locator('#board .mag').first().locator('.disc'));
  await page.mouse.click(c.x, c.y);
  ok('clic sin arrastrar no cambia nada', (await page.innerHTML('#board')) === before);

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
