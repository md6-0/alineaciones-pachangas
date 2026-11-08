"use strict";
/* Pestaña Partido: arriba la lista de apuntados, debajo la pizarra con los imanes y los dos equipos con su banquillo.
   Todos la ven; solo quien organiza elige día y hora, apunta y quita jugadores, vacía la lista, retoca la alineación
   y, después de jugar, pulsa «Partido jugado». El arrastre está en drag.js y Compartir en share.js. */

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

function renderSignups() {
  const need = NEED[st.mode] || 16, ids = signupIds();
  const c = $("#count");
  c.innerHTML = signupsLoaded ? `<b>${ids.length}</b> de ${need}` : "";
  c.classList.toggle("full", signupsLoaded && ids.length >= need);
  $("#slist").innerHTML = ids.map((id, i) => {
    const p = BY[id];   // sin las posiciones: ya salen en los imanes, y así caben los nombres en el móvil
    return `<li class="${i >= need ? "extra" : ""}"><span class="sn">${i + 1}.</span><span class="sname">${esc(p.n)}</span>`
      + `${canEdit() ? `<button type="button" class="sdel" data-sdel="${esc(id)}" aria-label="Quitar a ${esc(p.n)} de la lista">✕</button>` : ""}</li>`;
  }).join("") || `<li class="sempty">${!signupsLoaded ? "Cargando la lista…" : "Todavía no se ha apuntado nadie."}</li>`;
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

const listFail = e => toast(e && e.code === "invalid_argument" ? "No tienes permiso para cambiar la lista." : "No se pudo guardar el cambio en la lista.");

// Quien organiza: apuntar, quitar y vaciar la lista
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

// Partido jugado: guarda la alineación en el historial, vacía la lista y lleva al historial para apuntar el resultado.
// Pide confirmación (y avisa si ya había un partido guardado ese día, que se reemplaza).
$("#fix").addEventListener("click", async e => {
  const btn = e.currentTarget, label = "Partido jugado";
  if (!hasLineup()) { toast("Necesitas al menos dos apuntados para guardar el partido."); return; }
  if (!confirmFirst(btn, matchOfDay() ? "Reemplazar el ya guardado y vaciar la lista" : "Guardar y vaciar la lista", 4000)) return;
  disarm(btn, label); btn.disabled = true;
  try {
    await saveLineup();
    try { await clearSignups(); } catch { toast("Partido guardado, pero no se pudo vaciar la lista."); btn.disabled = false; return; }
    st.tab = "hist"; save(); showTab(); renderHistory();
    toast("Partido guardado: apunta el resultado y los goles. La lista ya está vacía para el próximo.");
  } catch (err) { toast(err && err.code === "quota_exceeded" ? "No caben más partidos en el historial." : "No se pudo guardar el partido."); }
  btn.disabled = false;
});
