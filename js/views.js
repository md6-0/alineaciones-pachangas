"use strict";
/* Navegación entre pestañas y repintado.
   El flujo es siempre el mismo: una acción cambia los datos o la pizarra y se llama a render() (o a la función
   de la pestaña afectada), que vuelve a pintar a partir del estado. */

const TABS = ["alin", "jug", "hist", "stats", "pag", "opc"];
const TITLES = { jug: "Jugadores", hist: "Historial", stats: "Estadísticas", pag: "Pagos", opc: "Opciones" };
const EDIT_TABS = ["jug", "pag"];   // pestañas solo para quien edita

/** Muestra la pestaña de st.tab y pone su título. */
function showTab() {
  if (!TABS.includes(st.tab) || (EDIT_TABS.includes(st.tab) && !canEdit())) st.tab = "alin";
  TABS.forEach(t => {
    $("#t-" + t).setAttribute("aria-selected", st.tab === t);
    $("#p-" + t).hidden = st.tab !== t;
  });
  $("#hctl").hidden = st.tab !== "alin";   // Guardar y Compartir solo en Partido
  paintTitle();
}
/** Título de la pestaña (el de Partido es el día y la hora del partido, que puede cambiar al llegar los datos). */
const paintTitle = () => { $("#h1").textContent = st.tab === "alin" ? matchWhen() : TITLES[st.tab]; };

/** Repinta la pizarra y lo que depende de ella en Opciones (formato y fecha). */
function render() { paintOptions(); paintTitle(); renderLineup(); }

/** Repinta todas las pestañas. */
function renderAll() { render(); renderPlayers(); renderHistory(); renderStats(); renderPayments(); }

const RENDER_TAB = { jug: () => renderPlayers(), hist: () => renderHistory(), stats: () => renderStats(), pag: () => renderPayments() };
$(".tabs").addEventListener("click", e => {
  const b = e.target.closest(".tab"); if (!b) return;
  st.tab = b.dataset.tab; save(); showTab();
  if (RENDER_TAB[st.tab]) RENDER_TAB[st.tab]();
});
