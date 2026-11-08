"use strict";
/* Pestaña Opciones: entrar para editar (con servidor), subir los datos del dispositivo, nombre del grupo, formato,
   copia de seguridad y borrar todo. El día y la hora del partido se eligen arriba en la pestaña Partido (sus controles se pintan aquí).
   La versión y «Buscar actualizaciones» están en updates.js. */

const UPLOADED_KEY = "pach-subido";   // ya se subieron al servidor los datos de este dispositivo

/** Con servidor: entrar o salir, y la opción de subir los datos que hubiera en el dispositivo. */
function paintAccount() {
  $("#account").hidden = !db.cloud;
  $("#wipehint").textContent = db.cloud
    ? "Elimina jugadores, historial y ajustes del servidor, para todo el mundo. No se puede deshacer: descarga antes una copia."
    : "Elimina jugadores, historial y ajustes de este dispositivo. No se puede deshacer: descarga antes una copia.";
  if (!db.cloud) return;
  const u = canEdit() ? db.user : null;   // un usuario anónimo (de apuntarse) cuenta como no haber entrado
  $("#loginform").hidden = !!u; $("#logged").hidden = !u;
  $("#acchint").textContent = u ? `Has entrado como ${u.email}: puedes cambiar los datos. Los demás solo los ven.`
    : "Solo quien organiza cambia los datos. Los demás ven la app sin poder tocar nada.";
  let uploaded = false; try { uploaded = !!localStorage.getItem(UPLOADED_KEY); } catch {}
  $("#migrate").hidden = !(u && readLocalData() && !uploaded);
}

const LOGIN_ERRORS = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.", "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.", "auth/invalid-email": "Ese correo no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Espera un poco y vuelve a probar.", "auth/network-request-failed": "Sin conexión. Prueba otra vez con internet."
};
$("#loginform").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginbtn"); btn.disabled = true;
  try { await db.signIn($("#loginmail").value.trim(), $("#loginpass").value); $("#loginpass").value = ""; toast("Has entrado: ya puedes cambiar los datos."); }
  catch (err) { toast(LOGIN_ERRORS[err && err.code] || "No se pudo entrar."); }
  btn.disabled = false;
});
$("#logout").addEventListener("click", async () => {
  try { await db.signOut(); toast("Has salido: ya no puedes cambiar los datos."); } catch { toast("No se pudo salir."); }
});

$("#migbtn").addEventListener("click", async e => {
  const btn = e.currentTarget, label = "Subir los datos de este dispositivo", local = readLocalData();
  if (!local || !canEdit()) return;
  if (!confirmFirst(btn, "Sí, subir y sustituir los del servidor", 5000)) return;
  btn.disabled = true; btn.textContent = "Subiendo…";
  try {
    const n = await restoreBackup({ players: local.players || {}, matches: local.matches || {}, settings: local.settings && local.settings.general });
    try { localStorage.setItem(UPLOADED_KEY, "1"); } catch {}
    toast(`Subidos ${cnt(n.players, "jugador", "jugadores")} y ${cnt(n.matches, "partido", "partidos")}.`);
  } catch (err) { toast(err && err.code === "invalid_argument" ? "No tienes permiso para subir datos." : "La subida se cortó a medias. Vuelve a pulsar para terminarla."); }
  btn.disabled = false; disarm(btn, label); paintAccount();
});

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
  mdi.min = todayIso();
  $("#datereset").hidden = !customDate();
  const ti = $("#matchtime"); if (document.activeElement !== ti) ti.value = st.time || "";
}

/* ---------- Ajustes ---------- */

$("#groupname").addEventListener("change", async e => {
  const saving = setGroupName(e.target.value); paintGroup();
  try { await saving; } catch { toast("No se pudo guardar el nombre del grupo."); }
});

const saveFail = () => toast("No se pudo guardar el cambio.");
$("#matchdate").addEventListener("change", e => { setMatchDate(e.target.value).catch(saveFail); showTab(); render(); });
$("#datereset").addEventListener("click", () => { setMatchDate(null).catch(saveFail); showTab(); render(); });

$("#matchtime").addEventListener("change", e => { setMatchTime(e.target.value).catch(saveFail); showTab(); render(); });

$("#modeseg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !loaded) return;
  setMode(b.dataset.mode).catch(saveFail); render();
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
