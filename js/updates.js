"use strict";
/* Versiones nuevas. El service worker no se activa solo: aparece una banda arriba y el usuario decide
   cuándo actualizar, para que la app no se recargue mientras escribe. La app busca versión nueva al volver
   a ella y cada media hora; en Opciones hay un botón para buscarla a mano. */

let swReg = null, swPending = null, swReloading = false;

/** La banda es fija: se deja hueco arriba para que no tape la cabecera. */
function placeUpd() { const u = $("#upd"); document.body.style.paddingTop = u.hidden ? "" : u.offsetHeight + "px"; }
function offerUpdate(w) { swPending = w; $("#upd").hidden = false; placeUpd(); }
function hideUpd() { $("#upd").hidden = true; placeUpd(); }

function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").then(reg => {
    swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offerUpdate(w); });
    });
    const check = () => reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    setInterval(check, 30 * 60 * 1000);
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (swReloading) location.reload(); });

  $("#updGo").addEventListener("mousedown", e => e.preventDefault());   // que el foco siga donde estaba
  $("#updGo").addEventListener("click", () => {
    if (editing()) { toast("Termina de editar y vuelve a pulsar Actualizar."); return; }
    const w = swPending || (swReg && swReg.waiting);
    if (!w) { hideUpd(); return; }
    swReloading = true; w.postMessage({ type: "SKIP_WAITING" });
  });
  $("#updX").addEventListener("click", hideUpd);
  window.addEventListener("resize", placeUpd);
  $("#chk").addEventListener("click", async () => {
    if (!swReg) { toast("Las actualizaciones no están disponibles aquí."); return; }
    try { await swReg.update(); } catch { toast("No se pudo comprobar. ¿Sin conexión?"); return; }
    if (swReg.waiting) offerUpdate(swReg.waiting);
    else if (swReg.installing) toast("Descargando la versión nueva…");
    else toast("Ya tienes la última versión.");
  });
}

