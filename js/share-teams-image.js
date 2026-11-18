"use strict";
/* Imagen de los equipos para compartir (1080 px de ancho), como una convocatoria: grupo, día, hora y formato, y los
   convocados de cada equipo en dos columnas con dorsal y posición (SUP, el banquillo). Usa roundRect (share-image.js). */

/** Recorta un texto con «…» para que quepa en el ancho dado. */
function fitText(c, s, max) {
  if (c.measureText(s).width <= max) return s;
  while (s.length > 1 && c.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

/** Jugadores de un equipo (campo y banquillo), por orden alfabético (para el texto). */
const teamNames = team => [...pitchIds(team), ...benchIds(team)].map(nameOf).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

/** Convocados de un equipo con su posición en la pizarra (SUP, el banquillo), de la portería hacia arriba y por nombre. */
function teamSquad(team) {
  const out = pitchIds(team).map(id => ({ n: nameOf(id), role: roleAt(team, layout[id].y) }))
    .concat(benchIds(team).map(id => ({ n: nameOf(id), role: "SUP" })));
  return out.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.n.localeCompare(b.n, "es", { numeric: true }));
}

/** Dibuja la imagen de los equipos como una convocatoria y devuelve el canvas. */
async function drawTeamsImage() {
  try { await document.fonts.ready; } catch {}
  const W = 1080, M = 48, gap = 28, colW = (W - 2 * M - gap) / 2, rowH = 70;
  const teams = [["W", "EQUIPO BLANCO"], ["D", "EQUIPO OSCURO"]].map(([t, label]) => ({ t, label, squad: teamSquad(t) }));
  const rows = Math.max(1, ...teams.map(x => x.squad.length)), total = teams.reduce((s, x) => s + x.squad.length, 0);
  const infoY = 250, top = infoY + 150, headH = 112, cardH = headH + rows * rowH + 18, H = top + cardH + 120;
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

  // Cabecera: grupo y CONVOCATORIA
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  c.fillStyle = ACC; c.fillRect(M, 58, 46, 6);
  c.fillStyle = "#b4c6ba"; c.font = `700 24px ${F}`; c.letterSpacing = "4px";
  c.fillText(groupName().toUpperCase(), M + 62, 70);
  c.letterSpacing = "0px";
  font("800 150px", true); c.fillStyle = "#eef3ef";
  const tw = c.measureText("CONVOCATORIA").width, fit = Math.min(1, (W - 2 * M) / tw);
  c.save(); c.translate(M - 4, 196); c.scale(fit, fit); c.fillText("CONVOCATORIA", 0, 0); c.restore();

  // Datos del partido: día, hora y formato
  const info = [["DÍA", matchDayLabel()], ["HORA", st.time || "—"], ["FORMATO", `${st.mode} vs ${st.mode}`]];
  const iw = [W - 2 * M - 2 * 16 - 2 * 200, 200, 200];
  let ix = M;
  info.forEach(([k, v], i) => {
    c.fillStyle = "#254031"; roundRect(c, ix, infoY, iw[i], 104, 10); c.fill();
    c.fillStyle = ACC; c.font = `700 18px ${F}`; c.letterSpacing = "3px"; c.fillText(k, ix + 24, infoY + 38); c.letterSpacing = "0px";
    font("800 44px", true); c.fillStyle = "#eef3ef";
    c.fillText(fitText(c, v.toUpperCase(), iw[i] - 48), ix + 24, infoY + 84); font("600 20px");
    ix += iw[i] + 16;
  });

  teams.forEach(({ t, label, squad }, i) => {
    const x = M + i * (colW + gap), light = t === "W";
    const kit = light ? "#f5f4ef" : "#15181a", ink = light ? "#16191a" : "#f1f1ee";
    // Tarjeta del equipo con la cabecera del color de la camiseta
    c.fillStyle = "#254031"; roundRect(c, x, top, colW, cardH, 12); c.fill();
    c.save(); roundRect(c, x, top, colW, cardH, 12); c.clip();
    c.fillStyle = kit; c.fillRect(x, top, colW, headH - 12);
    c.restore();
    if (!light) { c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 2; roundRect(c, x + 1, top + 1, colW - 2, cardH - 2, 12); c.stroke(); }
    font("800 44px", true); c.fillStyle = ink; c.fillText(label, x + 26, top + 50);
    font("700 17px"); c.fillStyle = light ? "#5d6660" : "#9aa59e"; c.letterSpacing = "2px";
    c.fillText(cnt(squad.length, "convocado", "convocados").toUpperCase(), x + 26, top + 80); c.letterSpacing = "0px";
    // Convocados: dorsal, nombre y posición
    squad.forEach((p, j) => {
      const y = top + headH + 6 + j * rowH, mid = y + rowH / 2 - 4;
      if (j) { c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(x + 24, y - 4, colW - 48, 2); }
      c.beginPath(); c.arc(x + 50, mid, 22, 0, 7); c.fillStyle = kit; c.fill();
      if (!light) { c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = ink; c.font = `800 21px ${F}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(String(j + 1), x + 50, mid + 1);
      c.textAlign = "left"; c.fillStyle = "#eef3ef"; c.font = `600 29px ${F}`;
      c.fillText(fitText(c, p.n, colW - 190), x + 88, mid + 1);
      c.textAlign = "right"; c.font = `700 17px ${F}`; c.letterSpacing = "2px";
      c.fillStyle = p.role === "SUP" ? "#87a090" : ACC; c.fillText(p.role, x + colW - 22, mid + 1);
      c.letterSpacing = "0px"; c.textAlign = "left"; c.textBaseline = "alphabetic";
    });
  });

  // Pie: total de convocados
  c.fillStyle = "#87a090"; c.font = `600 22px ${F}`;
  c.fillText(`${cnt(total, "jugador convocado", "jugadores convocados")}  ·  sed puntuales`, M, H - 52);
  return cv;
}
