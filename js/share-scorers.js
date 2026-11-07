"use strict";
/* Tabla de goleadores para compartir: en texto (WhatsApp, Telegram) o en imagen (1080 px de ancho), desde la pestaña Estadísticas.
   Usa computeStats y scoreRanks (stats.js) y roundRect y fitText (share-image.js y share-teams-image.js). */

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#c9a24a", "#b9c0c4", "#b0774a"];
const scorers = () => computeStats(matches).scorers;
/** Subtítulo: el grupo y cuántos partidos hay en el historial. */
const scorersSub = () => `${groupName()} · ${cnt(matches.length, "partido", "partidos")}`;

/** Goleadores en texto: puesto (medalla para los tres primeros puestos) y goles. */
function scorersText() {
  const rows = scorers(), rk = scoreRanks(rows);
  return [`⚽ Goleadores · ${scorersSub()}`, "",
    ...rows.map((r, i) => `${rk[i] <= 3 ? MEDALS[rk[i] - 1] : rk[i] + "."} ${r.name}: ${cnt(r.g, "gol", "goles")}`)].join("\n");
}

/** Dibuja la imagen de los goleadores y devuelve el canvas. */
async function drawScorersImage() {
  try { await document.fonts.ready; } catch {}
  const rows = scorers(), rk = scoreRanks(rows);
  const W = 1080, M = 40, top = 205, rowH = 78, H = top + rows.length * rowH + 70;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = "Archivo, system-ui, sans-serif";

  // Fondo y título (como las otras imágenes)
  c.fillStyle = "#1d3327"; c.fillRect(0, 0, W, H);
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  c.fillStyle = "#87a090"; c.font = `600 22px ${F}`; c.fillText(scorersSub().toUpperCase(), M, 72);
  c.fillStyle = "#eef3ef"; c.font = `800 56px ${F}`; c.fillText("GOLEADORES", M, 150);

  rows.forEach((r, i) => {
    const y = top + i * rowH, h = rowH - 12, mid = y + h / 2, podium = rk[i] <= 3;
    c.fillStyle = podium ? "#2c4d3a" : "#254031"; roundRect(c, M, y, W - 2 * M, h, 10); c.fill();
    // Puesto: disco de color para los tres primeros, número suelto para el resto
    c.textBaseline = "middle"; c.textAlign = "center";
    if (podium) {
      c.beginPath(); c.arc(M + 48, mid, 24, 0, 7); c.fillStyle = MEDAL_COLORS[rk[i] - 1]; c.fill();
      c.fillStyle = "#16191a"; c.font = `800 24px ${F}`;
    } else { c.fillStyle = "#87a090"; c.font = `700 24px ${F}`; }
    c.fillText(String(rk[i]), M + 48, mid + 1);
    // Goles a la derecha y nombre en el espacio que quede
    c.textAlign = "right"; c.fillStyle = "#eef3ef"; c.font = `800 38px ${F}`;
    const gx = W - M - 28; c.fillText(String(r.g), gx, mid + 1);
    const gw = c.measureText(String(r.g)).width;
    c.textAlign = "left"; c.font = `${podium ? 700 : 600} 30px ${F}`;
    c.fillText(fitText(c, r.name, gx - gw - 30 - (M + 92)), M + 92, mid + 1);
  });
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  return cv;
}

/* ---------- Menú «Compartir goleadores» ---------- */
const scmenu = $("#scmenu");
function needScorers() {
  if (histLoaded && scorers().length) return true;
  toast("Todavía no hay goles apuntados."); return false;
}
dropMenu($("#scbtn"), scmenu, { open: () => { if (!needScorers()) return false; setTextLinks(scmenu, scorersText()); } });
imageButtons(scmenu, () => ({ draw: drawScorersImage, file: "pachanga-goleadores.png", title: "Goleadores" }), needScorers);
