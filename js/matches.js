"use strict";
/* Reglas del historial: guardar la alineación como partido, el resultado y los goles, y volver a cargarla en la pizarra.
   Cada partido se guarda con la fecha como id:
     { date, mode, formation: { W, D }, W: [jugador], D: [jugador], score: { W, D }, goals: { W: { id: n }, D: {…} }, fixedAt }
   y cada jugador del partido como { id, name, ovr, por, role: POR|DEF|MED|ATQ|SUP, x, y } (x e y vacíos en el banquillo). */

/** Foto de un equipo tal como está en la pizarra. */
function teamSnap(team) {
  return idsOf(team).map(id => {
    const L = layout[id], p = BY[id];
    return { id, name: nameOf(id), ovr: p ? p.ovr : null, por: p ? p.por : null,
      role: L.zone === "bench" ? "SUP" : roleAt(team, L.y),
      x: L.zone === "pitch" ? Math.round(L.x * 10) / 10 : null, y: L.zone === "pitch" ? Math.round(L.y * 10) / 10 : null };
  });
}

const matchById = id => matches.find(m => m.id === id);
/** Partido ya guardado para el día del partido, si lo hay. */
const matchOfDay = () => matchById(isoDate(matchDay()));

/** Guarda la pizarra como el partido del día (sustituye al que hubiera, conservando su resultado). */
function saveLineup() {
  const id = isoDate(matchDay()), prev = matchById(id);
  return db.doc("matches/" + id).set({
    date: id, mode: st.mode, formation: { W: st.form.W[st.mode], D: st.form.D[st.mode] },
    W: teamSnap("W"), D: teamSnap("D"), score: prev && prev.score ? prev.score : { W: null, D: null }, fixedAt: new Date().toISOString()
  });
}

const matchQueues = {};
/** Los cambios de un mismo partido van en fila, uno detrás de otro. */
function queueMatch(id, fn) {
  const p = (matchQueues[id] || Promise.resolve()).then(fn);
  matchQueues[id] = p.catch(() => {});
  return p;
}

/** Goles de un equipo (null para dejarlo sin apuntar). */
const setScore = (id, team, v) => queueMatch(id, () => db.doc("matches/" + id).update({ score: { [team]: v } }));

/** Suma o quita un gol a un jugador; el marcador de su equipo cambia con él. */
function changeGoal(mid, team, pid, delta) {
  return queueMatch(mid, () => {
    const m = matchById(mid); if (!m) return;
    const cur = ((m.goals && m.goals[team]) || {})[pid] || 0;
    if (delta < 0 && cur <= 0) return;
    const sc = m.score && typeof m.score[team] === "number" ? m.score[team] : 0;
    return db.doc("matches/" + mid).update({ goals: { [team]: { [pid]: cur + delta } }, score: { [team]: Math.max(0, sc + delta) } });
  });
}

const deleteMatch = id => db.doc("matches/" + id).delete();

/** Resultado de un partido: "W", "D", "draw" o null si falta algún marcador. */
function matchResult(m) {
  const sc = m.score || {}, w = sc.W, d = sc.D;
  if (typeof w !== "number" || typeof d !== "number") return null;
  return w > d ? "W" : d > w ? "D" : "draw";
}

/** Media de un equipo del partido, con la nota POR para el portero (null si no hay medias). */
function snapMean(list) {
  const field = list.filter(p => typeof p.ovr === "number");
  return field.length ? Math.ceil(field.reduce((a, p) => a + (p.role === "POR" && typeof p.por === "number" ? p.por : p.ovr), 0) / field.length) : null;
}

/** Pone un partido en la pizarra: formato, formaciones, convocatoria y colocación.
    Cada línea se recoloca en los huecos actuales, conservando el orden de izquierda a derecha.
    Devuelve cuántos jugadores del partido ya no están en la lista. */
function applyMatch(m) {
  const mode = FORMS[m.mode] ? m.mode : "7";
  st.mode = mode;
  SIDES.forEach(t => { const f = m.formation && m.formation[t]; if (f && FORMS[mode].includes(f)) st.form[t][mode] = f; });
  layout = {}; let missing = 0; const sel = [];
  SIDES.forEach(team => {
    (Array.isArray(m[team]) ? m[team] : []).forEach(pl => {
      const id = pl.id;
      if (!BY[id]) { missing++; return; }
      sel.push(id);
      if (pl.role === "SUP" || typeof pl.x !== "number" || typeof pl.y !== "number") layout[id] = { team, zone: "bench" };
      else { const r = pl.role === "POR" ? "GK" : (DIST[pl.role] !== undefined ? pl.role : null); layout[id] = { team, zone: "pitch", x: pl.x, y: r ? yFor(team, DIST[r]) : pl.y }; }
    });
  });
  SIDES.forEach(team => ["GK", "DEF", "MED", "ATQ"].forEach(r => {
    const y = yFor(team, DIST[r]);
    const row = Object.keys(layout).filter(k => layout[k].team === team && layout[k].zone === "pitch" && layout[k].y === y).sort((a, b) => layout[a].x - layout[b].x);
    row.forEach((k, j) => { layout[k].x = slotX(j, row.length); });
  }));
  st.sel = sel; seed = 0;
  return missing;
}
