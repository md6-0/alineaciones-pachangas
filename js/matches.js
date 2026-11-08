"use strict";
/* Reglas del historial: guardar la alineación como partido, el resultado y los goles.
   Cada partido se guarda con la fecha como id:
     { date, mode, formation: { W, D }, W: [jugador], D: [jugador], score: { W, D }, goals: { W: { id: n }, D: {…} }, fixedAt }
   y cada jugador del partido como { id, name, role: POR|DEF|MED|ATQ|SUP, x, y } (x e y vacíos en el banquillo).
   Los partidos antiguos pueden traer las medias (ovr, por): se ignoran y se borran al subir los datos. */

/** Foto de un equipo tal como está en la pizarra. */
function teamSnap(team) {
  return idsOf(team).map(id => {
    const L = layout[id];
    return { id, name: nameOf(id),
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
    date: id, mode: st.mode, formation: { W: FORMS[st.mode], D: FORMS[st.mode] },
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
