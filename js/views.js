"use strict";
/* Navegación entre pestañas y repintado.
   El flujo es siempre el mismo: una acción cambia los datos o la pizarra y se llama a render() (o a la función
   de la pestaña afectada), que vuelve a pintar a partir del estado. */

const TABS = ["alin", "jug", "hist", "stats", "opc"];
const TITLES = { jug: "Jugadores", hist: "Historial", stats: "Estadísticas", opc: "Opciones" };

/** Muestra la pestaña de st.tab y pone su título. */
function showTab() {
  if (!TABS.includes(st.tab) || (st.tab === "jug" && !canEdit())) st.tab = "alin";   // Jugadores, solo para quien edita
  TABS.forEach(t => {
    $("#t-" + t).setAttribute("aria-selected", st.tab === t);
    $("#p-" + t).hidden = st.tab !== t;
  });
  $("#hctl").hidden = st.tab !== "alin";   // Guardar y Compartir solo en Partido
  paintTitle();
}
/** Título de la pestaña (el de Partido lleva el día y la hora del partido, que puede cambiar al llegar los datos). */
const paintTitle = () => { $("#h1").textContent = st.tab === "alin" ? `Partido · ${matchWhen()}` : TITLES[st.tab]; };

/** Repinta la pizarra y lo que depende de ella en Opciones (formato y fecha). */
function render() { paintOptions(); paintTitle(); renderLineup(); }

/** Repinta todas las pestañas. */
function renderAll() { render(); renderPlayers(); renderHistory(); renderStats(); }

const RENDER_TAB = { jug: () => renderPlayers(), hist: () => renderHistory(), stats: () => renderStats() };
$(".tabs").addEventListener("click", e => {
  const b = e.target.closest(".tab"); if (!b) return;
  st.tab = b.dataset.tab; save(); showTab();
  if (RENDER_TAB[st.tab]) RENDER_TAB[st.tab]();
});
