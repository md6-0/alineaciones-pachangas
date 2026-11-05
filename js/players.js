"use strict";
/* Reglas de los jugadores: cómo se leen los guardados y cómo se calcula su media. No tocan la pantalla.
   Cada jugador calculado (en P y BY) es:
     { id, n: nombre, s: [atq, def], por, pos: ["DEF", …], vals: { atq, def, por }, order, m: media exacta, ovr: media redondeada hacia arriba } */

const rating = v => clamp(+v || 1, 1, 99);

/** Media según la posición: el portero usa POR; el resto pondera ataque y defensa (ATQ_W).
    Con varias posiciones se promedian; sin ninguna, cuenta como jugador de campo 50/50. */
function weighted(atq, def, por, pos) {
  const rate = r => r === "POR" ? por : atq * ATQ_W[r] + def * (1 - ATQ_W[r]);
  return pos.length ? pos.reduce((a, r) => a + rate(r), 0) / pos.length : (atq + def) / 2;
}

/** Recalcula P, BY y rawPlayers a partir de los documentos guardados. */
function derivePlayers(docs) {
  rawPlayers = Object.fromEntries(docs.map(d => [d.id, Object.assign({}, d.data())]));
  P = docs.map(d => {
    const v = d.data() || {};
    const s = [v.atq, v.def].map(rating);
    const pos = Array.isArray(v.pos) ? v.pos.filter(x => POSITIONS.includes(x)) : [];
    const por = clamp(+v.por || 70, 1, 99);
    const p = { id: d.id, n: v.name || d.id, s, pos, por, vals: { atq: s[0], def: s[1], por }, order: +v.order || 0 };
    p.m = weighted(s[0], s[1], por, pos); p.ovr = Math.ceil(p.m);
    return p;
  }).sort((a, b) => a.order - b.order || a.n.localeCompare(b.n));
  BY = Object.fromEntries(P.map(p => [p.id, p]));
}

/** Id para un jugador nuevo a partir de su nombre: «Íñigo Pérez» → inigo-perez-x7k2. */
function playerId(name) {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "jugador";
  return slug + "-" + Math.random().toString(36).slice(2, 6);
}

/* ---------- Cambios (se guardan en db; la pantalla se actualiza sola al llegar el aviso) ---------- */

/** Añade un jugador con 70 en todo, al final de la lista. */
function addPlayer(name) {
  const order = P.reduce((a, p) => Math.max(a, p.order), 0) + 1;
  return db.doc("players/" + playerId(name)).set({ name, atq: 70, def: 70, por: 70, pos: [], order });
}

const playerQueues = {};
/** Guarda un cambio de un jugador. Los cambios de un mismo jugador van en fila, uno detrás de otro. */
function updatePlayer(id, patch) {
  const p = (playerQueues[id] || Promise.resolve()).then(() => db.doc("players/" + id).update(patch));
  playerQueues[id] = p.catch(() => {});   // un fallo no bloquea los cambios siguientes
  return p;
}

const removePlayer = id => db.doc("players/" + id).delete();

/** Posiciones del jugador tras marcar o desmarcar una. */
const toggledPositions = (p, r) => p.pos.includes(r) ? p.pos.filter(x => x !== r) : [...p.pos, r];
