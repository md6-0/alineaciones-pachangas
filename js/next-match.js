"use strict";
/* Próximo partido: la lista de apuntados y la alineación que ve todo el mundo. No toca la pantalla.
   signups/{id del jugador} = { at: cuándo se apuntó (ISO) }   (solo lo cambia quien organiza; la lista va por orden de llegada)
   next/current = { date, time, mode, layout }   (solo lo cambia quien organiza)
     Día, hora y formato del partido y, si quien organiza ha retocado la alineación, su colocación (layout).
     Sin retocar, layout es null y la alineación sale sola a partir de los apuntados. */

let signups = {};          // id → { at, uid }
let signupsLoaded = false;
let savedLayout = null;    // colocación retocada por quien organiza (next/current.layout), o null

/** Apuntados que siguen en la lista de jugadores, por orden de llegada. */
const signupIds = () => Object.keys(signups).filter(id => BY[id])
  .sort((a, b) => String(signups[a].at).localeCompare(String(signups[b].at)) || a.localeCompare(b));
const isSignedUp = id => !!signups[id] && !!BY[id];

/** Copia en st lo que llega del servidor (next/current; {} si todavía no existe). */
function applyNext(d) {
  d = d || {};
  if (FORMS[d.mode]) st.mode = d.mode;
  st.date = typeof d.date === "string" && ISO_DATE.test(d.date) ? d.date : null;
  st.time = /^\d\d:\d\d$/.test(d.time || "") ? d.time : null;
  savedLayout = d.layout && typeof d.layout === "object" ? d.layout : null;
}

/** Guarda el partido (día, hora, formato y colocación) para todos. */
function saveNext() {
  return db.doc("next/current").set({ date: st.date, time: st.time, mode: st.mode, layout: savedLayout ? clone(savedLayout) : null });
}

/* ---------- Alineación ---------- */

/** Pone en la pizarra a los apuntados: la colocación retocada (con los nuevos en un hueco libre) o, si no hay, el reparto automático. */
function syncBoard() {
  if (!savedLayout) { rebuild(); return; }
  layout = {};
  const ids = signupIds();
  ids.forEach(id => {
    const L = savedLayout[id];
    if (!L || !SIDES.includes(L.team)) return;
    layout[id] = L.zone === "pitch" && isFinite(L.x) && isFinite(L.y) ? { team: L.team, zone: "pitch", x: +L.x, y: +L.y } : { team: L.team, zone: "bench" };
  });
  ids.filter(id => !layout[id]).forEach(addToBoard);
}

/** Mete a un apuntado nuevo en el equipo con menos jugadores: en un hueco libre de su posición, si no en cualquiera, y si no al banquillo. */
function addToBoard(id) {
  const p = BY[id], team = idsOf("W").length <= idsOf("D").length ? "W" : "D";
  const free = freeSlots(team), fits = s => p.pos.includes(s.role === "GK" ? "POR" : s.role);
  const s = free.find(fits) || free.find(x => x.role !== "GK") || free[0];
  layout[id] = s ? { team, zone: "pitch", x: s.x, y: s.y } : { team, zone: "bench" };
}

/** La alineación tal como está ahora pasa a ser la retocada (la ven todos). */
function keepBoard() { savedLayout = clone(layout); return saveNext(); }

/** Cambia el formato: el reparto vuelve a salir solo. */
function setMode(mode) { st.mode = mode; savedLayout = null; syncBoard(); return saveNext(); }

/** Día (ISO o null para hoy) y hora ("12:00" o null) del partido. */
function setMatchDate(iso) { st.date = iso && ISO_DATE.test(iso) ? iso : null; return saveNext(); }
function setMatchTime(t) { st.time = /^\d\d:\d\d$/.test(t || "") ? t : null; return saveNext(); }

/* ---------- Lista ---------- */

/** Apunta a un jugador al final de la lista, o lo quita. */
const signUp = id => db.doc("signups/" + id).set({ at: new Date().toISOString() });
const signOff = id => db.doc("signups/" + id).delete();

/** Vacía la lista para el siguiente partido (y la alineación vuelve a salir sola). */
async function clearSignups() {
  for (const id of Object.keys(signups)) await signOff(id);
  savedLayout = null;
  await saveNext();
}
