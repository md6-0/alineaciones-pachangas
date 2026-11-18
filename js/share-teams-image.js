"use strict";
/* Imagen de los equipos para compartir (1080 px de ancho), como un cartel: grupo, día, hora y formato, y los
   jugadores de cada equipo en una carpeta con su pestaña, con dorsal y por orden alfabético (banquillo incluido).
   La cabecera y las carpetas son las de share-image.js. */

/** Jugadores de un equipo (campo y banquillo), por orden alfabético. */
const teamNames = team => [...pitchIds(team), ...benchIds(team)].map(nameOf).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));


/** Dibuja la imagen de los equipos y devuelve el canvas. */
async function drawTeamsImage() {
  try { await document.fonts.ready; } catch {}
  const W = 1080, M = 48, gap = 28, colW = (W - 2 * M - gap) / 2, rowH = 70;
  const teams = [["W", KIT.W.label], ["D", KIT.D.label]].map(([t, label]) => ({ t, label, squad: teamNames(t) }));
  const rows = Math.max(1, ...teams.map(x => x.squad.length));
  const top = POSTER_TOP, tabH = 70, cardH = tabH + 22 + rows * rowH + 14, H = top + cardH + 64;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), font = posterFont(c);
  posterHead(c, "Equipos");

  teams.forEach(({ t, label, squad }, i) => {
    const x = M + i * (colW + gap), light = t === "W";
    const kit = light ? "#f5f4ef" : "#15181a", ink = light ? "#16191a" : "#f1f1ee";
    // Carpeta verde con el nombre del equipo en la pestaña, del color de la camiseta, que sobresale por arriba (como el menú de la app)
    font("700 34px", true);
    const tw = Math.min(colW - 40, c.measureText(label).width + 56), body = top + tabH;
    folder(c, x, body, colW, cardH - tabH, { top: [tw, tabH, kit] });
    c.fillStyle = ink; c.fillText(label, x + 28, top + 48);
    // Convocados: dorsal y nombre
    squad.forEach((p, j) => {
      const y = body + 22 + j * rowH, mid = y + rowH / 2 - 4;
      if (j) { c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(x + 24, y - 4, colW - 48, 2); }
      c.beginPath(); c.arc(x + 50, mid, 22, 0, 7); c.fillStyle = kit; c.fill();
      c.fillStyle = ink; c.font = `600 21px ${POSTER_F}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(String(j + 1), x + 50, mid + 1);
      c.textAlign = "left"; c.fillStyle = "#eef3ef"; c.font = `500 29px ${POSTER_F}`;
      c.fillText(fitText(c, p, colW - 130), x + 88, mid + 1);
      c.textBaseline = "alphabetic";
    });
  });

  return cv;
}
