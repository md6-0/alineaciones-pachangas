/* Opciones: nombre del grupo, fecha del partido, copia de seguridad (descargar, restaurar, archivo no válido) y borrar todo. */
const { open, checker, tab, toastText } = require('./helpers');
const fs = require('fs'), os = require('os'), path = require('path');
const { ok, done } = checker();

(async () => {
  const app = await open(), { page } = app;
  await tab(page, 'opc');
  ok('título', (await page.textContent('#h1')) === 'Opciones');
  ok('versión', /^Mi pachanga · versión \d+\.\d+\.\d+$/.test(await page.innerText('#appver span')));

  // Nombre del grupo
  await page.fill('#groupname', '  Los del jueves  '); await page.press('#groupname', 'Tab');
  ok('nombre del grupo', (await page.textContent('#eyebrow')) === 'Los del jueves');
  await page.fill('#groupname', ''); await page.press('#groupname', 'Tab');
  ok('vacío vuelve al de por defecto', (await page.textContent('#eyebrow')) === 'Mi pachanga ⚽');
  await page.fill('#groupname', 'Los del jueves'); await page.press('#groupname', 'Tab');

  // Fecha (arriba en Partido; ya no está en Opciones)
  ok('día y hora fuera de Opciones', !(await page.locator('#p-opc #matchdate, #p-opc #matchtime').count()));
  await tab(page, 'alin');
  await page.fill('#matchdate', '2099-01-02'); await page.dispatchEvent('#matchdate', 'change');
  ok('fecha elegida', (await page.inputValue('#matchdate')) === '2099-01-02' && await page.isVisible('#datereset'));
  await page.click('#datereset');
  ok('Hoy', await page.isHidden('#datereset'));

  // Guardar un partido para que la copia tenga historial
  await page.click('#fix'); await page.click('#fix'); await page.waitForTimeout(200); await tab(page, 'opc');

  // Descargar copia
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bk-down')]);
  ok('nombre del archivo', /^pachangas-copia-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  const file = path.join(os.tmpdir(), 'pach-copia-' + process.pid + '.json');
  await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok('contenido de la copia', data.app === 'pachangas' && data.version === 1 && Object.keys(data.players).length === 24 && Object.keys(data.matches).length === 1 && data.settings.groupName === 'Los del jueves');
  ok('aviso de copia', (await toastText(page)) === 'Copia guardada: 24 jugadores y 1 partido.', await toastText(page));

  // Archivo no válido
  const bad = path.join(os.tmpdir(), 'pach-mala-' + process.pid + '.json');
  fs.writeFileSync(bad, '{"app":"otra"}');
  await page.setInputFiles('#bk-file', bad); await page.waitForTimeout(100);
  ok('archivo no válido', (await toastText(page)) === 'Ese archivo no es una copia de esta página.');

  // Borrar todo
  await page.click('#wipe');
  ok('borrar pide confirmación', (await page.innerText('#wipe')) === 'Sí, borrar todo');
  await page.click('#wipe'); await page.waitForTimeout(200);
  ok('datos borrados', (await toastText(page)) === 'Datos borrados.');
  ok('grupo por defecto', (await page.textContent('#eyebrow')) === 'Mi pachanga ⚽');
  await tab(page, 'alin');
  ok('pizarra vacía', (await page.locator('#board .mag').count()) === 0 && /Todavía no hay jugadores/.test(await page.innerText('#teams')));
  await tab(page, 'hist');
  ok('historial vacío', /Aún no hay partidos/.test(await page.innerText('#hlist')));
  await page.reload(); await page.waitForSelector('#t-alin');
  await page.waitForTimeout(100);
  ok('tras recargar no vuelve la plantilla de ejemplo', (await page.locator('#slist .sname').count()) === 0 && (await page.locator('#saddsel option').count()) === 1);

  // Restaurar copia
  await tab(page, 'opc');
  await page.setInputFiles('#bk-file', file); await page.waitForTimeout(100);
  ok('resumen de la copia', /24 jugadores y 1 partido\. Al confirmar/.test(await page.innerText('#bk-msg')));
  ok('pide confirmar', (await page.innerText('#bk-up')) === 'Confirmar restauración');
  await page.click('#bk-up'); await page.waitForTimeout(300);
  ok('restaurada', (await toastText(page)) === 'Copia restaurada: 24 jugadores y 1 partido.', await toastText(page));
  ok('grupo restaurado', (await page.textContent('#eyebrow')) === 'Los del jueves');
  await tab(page, 'hist');
  ok('historial restaurado', (await page.locator('#hlist .match').count()) === 1);
  await tab(page, 'alin');
  ok('jugadores restaurados', (await page.locator('#saddsel option').count()) === 25);

  ok('sin errores', !app.errors.length, app.errors.join(' | '));
  fs.rmSync(file, { force: true }); fs.rmSync(bad, { force: true });
  await app.close(); done();
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });
