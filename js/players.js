"use strict";
/* Reglas de los jugadores: cómo se leen los guardados. No tocan la pantalla.
   Cada jugador guardado es { name, pos: ["DEF", …], order } y cada jugador calculado (en P y BY) es { id, n: nombre, pos, order }.
   No hay medias: las notas antiguas (atq, def, por) se ignoran y se borran al subir los datos (ver backup.js). */

/** Recalcula P, BY y rawPlayers a partir de los documentos guardados. */
function derivePlayers(docs) {
  rawPlayers = Object.fromEntries(docs.map(d => [d.id, Object.assign({}, d.data())]));
  P = docs.map(d => {
    const v = d.data() || {};
    const pos = Array.isArray(v.pos) ? v.pos.filter(x => POSITIONS.includes(x)) : [];
    return { id: d.id, n: v.name || d.id, pos, order: +v.order || 0 };
  }).sort((a, b) => a.order - b.order || a.n.localeCompare(b.n));
  BY = Object.fromEntries(P.map(p => [p.id, p]));
}

/** Id para un jugador nuevo a partir de su nombre: «Íñigo Pérez» → inigo-perez-x7k2. */
function playerId(name) {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "jugador";
  return slug + "-" + Math.random().toString(36).slice(2, 6);
}

/* ---------- Cambios (se guardan en db; la pantalla se actualiza sola al llegar el aviso) ---------- */

/** Añade un jugador sin posiciones, al final de la lista. */
function addPlayer(name) {
  const order = P.reduce((a, p) => Math.max(a, p.order), 0) + 1;
  return db.doc("players/" + playerId(name)).set({ name, pos: [], order });
}

const playerQueues = {};
/** Guarda un cambio de un jugador. Los cambios de un mismo jugador van en fila, uno detrás de otro. */
function updatePlayer(id, patch) {
  const p = (playerQueues[id] || Promise.resolve()).then(() => db.doc("players/" + id).update(patch));
  playerQueues[id] = p.catch(() => {});   // un fallo no bloquea los cambios siguientes
  return p;
}

/** Quita a un jugador (y de la lista de apuntados, si estaba). */
const removePlayer = id => (signups[id] ? signOff(id) : Promise.resolve()).then(() => db.doc("players/" + id).delete());

/** Posiciones del jugador tras marcar o desmarcar una. */
const toggledPositions = (p, r) => p.pos.includes(r) ? p.pos.filter(x => x !== r) : [...p.pos, r];
