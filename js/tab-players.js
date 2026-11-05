"use strict";
/* Pestaña Jugadores: tabla editable (nombre, notas y posiciones), añadir, quitar y ordenar.
   Cada cambio se guarda al salir de la casilla y llega a la pizarra con el aviso de db. */

const HINT_RATINGS = "Los cambios se guardan al salir de cada casilla y se ven al momento en los imanes. Marca varias posiciones si alguien es polivalente. La media se pondera según la posición: portero usa POR, defensa 75% DEF y 25% ATQ, medio 50/50, delantero 75% ATQ y 25% DEF; con varias posiciones se promedian. En cada equipo va a la portería quien tenga la posición POR (y si no hay, quien tenga más POR).";
const HINT_PLAIN = "Los cambios se guardan al salir de cada casilla. Marca varias posiciones si alguien es polivalente.";

function playerRowHTML(p) {
  return `<tr data-id="${esc(p.id)}">
      <td><input type="text" data-f="name" value="${esc(p.n)}" maxlength="20" aria-label="Nombre"></td>
      <td class="c rc"><span class="ov ${tier(p.ovr)}" data-ov="${esc(p.id)}">${p.ovr}</span></td>
      ${STATS.map(([k, l]) => `<td class="c rc"><input type="number" inputmode="numeric" min="1" max="99" data-f="${k}" value="${p.vals[k]}" aria-label="${l} de ${esc(p.n)}"></td>`).join("")}
      <td><span class="posb">${POSITIONS.map(r => `<button type="button" data-pos="${r}" aria-pressed="${p.pos.includes(r)}">${r}</button>`).join("")}</span></td>
      <td><button type="button" class="del" data-del>Quitar</button></td>
    </tr>`;
}

function renderPlayers() {
  const box = $("#plist");
  $$("#p-jug .seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.sort === st.sort));
  if (!loaded) { box.innerHTML = `<p class="hint">${failed ? LOAD_ERROR : "Cargando jugadores…"}</p>`; return; }
  $("#pcount").textContent = cnt(P.length, "jugador", "jugadores");
  // Mientras se escribe en una casilla no se repinta la tabla (perdería el foco): solo se actualizan las medias
  const ae = document.activeElement;
  if (box.contains(ae) && ae.tagName === "INPUT") {
    P.forEach(p => { const c = box.querySelector(`[data-ov="${CSS.escape(p.id)}"]`); if (c) { c.textContent = p.ovr; c.className = "ov " + tier(p.ovr); } });
    return;
  }
  if (!P.length) { box.innerHTML = '<p class="hint">Todavía no hay jugadores. Añade el primero con el botón de arriba.</p>'; return; }
  const list = st.sort === "media" && st.ratings ? [...P].sort((a, b) => b.m - a.m) : P;
  box.innerHTML = `<table class="pt"><thead><tr>
    <th>Jugador</th><th class="c rc">Media</th>${STATS.map(([, l]) => `<th class="c rc">${l}</th>`).join("")}
    <th>Posiciones</th><th></th></tr></thead><tbody>
    ${list.map(playerRowHTML).join("")}</tbody></table>`;
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
  const id = inp.closest("tr").dataset.id, p = BY[id], f = inp.dataset.f; if (!p) return;
  if (f === "name") {
    const v = inp.value.trim(); if (!v) { inp.value = p.n; return; }
    if (v !== p.n) savePlayer(id, { name: v });
  } else {
    let v = Math.round(+inp.value);
    if (!isFinite(v) || inp.value === "") { inp.value = p.vals[f]; return; }
    v = clamp(v, 1, 99); inp.value = v;
    savePlayer(id, { [f]: v });
  }
});
// Al salir de la tabla, se repinta (por si cambió el orden)
plist.addEventListener("focusout", () => {
  setTimeout(() => { if (!plist.contains(document.activeElement)) renderPlayers(); }, 50);
});
plist.addEventListener("click", e => {
  const tr = e.target.closest("tr"); if (!tr) return;
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
    .then(() => { inp.value = ""; toast(`${name} añadido con 70 en todo.`); })
    .catch(e => toast(e && e.code === "quota_exceeded" ? "No caben más jugadores." : "No se pudo añadir el jugador."));
});

$("#p-jug .seg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  st.sort = b.dataset.sort; save(); renderPlayers();
});
