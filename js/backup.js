"use strict";
/* Copia de seguridad y borrado de todos los datos. No tocan la pantalla.
   Formato de la copia: { app: "pachangas", version: 1, exportedAt, settings, players: { id: jugador }, matches: { id: partido } } */

function buildBackup() {
  return {
    app: "pachangas", version: 1, exportedAt: new Date().toISOString(),
    settings: Object.assign({}, settings), players: rawPlayers,
    matches: Object.fromEntries(matches.map(m => { const c = Object.assign({}, m); delete c.id; return [m.id, c]; }))
  };
}
const backupFilename = () => `pachangas-copia-${todayIso()}.json`;

/** Comprueba que un objeto leído de un archivo es una copia de esta app. */
function isBackup(d) {
  const okId = k => /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(k);
  return !!(d && d.app === "pachangas" && d.players && typeof d.players === "object" && d.matches && typeof d.matches === "object"
    && Object.keys(d.players).every(okId) && Object.keys(d.matches).every(okId));
}

/** Sustituye jugadores, historial y ajustes por los de la copia. */
async function restoreBackup(data) {
  const pIds = Object.keys(data.players), mIds = Object.keys(data.matches);
  for (const id of pIds) await db.doc("players/" + id).set(data.players[id]);
  for (const id of Object.keys(rawPlayers)) if (!pIds.includes(id)) await db.doc("players/" + id).delete();
  for (const id of mIds) await db.doc("matches/" + id).set(data.matches[id]);
  for (const m of matches) if (!mIds.includes(m.id)) await db.doc("matches/" + m.id).delete();
  if (data.settings && typeof data.settings === "object") await db.doc("settings/general").set(data.settings);
  return { players: pIds.length, matches: mIds.length };
}

/** Borra jugadores, historial y ajustes, y deja la pizarra vacía. */
async function wipeAll() {
  for (const id of Object.keys(rawPlayers)) await db.doc("players/" + id).delete();
  for (const m of matches) await db.doc("matches/" + m.id).delete();
  await db.doc("settings/general").delete();
  Object.assign(st, { sel: [], date: null, datePast: false }); save();
  layout = {}; autoLoaded = false;
}
