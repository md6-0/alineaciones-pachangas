"use strict";
/* Pestaña Alineación: la pizarra con los imanes, la convocatoria, los dos equipos con su formación y banquillo,
   y el botón de guardar la alineación en el historial. El arrastre está en drag.js y Compartir en share.js. */

/** Lo que lleva el imán: el número si el nombre acaba en uno («Jugador 12» → 12), las iniciales de las dos
    primeras palabras («Juan Pérez» → JP) o las dos primeras letras («Mario» → MA). */
function initials(name) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length > 1 && /^\d{1,2}$/.test(w[w.length - 1])) return w[w.length - 1];
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
}

function magHTML(id) {
  const L = layout[id], p = BY[id];
  const style = L.zone === "pitch" ? ` style="left:${L.x}%;top:${L.y}%"` : "";
  const ps = POSITIONS.filter(r => p.pos.includes(r));
  const tags = ps.length ? `<span class="ptags">${ps.map(r => `<i class="pt-${r}" title="${r}">${r[0]}</i>`).join("")}</span>` : "";
  return `<div class="mag ${L.team}" data-n="${esc(id)}"${style}><span class="disc">${esc(initials(p.n))}</span><span class="labrow"><span class="lab">${esc(p.n)}</span>${tags}</span></div>`;
}

const slotsHTML = team => freeSlots(team).map(s => `<div class="slot" style="left:${s.x}%;top:${s.y}%">${s.role === "GK" ? "POR" : s.role}</div>`).join("");

function teamHTML(team) {
  const bench = benchIds(team);
  const forms = FORMS[st.mode].map(f => `<button class="form" type="button" data-team="${team}" data-f="${f}" aria-pressed="${st.form[team][st.mode] === f}">${f}</button>`).join("");
  return `<section class="sec team ${team}">
    <div class="thead">
      <div class="tname"><span class="sw ${team}"></span>${TEAMS[team]}</div>
    </div>
    <p class="tsub">${pitchIds(team).length} en el campo</p>
    <div class="forms edit-only">${forms}</div>
    <div class="bench" data-team="${team}">${bench.length ? bench.map(magHTML).join("") : `<span class="empty">Banquillo vacío${canEdit() ? " · suelta aquí un imán" : ""}</span>`}</div>
  </section>`;
}

/** Aviso de la convocatoria: faltan o sobran jugadores para el formato. */
function squadWarning() {
  const n = st.sel.length, need = NEED[st.mode] || 14, d = Math.abs(n - need), fmt = `${st.mode} vs ${st.mode}`;
  return n < need ? `Faltan ${d} jugador${d > 1 ? "es" : ""} para ${fmt}.` : n > need ? `Sobra${d > 1 ? "n" : ""} ${d} para ${fmt}; van al banquillo.` : "";
}

function renderLineup() {
  const board = $("#board");
  board.style.aspectRatio = `${pitch().w}/${pitch().h}`; board.classList.toggle("f11", st.mode === "11");
  if (!loaded) {
    board.innerHTML = pitch().svg + `<div class="loading">${failed ? LOAD_ERROR : "Cargando jugadores…"}</div>`;
    $("#chips").innerHTML = ""; $("#teams").innerHTML = ""; $("#count").textContent = "";
    return;
  }
  $("#chips").innerHTML = [...P].sort((a, b) => a.n.localeCompare(b.n, "es", { sensitivity: "base" }))
    .map(p => `<button class="chip" type="button" aria-pressed="${st.sel.includes(p.id)}" data-n="${esc(p.id)}">${esc(p.n)}</button>`).join("");
  $("#count").textContent = `${pitchIds().length} en el campo`;
  const s = $("#status");
  s.className = "status warn"; s.textContent = squadWarning(); s.hidden = !s.textContent;
  board.innerHTML = pitch().svg + `<span class="tag tag-top">Oscuro</span><span class="tag tag-bot">Blanco</span>`
    + slotsHTML("D") + slotsHTML("W") + pitchIds().map(magHTML).join("");
  const empty = !canEdit() ? (histLoaded ? "Todavía no hay ninguna alineación guardada." : "Cargando la alineación…")
    : P.length ? "Marca al menos dos jugadores." : "Todavía no hay jugadores. Añádelos en la pestaña Jugadores o restaura una copia en Opciones (⚙).";
  $("#teams").innerHTML = hasLineup() ? teamHTML("D") + teamHTML("W") : `<section class="sec"><p class="status">${empty}</p></section>`;
}

/* ---------- Acciones ---------- */

// Convocar o desconvocar
$("#chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  const n = b.dataset.n;
  st.sel = st.sel.includes(n) ? st.sel.filter(x => x !== n) : [...st.sel, n];
  seed = 0; save(); rebuild(); render();
});

// Formación de un equipo
$("#teams").addEventListener("click", e => {
  const b = e.target.closest(".form"); if (!b) return;
  st.form[b.dataset.team][st.mode] = b.dataset.f; save(); relayTeam(b.dataset.team); render();
});

$("#shuffle").addEventListener("click", () => { if (!loaded) return; seed++; rebuild(); render(); });

$("#swap").addEventListener("click", () => {
  if (!loaded || !hasLineup()) return;
  swapTeams(); render(); toast("Equipos invertidos.");
});

// Guardar en el historial (si ya hay un partido ese día, pide confirmación para reemplazarlo)
$("#fix").addEventListener("click", async e => {
  const btn = e.currentTarget, label = "Guardar alineación en historial";
  if (!hasLineup()) { toast("Marca jugadores antes de guardar la alineación."); return; }
  if (matchOfDay() && !confirmFirst(btn, "Reemplazar la ya guardada", 4000)) return;
  disarm(btn, label);
  try { await saveLineup(); toast("Alineación guardada en el historial."); }
  catch (err) { toast(err && err.code === "quota_exceeded" ? "No caben más partidos en el historial." : "No se pudo fijar la alineación."); }
});
