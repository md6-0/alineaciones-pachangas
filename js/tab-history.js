"use strict";
/* Pestaña Historial: los partidos guardados, con el resultado, los goles de cada jugador y el MVP.
   Quien organiza apunta resultados, goles y MVP, y borra partidos; los demás solo los ven. */

const RESULT = { W: '<span class="res W">Gana Blanco</span>', D: '<span class="res D">Gana Oscuro</span>', draw: '<span class="res">Empate</span>' };

function goalsHTML(m, team, list) {
  const g = (m.goals && m.goals[team]) || {};
  const scorers = Object.keys(g).filter(k => g[k] > 0).sort((a, b) => g[b] - g[a]);
  const nm = id => { const pl = list.find(p => p.id === id); return pl ? pl.name : nameOf(id); };
  const ed = canEdit();
  const chips = scorers.map(id => `<span class="gchip">⚽ ${esc(nm(id))}${g[id] > 1 ? ` <b>×${g[id]}</b>` : ""}${ed ? `<button type="button" data-gdel="${esc(id)}" aria-label="Quitar un gol de ${esc(nm(id))}">−</button><button type="button" data-ginc="${esc(id)}" aria-label="Otro gol de ${esc(nm(id))}">+</button>` : ""}</span>`).join("");
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

/** MVP del partido: quien organiza lo elige entre los que jugaron; los demás ven solo la insignia (si lo hay). */
function mvpHTML(m) {
  const all = [...(Array.isArray(m.W) ? m.W : []), ...(Array.isArray(m.D) ? m.D : [])].sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
  const cur = all.find(p => p.id === m.mvp), name = cur ? cur.name : (m.mvp ? nameOf(m.mvp) : "");
  if (!canEdit()) return m.mvp ? `<div class="mvp"><span class="mvpl">MVP</span><span class="mvpname">${esc(name)}</span></div>` : "";
  return `<div class="mvp"><span class="mvpl">MVP</span><select data-mvp aria-label="MVP del partido"><option value="">Sin elegir…</option>${all.map(p => `<option value="${esc(p.id)}"${p.id === m.mvp ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div>`;
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
      ${mvpHTML(m)}
      <div class="mfoot edit-only"><button type="button" class="btn ghost" data-mload>Cargar en la pizarra</button><button type="button" class="del" data-mdel>Borrar partido</button></div>
    </article>`;
}

/* ---------- Calendario: un mes con los días de partido marcados (toca uno para ir a su tarjeta) ---------- */

const MONTHS_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
let calMonth = null;   // "AAAA-MM" del mes que se ve; null = el del último partido (o el de hoy)
const matchDate = m => String(m.date || m.id).slice(0, 10);

function renderCalendar() {
  const box = $("#cal");
  if (failed || !histLoaded || !matches.length) { box.innerHTML = ""; return; }
  const byDay = {};
  matches.forEach(m => (byDay[matchDate(m)] = byDay[matchDate(m)] || []).push(m));
  const days = Object.keys(byDay).sort();
  if (!calMonth) calMonth = (days[days.length - 1] || todayIso()).slice(0, 7);
  const [y, mo] = calMonth.split("-").map(Number), first = new Date(y, mo - 1, 1);
  const lead = (first.getDay() + 6) % 7, total = new Date(y, mo, 0).getDate(), today = todayIso();
  const key = n => `${calMonth}-${String(n).padStart(2, "0")}`;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="cd empty"></span>');
  for (let n = 1; n <= total; n++) {
    const ms = byDay[key(n)], cls = ["cd"];
    if (key(n) === today) cls.push("today");
    if (!ms) { cells.push(`<span class="${cls.join(" ")}">${n}</span>`); continue; }
    const r = matchResult(ms[0]);
    cls.push("has", r || "none");
    cells.push(`<button type="button" class="${cls.join(" ")}" data-cday="${key(n)}" aria-label="Partido del ${esc(fmtDate(key(n)))}${ms.length > 1 ? ` (${ms.length})` : ""}">${n}</button>`);
  }
  const inMonth = days.filter(d => d.startsWith(calMonth)).length;
  box.innerHTML = `<div class="calhead"><button type="button" class="cnav" data-cnav="-1" aria-label="Mes anterior">‹</button>
    <h2>${MONTHS_FULL[mo - 1]} ${y}<small>${inMonth ? cnt(inMonth, "partido", "partidos") : "Sin partidos"}</small></h2>
    <button type="button" class="cnav" data-cnav="1" aria-label="Mes siguiente">›</button></div>
    <div class="cgrid">${["L", "M", "X", "J", "V", "S", "D"].map(d => `<span class="cw">${d}</span>`).join("")}${cells.join("")}</div>
    <p class="clegend"><i class="W"></i>Gana Blanco <i class="D"></i>Gana Oscuro <i class="draw"></i>Empate <i class="none"></i>Sin resultado</p>`;
}

function renderHistory() {
  renderCalendar();
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
  const mv = e.target.closest("select[data-mvp]");
  if (mv) { setMvp(mv.closest(".match").dataset.id, mv.value).catch(() => toast("No se pudo guardar el MVP.")); return; }
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
$("#cal").addEventListener("click", e => {
  const nav = e.target.closest("[data-cnav]");
  if (nav) {
    const [y, mo] = calMonth.split("-").map(Number), d = new Date(y, mo - 1 + Number(nav.dataset.cnav), 1);
    calMonth = isoDate(d).slice(0, 7); renderCalendar(); return;
  }
  const day = e.target.closest("[data-cday]"); if (!day) return;
  const m = matches.find(x => matchDate(x) === day.dataset.cday); if (!m) return;
  const card = hlist.querySelector(`.match[data-id="${CSS.escape(m.id)}"]`); if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "start" });
  card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
});
hlist.addEventListener("click", e => {
  const ga = e.target.closest("[data-gadd]"), gd = e.target.closest("[data-gdel]"), gi = e.target.closest("[data-ginc]");
  if (gi) {
    const box = gi.closest(".goals");
    changeGoal(box.closest(".match").dataset.id, box.dataset.team, gi.dataset.ginc, 1).catch(() => toast("No se pudo guardar el gol."));
    return;
  }
  if (ga || gd) {
    const box = (ga || gd).closest(".goals"), team = box.dataset.team, mid = box.closest(".match").dataset.id;
    const pid = ga ? box.querySelector("[data-gsel]").value : gd.dataset.gdel;
    if (!pid) { toast("Elige quién marcó el gol."); return; }
    changeGoal(mid, team, pid, ga ? 1 : -1).catch(() => toast("No se pudo guardar el gol."));
    return;
  }
  const ld = e.target.closest("[data-mload]");
  if (ld) {
    if (!confirmFirst(ld, "Sustituye la lista: ¿seguro?", 3000)) return;
    const m = matchById(ld.closest(".match").dataset.id); if (!m) return;
    loadMatch(m).then(gone => {
      st.tab = "alin"; save(); showTab(); render();
      toast(`Alineación del ${fmtDate(m.date || m.id)} en la pizarra.` + (gone ? ` ${cnt(gone, "jugador ya no está", "jugadores ya no están")} en la plantilla.` : ""));
    }, () => toast("No se pudo cargar la alineación."));
    return;
  }
  const del = e.target.closest("[data-mdel]");
  if (del && confirmFirst(del, "¿Seguro?", 3000)) deleteMatch(del.closest(".match").dataset.id).catch(() => toast("No se pudo borrar el partido."));
});
