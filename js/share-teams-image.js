"use strict";
/* Imagen de los equipos para compartir (1080 px de ancho), como un cartel: grupo, día, hora y formato, y los
   jugadores de cada equipo en una carpeta con su pestaña, con dorsal y por orden alfabético (banquillo incluido). Usa roundRect (share-image.js). */

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
  const W = 1080, M = 48, gap = 28, colW = (W - 2 * M - gap) / 2, rowH = 70;
  const teams = [["W", "EQUIPO BLANCO"], ["D", "EQUIPO OSCURO"]].map(([t, label]) => ({ t, label, squad: teamNames(t) }));
  const rows = Math.max(1, ...teams.map(x => x.squad.length));
  const infoY = 250, top = infoY + 150, tabH = 70, cardH = tabH + 22 + rows * rowH + 14, H = top + cardH + 64;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = "Archivo, system-ui, sans-serif";
  // Fuente; cond: estrecha, como los títulos de la app (fontStretch se fija después de font, que lo reinicia)
  const font = (spec, cond) => { c.font = `${spec} ${F}`; if ("fontStretch" in c) c.fontStretch = cond ? "condensed" : "normal"; };
  const ACC = "#9ad6b0";

  // Fondo con franjas diagonales arriba, como un cartel
  c.fillStyle = "#1d3327"; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); c.rect(0, 0, W, infoY - 30); c.clip();
  c.strokeStyle = "rgba(255,255,255,.035)"; c.lineWidth = 26;
  for (let x = -H; x < W + H; x += 70) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + infoY, infoY); c.stroke(); }
  c.restore();

  // Cabecera: grupo y EQUIPOS
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  c.fillStyle = ACC; c.fillRect(M, 58, 46, 6);
  c.fillStyle = "#b4c6ba"; c.font = `600 24px ${F}`; c.letterSpacing = "4px";
  c.fillText(groupName().toUpperCase(), M + 62, 70);
  c.letterSpacing = "0px";
  font("700 104px", true); c.fillStyle = "#eef3ef";
  c.fillText("EQUIPOS", M - 3, 186);

  // Datos del partido: día, hora y formato
  const info = [["DÍA", matchDayLabel()], ["HORA", st.time || "—"], ["FORMATO", `${st.mode} vs ${st.mode}`]];
  const iw = [W - 2 * M - 2 * 16 - 2 * 200, 200, 200];
  let ix = M;
  info.forEach(([k, v], i) => {
    c.fillStyle = "#254031"; roundRect(c, ix, infoY, iw[i], 104, 10); c.fill();
    c.fillStyle = ACC; c.font = `600 18px ${F}`; c.letterSpacing = "3px"; c.fillText(k, ix + 24, infoY + 38); c.letterSpacing = "0px";
    font("600 40px", true); c.fillStyle = "#eef3ef";
    c.fillText(fitText(c, v.toUpperCase(), iw[i] - 48), ix + 24, infoY + 84); font("600 20px");
    ix += iw[i] + 16;
  });

  teams.forEach(({ t, label, squad }, i) => {
    const x = M + i * (colW + gap), light = t === "W";
    const kit = light ? "#f5f4ef" : "#15181a", ink = light ? "#16191a" : "#f1f1ee";
    // Carpeta verde con el nombre del equipo en la pestaña, del color de la camiseta, que sobresale por arriba (como el menú de la app)
    font("700 34px", true);
    const tw = Math.min(colW - 40, c.measureText(label).width + 56), body = top + tabH, bottom = top + cardH, r = 12, ri = 10;
    c.beginPath();
    c.moveTo(x, body);
    c.lineTo(x, top + r); c.arcTo(x, top, x + r, top, r);
    c.lineTo(x + tw - r, top); c.arcTo(x + tw, top, x + tw, top + r, r);
    c.lineTo(x + tw, body - ri); c.arcTo(x + tw, body, x + tw + ri, body, ri);
    c.lineTo(x + colW - r, body); c.arcTo(x + colW, body, x + colW, body + r, r);
    c.lineTo(x + colW, bottom - r); c.arcTo(x + colW, bottom, x + colW - r, bottom, r);
    c.lineTo(x + r, bottom); c.arcTo(x, bottom, x, bottom - r, r);
    c.closePath();
    c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 30; c.shadowOffsetY = 14; c.fillStyle = "#254031"; c.fill(); c.restore();
    c.save(); c.clip(); c.fillStyle = kit; c.fillRect(x, top, tw, tabH); c.restore();   // la pestaña, del color de la camiseta
    if (!light) { c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 2; c.stroke(); }
    c.fillStyle = ink; c.fillText(label, x + 28, top + 48);
    // Convocados: dorsal y nombre
    squad.forEach((p, j) => {
      const y = body + 22 + j * rowH, mid = y + rowH / 2 - 4;
      if (j) { c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(x + 24, y - 4, colW - 48, 2); }
      c.beginPath(); c.arc(x + 50, mid, 22, 0, 7); c.fillStyle = kit; c.fill();
      if (!light) { c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = ink; c.font = `600 21px ${F}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(String(j + 1), x + 50, mid + 1);
      c.textAlign = "left"; c.fillStyle = "#eef3ef"; c.font = `500 29px ${F}`;
      c.fillText(fitText(c, p, colW - 130), x + 88, mid + 1);
      c.textBaseline = "alphabetic";
    });
  });

  return cv;
}
