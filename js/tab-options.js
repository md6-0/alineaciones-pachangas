"use strict";
/* Pestaña Opciones: nombre del grupo, día y hora del partido, tu nombre, formato, medias, copia de seguridad y borrar todo.
   La versión y «Buscar actualizaciones» están en updates.js. */

/** Pinta el nombre del grupo encima del título y en su casilla (salvo mientras se escribe). */
function paintGroup() {
  $("#eyebrow").textContent = groupName();
  const gi = $("#groupname"); if (document.activeElement !== gi) gi.value = groupName();
}

/** Formato y fecha elegidos (se pinta con la pizarra, porque los dos la cambian). */
function paintOptions() {
  $$("#modeseg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === st.mode));
  const mdi = $("#matchdate");
  if (document.activeElement !== mdi) mdi.value = isoDate(matchDay());
  mdi.min = st.datePast ? "" : todayIso();
  $("#datereset").hidden = !customDate();
  const ti = $("#matchtime"); if (document.activeElement !== ti) ti.value = st.time || "";
  const ni = $("#myname"); if (document.activeElement !== ni) ni.value = st.myName || "";
}

/** Muestra u oculta las medias en toda la app. */
function applyRatings() {
  document.body.classList.toggle("no-ratings", !st.ratings);
  $$("#ratingseg button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.r === "1") === !!st.ratings));
  $("#phint").textContent = st.ratings ? HINT_RATINGS : HINT_PLAIN;
}

/* ---------- Ajustes ---------- */

$("#groupname").addEventListener("change", async e => {
  const saving = setGroupName(e.target.value); paintGroup();
  try { await saving; } catch { toast("No se pudo guardar el nombre del grupo."); }
});

$("#matchdate").addEventListener("change", e => { setMatchDate(e.target.value); showTab(); render(); });
$("#datereset").addEventListener("click", () => { setMatchDate(null); showTab(); render(); });

$("#matchtime").addEventListener("change", e => { st.time = /^\d\d:\d\d$/.test(e.target.value) ? e.target.value : null; save(); });
$("#myname").addEventListener("change", e => { st.myName = e.target.value.trim().slice(0, 40); e.target.value = st.myName; save(); });

$("#modeseg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !loaded) return;
  st.mode = b.dataset.mode; save(); rebuild(); render();
});

$("#ratingseg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  st.ratings = b.dataset.r === "1"; save(); applyRatings(); render(); renderPlayers(); renderHistory();
});

/* ---------- Copia de seguridad ---------- */

$("#bk-down").addEventListener("click", () => {
  if (!loaded || !histLoaded) { toast("Espera a que carguen los datos."); return; }
  const data = buildBackup();
  saveFile(backupFilename(), JSON.stringify(data, null, 2));
  toast(`Copia guardada: ${cnt(Object.keys(data.players).length, "jugador", "jugadores")} y ${cnt(matches.length, "partido", "partidos")}.`);
});

// Restaurar en dos pasos: elegir el archivo (se resume lo que trae) y confirmar
let pendingRestore = null;
const bkUp = $("#bk-up"), bkMsg = $("#bk-msg");
function resetRestore() { pendingRestore = null; disarm(bkUp, "Restaurar copia"); bkMsg.hidden = true; }

bkUp.addEventListener("click", async () => {
  if (!pendingRestore) { $("#bk-file").click(); return; }
  const data = pendingRestore; bkUp.disabled = true; bkUp.textContent = "Restaurando…";
  try {
    const n = await restoreBackup(data);
    toast(`Copia restaurada: ${cnt(n.players, "jugador", "jugadores")} y ${cnt(n.matches, "partido", "partidos")}.`);
  } catch (e) { toast(e && e.code === "invalid_argument" ? "No tienes permiso para restaurar." : "La restauración se cortó a medias. Vuelve a intentarlo con el mismo archivo."); }
  bkUp.disabled = false; resetRestore();
});

$("#bk-file").addEventListener("change", e => {
  const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    let d = null; try { d = JSON.parse(r.result); } catch {}
    if (!isBackup(d)) { toast("Ese archivo no es una copia de esta página."); return; }
    pendingRestore = d;
    const np = Object.keys(d.players).length, nm = Object.keys(d.matches).length;
    const when = d.exportedAt ? new Date(d.exportedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "fecha desconocida";
    bkMsg.textContent = `Copia del ${when}: ${cnt(np, "jugador", "jugadores")} y ${cnt(nm, "partido", "partidos")}. Al confirmar, los jugadores y el historial actuales se sustituyen por los de la copia.`;
    bkMsg.hidden = false; bkUp.classList.add("arm"); bkUp.textContent = "Confirmar restauración";
    setTimeout(() => { if (pendingRestore === d && !bkUp.disabled) resetRestore(); }, 20000);
  };
  r.readAsText(f);
});

/* ---------- Borrar todo ---------- */

const wipeBtn = $("#wipe");
wipeBtn.addEventListener("click", async () => {
  if (!confirmFirst(wipeBtn, "Sí, borrar todo", 5000)) return;
  wipeBtn.disabled = true; wipeBtn.textContent = "Borrando…";
  try { await wipeAll(); renderAll(); toast("Datos borrados."); }
  catch (e) { toast(e && e.code === "invalid_argument" ? "No tienes permiso para borrar los datos." : "El borrado se cortó a medias. Vuelve a pulsar para terminar."); }
  wipeBtn.disabled = false; disarm(wipeBtn, "Borrar todo");
});
