"use strict";
/* Pestaña Estadísticas: goleadores, partidos jugados y G/E/P (los cálculos están en stats.js). */

/** Tarjeta con una tabla. cols: [[cabecera, clase, valor(fila)]]. Los empatados comparten puesto (key). */
function statCard(title, rows, key, cols, emptyText) {
  const rank = i => i > 0 && key(rows[i]) === key(rows[i - 1]) ? "" : i + 1;
  const body = rows.length
    ? rows.map((r, i) => `<tr><td class="pos">${rank(i)}</td><td class="n">${esc(r.name)}</td>${cols.map(([, cls, v]) => `<td${cls ? ` class="${cls}"` : ""}>${v(r)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="6" class="n none">${emptyText}</td></tr>`;
  return `<section class="scard"><h2>${title}</h2><table class="st"><thead><tr><th></th><th>Jugador</th>${cols.map(([h]) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${body}
    </tbody></table></section>`;
}

function renderStats() {
  const box = $("#stats");
  if (failed) { box.innerHTML = `<p class="hint">${LOAD_ERROR}</p>`; return; }
  if (!histLoaded) { box.innerHTML = '<p class="hint">Cargando estadísticas…</p>'; return; }
  if (!matches.length) { box.innerHTML = '<p class="hint">Aún no hay partidos. Guarda una alineación en el historial y apunta el resultado en Historial para ver las estadísticas.</p>'; return; }
  const { scorers, played, record, withResult } = computeStats(matches);
  const noResult = "Todavía no hay partidos con resultado.";
  box.innerHTML = `<div class="sgrid">
    ${statCard("Goleadores", scorers, r => r.avg + "/" + r.g, [["PJ", "", r => r.apps], ["Goles", "", r => r.g], ["Media", "big", r => fmtAvg(r.avg)]], "Todavía no hay goles apuntados.")}
    ${statCard("Partidos jugados", played, r => r.pj, [["PJ", "big", r => r.pj]], noResult)}
    ${statCard("Ganados, empatados y perdidos", record, r => r.w + "/" + r.l + "/" + r.d, [["G", "win", r => r.w], ["E", "", r => r.d], ["P", "", r => r.l]], noResult)}
  </div>
  <p class="hint stats-note">Partidos jugados y G/E/P cuentan solo los partidos con el resultado de los dos equipos apuntado (${withResult} de ${matches.length}); los suplentes de ese día cuentan como jugadores. Los goles cuentan siempre, y en Goleadores, PJ y la media de goles por partido cuentan todos los partidos en que estuvo convocado.</p>`;
}
