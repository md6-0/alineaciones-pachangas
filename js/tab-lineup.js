"use strict";
/* Pestaña Partido: arriba la lista de apuntados (con «Soy…» y Apuntarme / Borrarme), debajo la pizarra con los imanes
   y los dos equipos con su formación y banquillo. Quien organiza además apunta y quita a cualquiera, vacía la lista,
   retoca la alineación y la guarda en el historial. El arrastre está en drag.js y Compartir en share.js. */

/** Lo que lleva el imán: el número si el nombre acaba en uno («Jugador 12» → 12), las iniciales de las dos
    primeras palabras («Juan Pérez» → JP) o las dos primeras letras («Mario» → MA). */
function initials(name) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length > 1 && /^\d{1,2}$/.test(w[w.length - 1])) return w[w.length - 1];
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
}

const byName = (a, b) => a.n.localeCompare(b.n, "es", { sensitivity: "base" });
const posTags = p => POSITIONS.filter(r => p.pos.includes(r));

/* ---------- Lista de apuntados ---------- */

/** Quién eres en este dispositivo (el jugador elegido en «Soy…»), si sigue en la lista de jugadores. */
const me = () => BY[st.me] ? st.me : null;

/** «Soy…» y el botón para apuntarse o borrarse. */
function meHTML() {
  const id = me();
  if (!id) return `<label class="mesel">Para apuntarte, di quién eres:
      <select id="mesel"><option value="">Soy…</option>${[...P].sort(byName).map(p => `<option value="${esc(p.id)}">${esc(p.n)}</option>`).join("")}</select></label>`;
  const inList = isSignedUp(id);
  const action = !inList ? `<button class="btn" id="mebtn" type="button" data-act="in">Apuntarme</button>`
    : canRemove(id) ? `<button class="btn ghost" id="mebtn" type="button" data-act="out">Borrarme</button>`
    : `<span class="hint">Te apuntó quien organiza: si no puedes ir, avísale.</span>`;
  return `<div class="meline"><span>Eres <b>${esc(BY[id].n)}</b> · <button class="linkbtn" id="mechange" type="button">cambiar</button></span>${action}</div>`;
}

function renderSignups() {
  const need = NEED[st.mode] || 16, ids = signupIds();
  $("#count").textContent = signupsLoaded ? `${ids.length} de ${need}` : "";
  $("#me").innerHTML = loaded ? meHTML() : "";
  $("#slist").innerHTML = ids.map((id, i) => {
    const p = BY[id], tags = posTags(p);
    return `<li class="${id === me() ? "mine" : ""}${i >= need ? " extra" : ""}"><span class="sn">${i + 1}.</span><span class="sname">${esc(p.n)}${id === me() ? " <small>(tú)</small>" : ""}</span>`
      + `${tags.length ? `<span class="ptags">${tags.map(r => `<i class="pt-${r}" title="${r}">${r[0]}</i>`).join("")}</span>` : ""}`
      + `${canEdit() ? `<button type="button" class="sdel" data-sdel="${esc(id)}" aria-label="Quitar a ${esc(p.n)} de la lista">✕</button>` : ""}</li>`;
  }).join("") || `<li class="sempty">${!signupsLoaded ? "Cargando la lista…" : "Todavía no se ha apuntado nadie."}</li>`;
  const n = ids.length, d = Math.abs(n - need), s = $("#status");
  s.className = "status warn";
  s.textContent = !signupsLoaded || !n ? "" : n < need ? `Faltan ${cnt(d, "jugador", "jugadores")} para ${st.mode} vs ${st.mode}.` : n > need ? `${d > 1 ? `Sobran ${d}` : "Sobra 1"}: van al banquillo.` : "";
  s.hidden = !s.textContent;
  if (canEdit()) {
    const free = [...P].filter(p => !isSignedUp(p.id)).sort(byName);
    $("#saddsel").innerHTML = `<option value="">${free.length ? "Apuntar a…" : "Están todos apuntados"}</option>` + free.map(p => `<option value="${esc(p.id)}">${esc(p.n)}</option>`).join("");
  }
}

/* ---------- Pizarra y equipos ---------- */

function magHTML(id) {
  const L = layout[id], p = BY[id];
  const style = L.zone === "pitch" ? ` style="left:${L.x}%;top:${L.y}%"` : "";
  const tags = posTags(p);
  const tagHTML = tags.length ? `<span class="ptags">${tags.map(r => `<i class="pt-${r}" title="${r}">${r[0]}</i>`).join("")}</span>` : "";
  return `<div class="mag ${L.team}" data-n="${esc(id)}"${style}><span class="disc">${esc(initials(p.n))}</span><span class="labrow"><span class="lab">${esc(p.n)}</span>${tagHTML}</span></div>`;
}

const slotsHTML = team => freeSlots(team).map(s => `<div class="slot" style="left:${s.x}%;top:${s.y}%">${s.role === "GK" ? "POR" : s.role}</div>`).join("");

function teamHTML(team) {
  const bench = benchIds(team);
  return `<section class="sec team ${team}">
    <div class="thead">
      <div class="tname"><span class="sw ${team}"></span>${TEAMS[team]}</div>
    </div>
    <p class="tsub">${pitchIds(team).length} en el campo</p>
    <div class="bench" data-team="${team}">${bench.length ? bench.map(magHTML).join("") : `<span class="empty">Banquillo vacío${canEdit() ? " · suelta aquí un imán" : ""}</span>`}</div>
  </section>`;
}

function renderLineup() {
  renderSignups();
  const board = $("#board");
  board.style.aspectRatio = `${pitch().w}/${pitch().h}`; board.classList.toggle("f11", st.mode === "11");
  if (!loaded || !signupsLoaded) {
    board.innerHTML = pitch().svg + `<div class="loading">${failed ? LOAD_ERROR : "Cargando jugadores…"}</div>`;
    $("#teams").innerHTML = "";
    return;
  }
  board.innerHTML = pitch().svg + `<span class="tag tag-top">Oscuro</span><span class="tag tag-bot">Blanco</span>`
    + slotsHTML("D") + slotsHTML("W") + pitchIds().map(magHTML).join("");
  const empty = !P.length ? (canEdit() ? "Todavía no hay jugadores. Añádelos en la pestaña Jugadores o restaura una copia en Opciones (⚙)." : "Todavía no hay jugadores.")
    : "La alineación aparecerá cuando se apunten al menos dos jugadores.";
  $("#teams").innerHTML = hasLineup() ? teamHTML("D") + teamHTML("W") : `<section class="sec"><p class="status">${empty}</p></section>`;
}

/* ---------- Acciones ---------- */

const listFail = e => toast(e && e.code === "invalid_argument" ? "No tienes permiso para cambiar a ese jugador de la lista."
  : e && /auth\/(operation-not-allowed|admin-restricted-operation)/.test(e.code) ? "Para apuntarse falta activar el acceso anónimo en Firebase."
  : "No se pudo guardar el cambio en la lista.");
const boardFail = () => toast("No se pudo guardar la alineación.");

// «Soy…», Apuntarme / Borrarme
$("#me").addEventListener("change", e => {
  if (e.target.id !== "mesel" || !e.target.value) return;
  st.me = e.target.value; save(); render();
});
$("#me").addEventListener("click", e => {
  if (e.target.id === "mechange") { st.me = null; save(); render(); return; }
  const b = e.target.closest("#mebtn"), id = me(); if (!b || !id) return;
  b.disabled = true;
  (b.dataset.act === "in" ? signUp(id).then(() => toast("Apuntado. ¡Nos vemos en el campo!")) : signOff(id).then(() => toast("Te has borrado de la lista.")))
    .catch(listFail).finally(() => { b.disabled = false; });
});

// Quien organiza: apuntar a cualquiera, quitar y vaciar la lista
$("#saddform").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("#saddsel").value; if (!id) return;
  signUp(id).catch(listFail);
});
$("#slist").addEventListener("click", e => {
  const b = e.target.closest("[data-sdel]"); if (!b) return;
  signOff(b.dataset.sdel).catch(listFail);
});
$("#clearlist").addEventListener("click", e => {
  const btn = e.currentTarget;
  if (!Object.keys(signups).length) { toast("La lista ya está vacía."); return; }
  if (!confirmFirst(btn, "Sí, vaciar la lista", 4000)) return;
  disarm(btn, "Vaciar la lista");
  clearSignups().then(() => toast("Lista vacía: lista para el próximo partido.")).catch(listFail);
});

// Retocar la alineación (se guarda para todos)
$("#shuffle").addEventListener("click", () => { if (!loaded) return; reshuffle().catch(boardFail); render(); });

$("#swap").addEventListener("click", () => {
  if (!loaded || !hasLineup()) return;
  swapTeams(); keepBoard().catch(boardFail); render(); toast("Equipos invertidos.");
});

// Guardar en el historial (si ya hay un partido ese día, pide confirmación para reemplazarlo)
$("#fix").addEventListener("click", async e => {
  const btn = e.currentTarget, label = "Guardar alineación en historial";
  if (!hasLineup()) { toast("Necesitas al menos dos apuntados para guardar la alineación."); return; }
  if (matchOfDay() && !confirmFirst(btn, "Reemplazar la ya guardada", 4000)) return;
  disarm(btn, label);
  try { await saveLineup(); toast("Alineación guardada en el historial."); }
  catch (err) { toast(err && err.code === "quota_exceeded" ? "No caben más partidos en el historial." : "No se pudo fijar la alineación."); }
});
