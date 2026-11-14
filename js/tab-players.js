"use strict";
/* Pestaña Jugadores (solo quien organiza): tabla editable (media, nombre y posiciones), añadir y quitar.
   Cada cambio se guarda al salir de la casilla y llega a la pizarra con el aviso de db. */

/** Carta con la media del jugador, del color de su nivel (bronce, plata, oro o azul), y se escribe en ella. */
function mediaCard(p) {
  if (ratingsFailed) return '<span class="mcard none" title="No se pueden leer las medias">?</span>';
  if (!ratingsLoaded) return '<span class="mcard none">…</span>';
  const m = mediaOf(p.id);
  return `<input type="number" inputmode="numeric" min="1" max="99" data-f="media" class="mcard ${m === null ? "none" : tierOf(m)}"
    value="${m === null ? "" : m}" placeholder="–" aria-label="Media de ${esc(p.n)}">`;
}

function playerRowHTML(p) {
  return `<div class="plrow" data-id="${esc(p.id)}">
      ${mediaCard(p)}
      <input type="text" data-f="name" value="${esc(p.n)}" maxlength="20" aria-label="Nombre">
      <button type="button" class="del" data-del aria-label="Quitar a ${esc(p.n)}">Quitar</button>
      <div class="posb">${POSITIONS.map(r => `<button type="button" data-pos="${r}" aria-pressed="${p.pos.includes(r)}">${r}</button>`).join("")}</div>
    </div>`;
}

function renderPlayers() {
  const box = $("#plist");
  if (!canEdit()) { box.innerHTML = ""; return; }   // solo para quien organiza
  if (!loaded) { box.innerHTML = `<p class="hint">${failed ? LOAD_ERROR : "Cargando jugadores…"}</p>`; return; }
  $("#pcount").textContent = cnt(P.length, "jugador", "jugadores");
  // Mientras se escribe en una casilla no se repinta la tabla (perdería el foco)
  const ae = document.activeElement;
  if (box.contains(ae) && ae.tagName === "INPUT") return;
  if (!P.length) { box.innerHTML = '<p class="hint">Todavía no hay jugadores. Añade el primero con el botón de arriba.</p>'; return; }
  box.innerHTML = `<div class="plrows">${P.map(playerRowHTML).join("")}</div>`;
}

/** Guarda un cambio y, si falla, avisa y vuelve a pintar la tabla con lo guardado. */
function savePlayer(id, patch) {
  updatePlayer(id, patch).catch(e => {
    toast(e && e.code === "invalid_argument" ? "No tienes permiso para editar jugadores." : "No se pudo guardar el cambio. Vuelve a intentarlo.");
    renderPlayers();
  });
}

const plist = $("#plist");
plist.addEventListener("change", e => {
  const inp = e.target.closest("input"); if (!inp) return;
  const id = inp.closest(".plrow").dataset.id, p = BY[id], f = inp.dataset.f; if (!p) return;
  if (f === "media") {
    const raw = inp.value.trim(), v = raw === "" ? null : Math.round(+raw);
    if (v !== null && !(v >= 1 && v <= 99)) { inp.value = mediaOf(id) ?? ""; toast("La media va del 1 al 99."); return; }
    if (v !== mediaOf(id)) setMedia(id, v).catch(() => toast("No se pudo guardar la media."));
    inp.className = "mcard " + (v === null ? "none" : tierOf(v));
    return;
  }
  if (f === "name") {
    const v = inp.value.trim(); if (!v) { inp.value = p.n; return; }
    if (v !== p.n) savePlayer(id, { name: v });
  }
});
// Al salir de la tabla, se repinta (por si cambió el orden)
plist.addEventListener("focusout", () => {
  setTimeout(() => { if (!plist.contains(document.activeElement)) renderPlayers(); }, 50);
});
plist.addEventListener("click", e => {
  const tr = e.target.closest(".plrow"); if (!tr) return;
  const p = BY[tr.dataset.id]; if (!p) return;
  const pb = e.target.closest("[data-pos]");
  if (pb) { savePlayer(p.id, { pos: toggledPositions(p, pb.dataset.pos) }); return; }
  const del = e.target.closest("[data-del]");
  if (del && confirmFirst(del, "¿Seguro?", 3000)) removePlayer(p.id).catch(() => toast("No se pudo quitar al jugador."));
});

$("#addform").addEventListener("submit", e => {
  e.preventDefault();
  const inp = $("#newname"), name = inp.value.trim();
  if (!name) return;
  addPlayer(name)
    .then(() => { inp.value = ""; toast(`${name} añadido.`); })
    .catch(e => toast(e && e.code === "quota_exceeded" ? "No caben más jugadores." : "No se pudo añadir el jugador."));
});
