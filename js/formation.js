"use strict";
/* Colocación en la pizarra: huecos de cada formación, quién va a cada hueco y qué pasa al soltar un imán.
   Trabaja sobre layout (state.js) y no toca la pantalla. Coordenadas en % del campo: el Oscuro (D) arriba y el Blanco (W) abajo. */

/** Altura de una línea según su distancia a la portería propia. */
const yFor = (team, d) => team === "W" ? 100 - d : d;
/** Posición horizontal del jugador j de una línea de k: 1 → centro, 2 → 27/73, 3-4 → de 18 a 82, 5+ → de 10 a 90. */
const slotX = (j, k) => k === 1 ? 50 : k === 2 ? (j ? 73 : 27) : k >= 5 ? 10 + j * (80 / (k - 1)) : 18 + j * (64 / (k - 1));

/** Huecos de la formación del equipo: [{ role: "GK"|"DEF"|"MED"|"ATQ", x, y }]. */
function slotsFor(team, withGK = true) {
  const parts = st.form[team][st.mode].split("-").map(Number), lines = LINES[parts.length] || LINES[3], out = [];
  if (withGK) out.push({ role: "GK", x: 50, y: yFor(team, DIST.GK) });
  parts.forEach((k, i) => { const [role, d] = lines[i]; for (let j = 0; j < k; j++) out.push({ role, x: slotX(j, k), y: yFor(team, d) }); });
  return out;
}

/** Posición que corresponde a una altura del campo (para el rol de cada imán). */
function roleAt(team, y) {
  const d = team === "W" ? 100 - y : y;
  return d < 13 ? "POR" : d < 21 ? "DEF" : d < 40 ? "MED" : "ATQ";
}

/** Coloca a los jugadores de un equipo en su formación: el portero primero; después cada hueco para quien
    solo juega en esa posición, luego para quien la tiene entre las suyas, luego para quien no tiene ninguna,
    y si no, para cualquiera. Los que sobran van al banquillo. */
function place(team, players) {
  const slots = slotsFor(team);
  const pool = [...players];
  const filled = new Array(slots.length).fill(null);
  const gk = slots.findIndex(s => s.role === "GK");
  if (gk > -1 && pool.length) { const g = pickGK(pool); filled[gk] = g; pool.splice(pool.indexOf(g), 1); }
  const tests = [(p, r) => p.pos.length === 1 && p.pos[0] === r, (p, r) => p.pos.includes(r), p => !p.pos.length, () => true];
  for (const t of tests) {
    slots.forEach((s, i) => {
      if (filled[i] || s.role === "GK") return;
      const j = pool.findIndex(p => t(p, s.role));
      if (j > -1) { filled[i] = pool[j]; pool.splice(j, 1); }
    });
  }
  slots.forEach((s, i) => { if (filled[i]) layout[filled[i].id] = { team, zone: "pitch", x: s.x, y: s.y }; });
  pool.forEach(p => layout[p.id] = { team, zone: "bench" });
}

/** Reparto automático de los apuntados y su colocación (la alineación retocada está en next-match.js). */
function rebuild() {
  layout = {};
  const res = solve(P.filter(p => isSignedUp(p.id)));
  if (!res) return;
  place("W", res.A);
  place("D", res.B);
}

/* ---------- Consultas ---------- */

const idsOf = team => Object.keys(layout).filter(n => layout[n].team === team);
const onPitch = id => layout[id].zone === "pitch";
const pitchIds = team => Object.keys(layout).filter(n => onPitch(n) && (!team || layout[n].team === team));
const benchIds = team => Object.keys(layout).filter(n => !onPitch(n) && layout[n].team === team);
const hasLineup = () => Object.keys(layout).length > 0;
/** Id del que está en la portería del equipo, o undefined. */
const goalkeeperOf = team => idsOf(team).find(n => onPitch(n) && roleAt(team, layout[n].y) === "POR");

/** Huecos de la formación que no tienen a nadie cerca. */
function freeSlots(team) {
  const occ = Object.values(layout).filter(l => l.team === team && l.zone === "pitch");
  return slotsFor(team).filter(s => !occ.some(o => Math.abs(o.x - s.x) < 7 && Math.abs(o.y - s.y) < 5));
}

/* ---------- Mover jugadores ---------- */

/** Suelta un imán en el campo (x, y en %; ratio = alto/ancho del campo): salta al hueco más cercano de esa mitad
    (si es la otra, cambia de equipo). Si el hueco está ocupado, el que estaba pasa al sitio del que llega. */
function dropOnPitch(id, x, y, ratio) {
  const team = y >= 50 ? "W" : "D";
  const s = slotsFor(team).reduce((b, c) => { const dd = (c.x - x) ** 2 + ((c.y - y) * ratio) ** 2; return dd < b.d ? { s: c, d: dd } : b; }, { s: null, d: Infinity }).s;
  if (!s) return;
  const prev = Object.assign({}, layout[id]);
  const occ = Object.keys(layout).find(n => n !== id && layout[n].zone === "pitch" && layout[n].team === team && Math.abs(layout[n].x - s.x) < 4 && Math.abs(layout[n].y - s.y) < 4);
  layout[id] = { team, zone: "pitch", x: s.x, y: s.y };
  if (occ) layout[occ] = prev;
}

const dropOnBench = (id, team) => { layout[id] = { team, zone: "bench" }; };
