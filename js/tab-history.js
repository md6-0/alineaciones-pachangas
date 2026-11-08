"use strict";
/* Pestaña Historial: los partidos guardados, con el resultado y los goles de cada jugador.
   Quien organiza apunta resultados y goles, y borra partidos; los demás solo los ven. */

const RESULT = { W: '<span class="res W">Gana Blanco</span>', D: '<span class="res D">Gana Oscuro</span>', draw: '<span class="res">Empate</span>' };

function goalsHTML(m, team, list) {
  const g = (m.goals && m.goals[team]) || {};
  const scorers = Object.keys(g).filter(k => g[k] > 0).sort((a, b) => g[b] - g[a]);
  const nm = id => { const pl = list.find(p => p.id === id); return pl ? pl.name : nameOf(id); };
  const ed = canEdit();
  const chips = scorers.map(id => `<span class="gchip">⚽ ${esc(nm(id))}${g[id] > 1 ? ` <b>×${g[id]}</b>` : ""}${ed ? `<button type="button" data-gdel="${esc(id)}" aria-label="Quitar un gol de ${esc(nm(id))}">−</button>` : ""}</span>`).join("");
  if (!ed && !scorers.length) return "";
  return `<div class="goals" data-team="${team}"><span class="gl">GOLES</span>
    ${scorers.length ? `<div class="gchips">${chips}</div>` : ""}
    ${ed ? `<div class="gadd"><select data-gsel aria-label="Goleador del ${TEAMS[team]}"><option value="">Elige jugador…</option>${list.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select><button type="button" data-gadd>+ Gol</button></div>` : ""}
  </div>`;
}

function mteamHTML(m, team) {
  const list = Array.isArray(m[team]) ? m[team] : [];
  const lines = ROLE_ORDER.map(r => {
    const ps = list.filter(p => p.role === r);
    return ps.length ? `<div class="mline"><span class="r">${r}</span><span>${ps.map(p => esc(p.name)).join(", ")}</span></div>` : "";
  }).join("");
  return `<div class="mteam ${team}"><h3><span class="l"><span class="sw ${team}"></span>${TEAMS[team]}</span></h3>${lines || '<p class="hint">Sin jugadores</p>'}${goalsHTML(m, team, list)}</div>`;
}

function matchHTML(m) {
  const sc = m.score || {}, w = sc.W, d = sc.D, res = matchResult(m);
  const f = m.formation || {}, mode = esc(m.mode || "7");
  // Quien solo ve, el marcador como texto
  const goalsInput = (team, v, label) => canEdit()
    ? `<input type="number" inputmode="numeric" min="0" max="99" data-s="${team}" value="${typeof v === "number" ? v : ""}" aria-label="Goles del ${label}">`
    : `<b class="sval">${typeof v === "number" ? v : "–"}</b>`;
  return `<article class="match" data-id="${esc(m.id)}">
      <div class="mhead">
        <div><p class="mdate">${esc(fmtDate(m.date || m.id))}</p><p class="msub">${mode} vs ${mode} · Blanco ${esc(f.W || "—")} · Oscuro ${esc(f.D || "—")}</p></div>
        <div class="score">Blanco ${goalsInput("W", w, "Equipo Blanco")}<span class="dash">–</span>${goalsInput("D", d, "Equipo Oscuro")} Oscuro ${res ? RESULT[res] : '<span class="res">Sin resultado</span>'}</div>
      </div>
      <div class="mteams">${mteamHTML(m, "W")}${mteamHTML(m, "D")}</div>
      <div class="mfoot edit-only"><button type="button" class="del" data-mdel>Borrar partido</button></div>
    </article>`;
}

function renderHistory() {
  const box = $("#hlist");
  if (failed) { box.innerHTML = `<p class="hint">${LOAD_ERROR}</p>`; return; }
  if (!histLoaded) { box.innerHTML = '<p class="hint">Cargando historial…</p>'; return; }
  const ae = document.activeElement;
  if (box.contains(ae) && ae.tagName === "INPUT") return;   // no repintar mientras se escribe un resultado
  if (!matches.length) { box.innerHTML = `<p class="hint">${canEdit() ? 'Aún no hay partidos. Después de jugar, pulsa "Partido jugado" en la pestaña Partido: el partido aparecerá aquí para apuntar el resultado y los goles.' : "Aún no hay partidos."}</p>`; return; }
  box.innerHTML = matches.map(matchHTML).join("");
}

/* ---------- Acciones ---------- */

const hlist = $("#hlist");
hlist.addEventListener("change", e => {
  const inp = e.target.closest("input[data-s]"); if (!inp) return;
  const id = inp.closest(".match").dataset.id;
  let v = inp.value === "" ? null : clamp(Math.round(+inp.value), 0, 99);
  if (v !== null && !isFinite(v)) v = null;
  inp.value = v === null ? "" : v;
  setScore(id, inp.dataset.s, v).catch(() => toast("No se pudo guardar el resultado."));
});
hlist.addEventListener("focusout", () => {
  setTimeout(() => { if (!hlist.contains(document.activeElement)) renderHistory(); }, 50);
});
hlist.addEventListener("click", e => {
  const ga = e.target.closest("[data-gadd]"), gd = e.target.closest("[data-gdel]");
  if (ga || gd) {
    const box = (ga || gd).closest(".goals"), team = box.dataset.team, mid = box.closest(".match").dataset.id;
    const pid = ga ? box.querySelector("[data-gsel]").value : gd.dataset.gdel;
    if (!pid) { toast("Elige quién marcó el gol."); return; }
    changeGoal(mid, team, pid, ga ? 1 : -1).catch(() => toast("No se pudo guardar el gol."));
    return;
  }
  const del = e.target.closest("[data-mdel]");
  if (del && confirmFirst(del, "¿Seguro?", 3000)) deleteMatch(del.closest(".match").dataset.id).catch(() => toast("No se pudo borrar el partido."));
});
