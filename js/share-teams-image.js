"use strict";
/* Imagen de los equipos para compartir (1080 px de ancho): los jugadores de cada equipo en dos columnas,
   sin campo y sin posiciones. Banquillo incluido, por orden alfabético. Usa roundRect (share-image.js). */

/** Recorta un texto con «…» para que quepa en el ancho dado. */
function fitText(c, s, max) {
  if (c.measureText(s).width <= max) return s;
  while (s.length > 1 && c.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

/** Jugadores de un equipo (campo y banquillo), por orden alfabético. */
const teamNames = team => [...pitchIds(team), ...benchIds(team)].map(nameOf).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

/** Dibuja la imagen de los equipos y devuelve el canvas. */
async function drawTeamsImage() {
  try { await document.fonts.ready; } catch {}
  const W = 1080, M = 40, gap = 30, colW = (W - 2 * M - gap) / 2, top = 205, headH = 120, rowH = 66;
  const teams = [["W", "EQUIPO BLANCO"], ["D", "EQUIPO OSCURO"]].map(([t, label]) => ({ t, label, names: teamNames(t) }));
  const rows = Math.max(1, ...teams.map(x => x.names.length));
  const cardH = headH + rows * rowH + 20, H = top + cardH + 60;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = "Archivo, system-ui, sans-serif";

  // Fondo y título (como la imagen de la alineación)
  c.fillStyle = "#1d3327"; c.fillRect(0, 0, W, H);
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  c.fillStyle = "#87a090"; c.font = `600 22px ${F}`;
  c.fillText(`${groupName().toUpperCase()}  ·  ${st.mode} VS ${st.mode}`, M, 72);
  c.fillStyle = "#eef3ef"; c.font = `800 56px ${F}`;
  c.fillText(`EQUIPOS · ${matchDayLabel().toUpperCase()}`, M, 150);

  teams.forEach(({ t, label, names }, i) => {
    const x = M + i * (colW + gap), light = t === "W";
    // Tarjeta del equipo
    c.fillStyle = "#254031"; roundRect(c, x, top, colW, cardH, 12); c.fill();
    // Cabecera: disco del color del equipo, nombre y número de jugadores
    c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 10; c.shadowOffsetY = 4;
    c.beginPath(); c.arc(x + 54, top + 60, 28, 0, 7); c.fillStyle = light ? "#f5f4ef" : "#1b1e21"; c.fill(); c.restore();
    c.strokeStyle = light ? "#cfcec6" : "rgba(255,255,255,.25)"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#eef3ef"; c.font = `800 32px ${F}`; c.fillText(label, x + 98, top + 58);
    c.fillStyle = "#b4c6ba"; c.font = `600 21px ${F}`; c.fillText(cnt(names.length, "jugador", "jugadores"), x + 98, top + 88);
    // Jugadores
    names.forEach((n, j) => {
      const y = top + headH + j * rowH;
      c.fillStyle = light ? "#f5f4ef" : "#1b1e21"; roundRect(c, x + 20, y, colW - 40, rowH - 12, 8); c.fill();
      if (!light) { c.strokeStyle = "rgba(255,255,255,.15)"; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = light ? "#16191a" : "#f1f1ee"; c.font = `600 28px ${F}`; c.textBaseline = "middle";
      c.fillText(fitText(c, n, colW - 80), x + 40, y + (rowH - 12) / 2 + 1);
      c.textBaseline = "alphabetic";
    });
  });
  return cv;
}
