"use strict";
/* Menú Compartir de la Alineación: en texto (WhatsApp, Telegram) o en imagen (descargar, compartir o ver).
   El selector «Qué compartes» elige entre la alineación (posiciones y banquillo) o solo los jugadores de cada equipo. */

/** Alineación en texto, por equipos y líneas. */
function lineupText() {
  const out = [`⚽ Alineación · ${matchDayLabel()} (${st.mode} vs ${st.mode})`];
  [["W", "⚪ Equipo Blanco"], ["D", "⚫ Equipo Oscuro"]].forEach(([team, label]) => {
    const by = r => pitchIds(team).filter(k => roleAt(team, layout[k].y) === r).map(nameOf);
    out.push("", label);
    [["POR", "Portero"], ["DEF", "Defensas"], ["MED", "Medios"], ["ATQ", "Delanteros"]].forEach(([r, l]) => { const n = by(r); if (n.length) out.push(`${l}: ${n.join(", ")}`); });
    const b = benchIds(team).map(nameOf); if (b.length) out.push(`Banquillo: ${b.join(", ")}`);
  });
  return out.join("\n");
}

/** Equipos en texto: los jugadores de cada uno, sin posiciones (teamNames, en share-teams-image.js). */
function teamsText() {
  const out = [`⚽ Equipos · ${matchDayLabel()} (${st.mode} vs ${st.mode})`];
  [["W", "⚪ Equipo Blanco"], ["D", "⚫ Equipo Oscuro"]].forEach(([team, label]) => out.push("", label, ...teamNames(team)));
  return out.join("\n");
}

/* ---------- Qué compartes: alineación o equipos ---------- */
const WHAT = {
  lineup: { text: lineupText, draw: () => drawImage(), file: "pachanga-alineaciones.png", title: "Alineación", sub: "Alineación en texto" },
  teams: { text: teamsText, draw: () => drawTeamsImage(), file: "pachanga-equipos.png", title: "Equipos", sub: "Equipos en texto" }
};
const smenu = $("#smenu");
const what = () => WHAT[st.img] || WHAT.lineup;
/** Avisa y devuelve false si todavía no hay alineación. */
function needLineup() { if (hasLineup()) return true; toast("Marca jugadores antes de compartir."); return false; }

/** Marca la opción elegida y prepara los enlaces de WhatsApp y Telegram con su texto. */
function paintWhat() {
  const w = what();
  $$("#whatseg button").forEach(b => b.setAttribute("aria-pressed", String(WHAT[b.dataset.what] === w)));
  $$("#smenu .wtxt").forEach(s => { s.textContent = w.sub; });
  if (hasLineup()) setTextLinks(smenu, w.text());
}
$("#whatseg").addEventListener("click", e => {
  const b = e.target.closest("button[data-what]"); if (!b) return;
  st.img = b.dataset.what; save(); paintWhat();
});
paintWhat();

dropMenu($("#sharebtn"), smenu, { open: () => { if (!needLineup()) return false; paintWhat(); }, keep: "#whatseg" });
imageButtons(smenu, what, needLineup);
