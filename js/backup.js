"use strict";
/* Copia de seguridad y borrado de todos los datos. No tocan la pantalla.
   Formato de la copia: { app: "pachangas", version: 1, exportedAt, settings, players: { id: jugador }, matches: { id: partido }, payments: { id del partido: pagos } } */

function buildBackup() {
  return {
    app: "pachangas", version: 1, exportedAt: new Date().toISOString(),
    settings: Object.assign({}, settings), players: rawPlayers,
    matches: Object.fromEntries(matches.map(m => { const c = Object.assign({}, m); delete c.id; return [m.id, c]; })),
    payments: Object.assign({}, payments)
  };
}
const backupFilename = () => `pachangas-copia-${todayIso()}.json`;

/** Comprueba que un objeto leído de un archivo es una copia de esta app. */
function isBackup(d) {
  const okId = k => /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(k);
  return !!(d && d.app === "pachangas" && d.players && typeof d.players === "object" && d.matches && typeof d.matches === "object"
    && Object.keys(d.players).every(okId) && Object.keys(d.matches).every(okId));
}

/** Jugador sin las notas de cuando había medias (atq, def, por). */
function cleanPlayer(v) { const c = Object.assign({}, v); delete c.atq; delete c.def; delete c.por; return c; }
/** Partido sin las medias de cada jugador (ovr, por). */
function cleanMatch(m) {
  const c = Object.assign({}, m);
  SIDES.forEach(t => { if (Array.isArray(c[t])) c[t] = c[t].map(pl => { const x = Object.assign({}, pl); delete x.ovr; delete x.por; return x; }); });
  return c;
}

/** Sustituye jugadores, historial y ajustes por los de la copia (sin las medias antiguas, que no se guardan). */
async function restoreBackup(data) {
  const pIds = Object.keys(data.players), mIds = Object.keys(data.matches);
  for (const id of pIds) await db.doc("players/" + id).set(cleanPlayer(data.players[id]));
  for (const id of Object.keys(rawPlayers)) if (!pIds.includes(id)) await db.doc("players/" + id).delete();
  for (const id of mIds) await db.doc("matches/" + id).set(cleanMatch(data.matches[id]));
  for (const m of matches) if (!mIds.includes(m.id)) await db.doc("matches/" + m.id).delete();
  if (data.settings && typeof data.settings === "object") await db.doc("settings/general").set(data.settings);
  // Pagos (las copias antiguas no los traen: entonces no se tocan)
  if (data.payments && typeof data.payments === "object") {
    const ok = /^[A-Za-z0-9_\-.~:@+]{1,200}$/, payIds = Object.keys(data.payments).filter(k => ok.test(k) && data.payments[k] && typeof data.payments[k] === "object");
    for (const id of payIds) await db.doc("payments/" + id).set(data.payments[id]);
    for (const id of Object.keys(payments)) if (!payIds.includes(id)) await db.doc("payments/" + id).delete();
  }
  return { players: pIds.length, matches: mIds.length };
}

/** Borra jugadores, historial, pagos, ajustes, la lista de apuntados y el próximo partido. */
async function wipeAll() {
  for (const id of Object.keys(signups)) await db.doc("signups/" + id).delete();
  for (const id of Object.keys(rawPlayers)) await db.doc("players/" + id).delete();
  for (const m of matches) await db.doc("matches/" + m.id).delete();
  for (const id of Object.keys(payments)) await db.doc("payments/" + id).delete();
  await db.doc("settings/general").delete();
  await db.doc("next/current").delete();
}
