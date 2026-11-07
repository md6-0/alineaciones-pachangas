"use strict";
/* Reglas de las estadísticas: goles, partidos jugados y ganados, empatados y perdidos de cada jugador. No tocan la pantalla.
   Partidos y G/E/P cuentan solo los partidos con el resultado de los dos equipos (los suplentes cuentan como jugadores);
   los goles cuentan siempre. Por eso la media de goles se calcula sobre todos los partidos en que estuvo convocado (apps),
   tengan resultado o no. */

function computeStats(list) {
  const S = {};
  const get = (id, name) => S[id] || (S[id] = { id, name, g: 0, apps: 0, pj: 0, w: 0, d: 0, l: 0 });
  let withResult = 0;
  list.forEach(m => {
    const sc = m.score || {}, has = matchResult(m) !== null;
    if (has) withResult++;
    SIDES.forEach(team => {
      (Array.isArray(m[team]) ? m[team] : []).forEach(pl => {
        const r = get(pl.id, pl.name);
        r.apps++;
        if (!has) return;
        r.pj++;
        const mine = sc[team], theirs = sc[other(team)];
        if (mine > theirs) r.w++; else if (mine < theirs) r.l++; else r.d++;
      });
      const g = (m.goals && m.goals[team]) || {};
      Object.keys(g).forEach(id => { if (g[id] > 0) get(id, id).g += g[id]; });
    });
  });
  // El nombre actual si el jugador sigue en la lista; si no, el del partido
  const rows = Object.values(S).map(r => Object.assign(r, { name: BY[r.id] ? BY[r.id].n : r.name, avg: r.g / Math.max(r.apps, 1) }));
  const byName = (a, b) => a.name.localeCompare(b.name);
  return {
    withResult,
    // Goleadores: por media de goles por partido; a igual media, más goles y luego el nombre
    scorers: rows.filter(r => r.g > 0).sort((a, b) => b.avg - a.avg || b.g - a.g || byName(a, b)),
    played: rows.filter(r => r.pj > 0).sort((a, b) => b.pj - a.pj || byName(a, b)),
    record: rows.filter(r => r.pj > 0).sort((a, b) => b.w - a.w || a.l - b.l || b.d - a.d || byName(a, b))
  };
}

/** Puesto de cada goleador (lista ya ordenada): los empatados en media y goles comparten puesto (1, 2, 2, 4…). */
const scoreRanks = rows => rows.map(r => rows.findIndex(x => x.avg === r.avg && x.g === r.g) + 1);

/** Media con dos decimales y coma: 1,50. */
const fmtAvg = v => v.toFixed(2).replace(".", ",");
