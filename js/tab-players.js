"use strict";
/* Pestaña Jugadores (solo quien organiza): dos listas, fijos y wildcards, con tabla editable (media, nombre y posiciones), añadir, quitar y pasar de una lista a otra.
   Cada cambio se guarda al salir de la casilla y llega a la pizarra con el aviso de db. */

/** Carta con la media del jugador, del color de su nivel (bronce, plata, oro o azul), y se escribe en ella. */
function mediaCard(p) {
  if (ratingsFailed) return '<span class="mcard none" title="No se pueden leer las medias">?</span>';
  if (!ratingsLoaded) return '<span class="mcard none">…</span>';
  const m = mediaOf(p.id);
  return `<input type="number" inputmode="numeric" min="1" max="99" data-f="media" class="mcard ${m === null ? "none" : tierOf(m)}"
    value="${m === null ? "" : m}" placeholder="–" aria-label="Media de ${esc(p.n)}">`;
}

/** Jugadores en el orden elegido: el de la lista, o de mayor a menor media (sin media, al final; a igual media, por nombre). */
function sortedPlayers() {
  if (st.psort !== "media" || !ratingsLoaded) return P;
  const key = p => { const m = mediaOf(p.id); return m === null ? -1 : m; };
  return P.slice().sort((a, b) => key(b) - key(a) || a.n.localeCompare(b.n, "es"));
}

function playerRowHTML(p) {
  return `<div class="plrow" data-id="${esc(p.id)}">
      ${mediaCard(p)}
      <input type="text" data-f="name" value="${esc(p.n)}" maxlength="25" aria-label="Nombre">
      <button type="button" class="del" data-del aria-label="Quitar a ${esc(p.n)}">Quitar</button>
      <div class="prow2"><div class="posb">${POSITIONS.map(r => `<button type="button" data-pos="${r}" aria-pressed="${p.pos.includes(r)}">${r}</button>`).join("")}</div>
        <button type="button" class="pmove" data-kind>${p.wild ? "A fijos" : "A wildcards"}</button></div>
    </div>`;
}

/** Una lista (fijos o wildcards) como carpeta con pestaña verde. */
function groupHTML(title, list, empty) {
  return `<section class="plgroup ftab"><h2>${title} · ${list.length}</h2>${list.length ? `<div class="plrows">${list.map(playerRowHTML).join("")}</div>` : `<p class="hint">${empty}</p>`}</section>`;
}

function renderPlayers() {
  const box = $("#plist");
  if (!canEdit()) { box.innerHTML = ""; return; }   // solo para quien organiza
  if (!loaded) { box.innerHTML = `<p class="hint">${failed ? LOAD_ERROR : "Cargando jugadores…"}</p>`; return; }
  const wilds = P.filter(p => p.wild).length;
  $("#pcount").textContent = cnt(P.length - wilds, "fijo", "fijos") + (wilds ? " · " + cnt(wilds, "wildcard", "wildcards") : "");
  // Mientras se escribe en una casilla no se repinta la tabla (perdería el foco)
  const ae = document.activeElement;
  if (box.contains(ae) && ae.tagName === "INPUT") return;
  if (!P.length) { box.innerHTML = '<p class="hint">Todavía no hay jugadores. Añade el primero con el botón de arriba.</p>'; return; }
  document.querySelectorAll("#psortseg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.psort === st.psort));
  const all = sortedPlayers();
  box.innerHTML = groupHTML("Fijos", all.filter(p => !p.wild), "No hay fijos. Pasa a alguien desde Wildcards con «A fijos».")
    + groupHTML("Wildcards", all.filter(p => p.wild), "Sin wildcards. Añade uno arriba (elige «Wildcard») o pasa a un fijo con «A wildcards».");
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
  const mv = e.target.closest("[data-kind]");
  if (mv) { savePlayer(p.id, { kind: p.wild ? "fijo" : "wild" }); toast(`${p.n} pasa a ${p.wild ? "fijos" : "wildcards"}.`); return; }
  const del = e.target.closest("[data-del]");
  if (del && confirmFirst(del, "¿Seguro?", 3000)) removePlayer(p.id).catch(() => toast("No se pudo quitar al jugador."));
});

$("#addform").addEventListener("submit", e => {
  e.preventDefault();
  const inp = $("#newname"), name = inp.value.trim();
  if (!name) return;
  const wild = $("#newkind").value === "wild";
  addPlayer(name, wild)
    .then(() => { inp.value = ""; toast(`${name} añadido a ${wild ? "wildcards" : "fijos"}.`); })
    .catch(e => toast(e && e.code === "quota_exceeded" ? "No caben más jugadores." : "No se pudo añadir el jugador."));
});

// Ordenar por la lista o por media (se recuerda en este dispositivo)
$("#psortseg").addEventListener("click", e => {
  const b = e.target.closest("[data-psort]"); if (!b || b.dataset.psort === st.psort) return;
  st.psort = b.dataset.psort; save(); renderPlayers();
});
