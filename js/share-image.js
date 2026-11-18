"use strict";
/* Imagen de la alineación para compartir (1080 px de ancho), como un cartel: grupo, día, hora y formato, y el campo
   dentro de una carpeta con una pestaña por equipo (arriba el oscuro, abajo el blanco) y sus banquillos.
   Aquí están también las piezas comunes con la imagen de los equipos (cabecera, carpetas, texto recortado). */

const POSTER_F = "Archivo, system-ui, sans-serif", POSTER_TOP = 400, POSTER_ACC = "#9ad6b0", FOLDER_BG = "#254031";
const KIT = { W: { bg: "#f5f4ef", ink: "#16191a", label: "EQUIPO BLANCO" }, D: { bg: "#15181a", ink: "#f1f1ee", label: "EQUIPO OSCURO" } };

/** Recorta un texto con «…» para que quepa en el ancho dado. */
function fitText(c, s, max) {
  if (c.measureText(s).width <= max) return s;
  while (s.length > 1 && c.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

/** Fija la fuente; cond: estrecha, como los títulos de la app (fontStretch va después de font, que lo reinicia). */
const posterFont = c => (spec, cond) => { c.font = `${spec} ${POSTER_F}`; if ("fontStretch" in c) c.fontStretch = cond ? "condensed" : "normal"; };

/** Fondo, franjas diagonales, grupo, título y las casillas de día, hora y formato. El contenido empieza en POSTER_TOP. */
function posterHead(c, title) {
  const W = c.canvas.width, H = c.canvas.height, M = 48, infoY = 250, font = posterFont(c), F = POSTER_F;
  c.fillStyle = "#1d3327"; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); c.rect(0, 0, W, infoY - 30); c.clip();
  c.strokeStyle = "rgba(255,255,255,.035)"; c.lineWidth = 26;
  for (let x = -infoY; x < W; x += 70) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + infoY, infoY); c.stroke(); }
  c.restore();
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  c.fillStyle = POSTER_ACC; c.fillRect(M, 58, 46, 6);
  c.fillStyle = "#b4c6ba"; c.font = `600 24px ${F}`; c.letterSpacing = "4px";
  c.fillText(groupName().toUpperCase(), M + 62, 70);
  c.letterSpacing = "0px";
  font("700 104px", true); c.fillStyle = "#eef3ef";
  c.fillText(title, M - 3, 186);
  const info = [["DÍA", matchDayLabel()], ["HORA", st.time || "—"], ["FORMATO", `${st.mode} vs ${st.mode}`]];
  const iw = [W - 2 * M - 2 * 16 - 2 * 200, 200, 200];
  let ix = M;
  info.forEach(([k, v], i) => {
    c.fillStyle = FOLDER_BG; roundRect(c, ix, infoY, iw[i], 104, 10); c.fill();
    c.fillStyle = POSTER_ACC; c.font = `600 18px ${F}`; c.letterSpacing = "3px"; c.fillText(k, ix + 24, infoY + 38); c.letterSpacing = "0px";
    font("600 40px", true); c.fillStyle = "#eef3ef";
    c.fillText(fitText(c, v.toUpperCase(), iw[i] - 48), ix + 24, infoY + 84);
    ix += iw[i] + 16;
  });
  font("600 20px");
}

/** Carpeta verde (cuerpo de y a y + h) con pestañas a la izquierda: top sobresale por arriba y bottom por abajo,
    cada una [ancho, alto, color]. Deja el trazado hecho (para recortar dentro). */
function folder(c, x, y, w, h, { top, bottom } = {}) {
  const r = 12, ri = 10, y1 = y + h;
  c.beginPath();
  if (top) {
    const [tw, th] = top;
    c.moveTo(x, y - th + r); c.arcTo(x, y - th, x + r, y - th, r);
    c.lineTo(x + tw - r, y - th); c.arcTo(x + tw, y - th, x + tw, y - th + r, r);
    c.lineTo(x + tw, y - ri); c.arcTo(x + tw, y, x + tw + ri, y, ri);
  } else { c.moveTo(x, y + r); c.arcTo(x, y, x + r, y, r); }
  c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y1 - r); c.arcTo(x + w, y1, x + w - r, y1, r);
  if (bottom) {
    const [tw, th] = bottom;
    c.lineTo(x + tw + ri, y1); c.arcTo(x + tw, y1, x + tw, y1 + ri, ri);
    c.lineTo(x + tw, y1 + th - r); c.arcTo(x + tw, y1 + th, x + tw - r, y1 + th, r);
    c.lineTo(x + r, y1 + th); c.arcTo(x, y1 + th, x, y1 + th - r, r);
  } else { c.lineTo(x + r, y1); c.arcTo(x, y1, x, y1 - r, r); }
  c.closePath();
  c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 30; c.shadowOffsetY = 14; c.fillStyle = FOLDER_BG; c.fill(); c.restore();
  // Pestañas del color de la camiseta
  c.save(); c.clip();
  if (top) { c.fillStyle = top[2]; c.fillRect(x, y - top[1], top[0], top[1]); }
  if (bottom) { c.fillStyle = bottom[2]; c.fillRect(x, y1, bottom[0], bottom[1]); }
  c.restore();
}



/** Rectángulo con esquinas redondeadas. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Líneas del campo. X e Y pasan de unidades del campo a píxeles; sx es la escala horizontal. */
function drawPitchLines(c, X, Y, sx, sy) {
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 3;
  const R = (x, y, w, h) => c.strokeRect(X(x), Y(y), w * sx, h * sy);
  const Ln = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(X(x1), Y(y1)); c.lineTo(X(x2), Y(y2)); c.stroke(); };
  const dots = [];
  if (st.mode === "11") {
    R(2, 2, 68, 105); Ln(2, 54.5, 70, 54.5);
    c.beginPath(); c.arc(X(36), Y(54.5), 9.15 * sx, 0, 7); c.stroke();
    R(15.84, 2, 40.32, 16.5); R(26.84, 2, 18.32, 5.5); R(15.84, 90.5, 40.32, 16.5); R(26.84, 101.5, 18.32, 5.5);
    R(32.34, .6, 7.32, 1.4); R(32.34, 107, 7.32, 1.4);
    const a = Math.acos(5.5 / 9.15);   // semicírculos de las áreas
    c.beginPath(); c.arc(X(36), Y(13), 9.15 * sx, Math.PI / 2 - a, Math.PI / 2 + a); c.stroke();
    c.beginPath(); c.arc(X(36), Y(96), 9.15 * sx, -Math.PI / 2 - a, -Math.PI / 2 + a); c.stroke();
    dots.push([36, 54.5, 5], [36, 13, 4], [36, 96, 4]);
  } else {
    R(2, 2, 40, 60); Ln(2, 32, 42, 32);
    c.beginPath(); c.arc(X(22), Y(32), 6 * sx, 0, 7); c.stroke();
    R(10, 2, 24, 11); R(16, 2, 12, 4.3); R(10, 51, 24, 11); R(16, 57.7, 12, 4.3);
    R(19, .9, 6, 1.1); R(19, 62, 6, 1.1);
    c.setLineDash([0.9 * sx, 0.7 * sx]); Ln(2, 15, 42, 15); Ln(2, 49, 42, 49); c.setLineDash([]);
    dots.push([22, 32, 5], [22, 11, 4], [22, 53, 4]);
  }
  c.fillStyle = "rgba(255,255,255,.7)";
  dots.forEach(([x, y, r]) => { c.beginPath(); c.arc(X(x), Y(y), r, 0, 7); c.fill(); });
}

/** Imán: disco con la posición y pastilla con el nombre debajo. */
function drawMagnet(c, F, id, team, x, y, r, role) {
  const n = nameOf(id);
  c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 14; c.shadowOffsetY = 5;
  c.beginPath(); c.arc(x, y, r, 0, 7);
  c.fillStyle = KIT[team].bg; c.fill(); c.restore();
  c.fillStyle = KIT[team].ink;
  c.font = `600 ${Math.round(r * .56)}px ${F}`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(role, x, y + 1);
  c.font = `500 25px ${F}`;
  const tw = c.measureText(n).width + 22, ly = y + r + 9;
  c.fillStyle = "rgba(0,0,0,.5)"; roundRect(c, x - tw / 2, ly, tw, 36, 8); c.fill();
  c.fillStyle = "#fff"; c.fillText(n, x, ly + 19);
  c.textAlign = "left"; c.textBaseline = "alphabetic";
}

/** Dibuja la imagen y devuelve el canvas. */
async function drawImage() {
  try { await document.fonts.ready; } catch {}
  const PT = pitch(), W = 1080, M = 48, fw = W - 2 * M, pad = 18, bw = fw - 2 * pad, bh = Math.round(bw * PT.h / PT.w);
  const tabH = 70, benchH = 150, bench = { D: benchIds("D"), W: benchIds("W") };
  const bodyY = POSTER_TOP + tabH, pitchY = bodyY + pad + (bench.D.length ? benchH : 0);
  const bodyH = pad + (bench.D.length ? benchH : 0) + bh + (bench.W.length ? benchH : 0) + pad;
  const H = bodyY + bodyH + tabH + 64;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = POSTER_F, font = posterFont(c);
  posterHead(c, "ALINEACIÓN");

  // Carpeta con una pestaña por equipo: el oscuro arriba (defiende esa portería) y el blanco abajo
  font("700 34px", true);
  const tab = t => [Math.min(fw - 40, c.measureText(KIT[t].label).width + 56), tabH, KIT[t].bg];
  folder(c, M, bodyY, fw, bodyH, { top: tab("D"), bottom: tab("W") });
  c.fillStyle = KIT.D.ink; c.fillText(KIT.D.label, M + 28, POSTER_TOP + 48);
  c.fillStyle = KIT.W.ink; c.fillText(KIT.W.label, M + 28, bodyY + bodyH + 48);

  // Campo a franjas, recortado con las esquinas redondeadas
  const bx = M + pad, by = pitchY;
  c.save(); roundRect(c, bx, by, bw, bh, 8); c.clip();
  for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#346649" : "#2f5e44"; c.fillRect(bx, by + i * bh / 10, bw, bh / 10 + 1); }
  const sx = bw / PT.w, sy = bh / PT.h;
  drawPitchLines(c, v => bx + v * sx, v => by + v * sy, sx, sy);
  c.restore();

  // Imanes del campo
  pitchIds().forEach(id => {
    const L = layout[id];
    drawMagnet(c, F, id, L.team, bx + L.x / 100 * bw, by + L.y / 100 * bh, 34, roleAt(L.team, L.y));
  });

  // Banquillos: el del oscuro encima del campo y el del blanco debajo
  [["D", bodyY + pad], ["W", pitchY + bh]].forEach(([team, y0]) => {
    const list = bench[team]; if (!list.length) return;
    c.fillStyle = POSTER_ACC; font("600 18px"); c.letterSpacing = "3px"; c.textBaseline = "middle";
    c.fillText("BANQUILLO", bx + 6, y0 + benchH / 2 - 10); c.letterSpacing = "0px"; c.textBaseline = "alphabetic";
    const step = Math.min(185, (bw - 300) / Math.max(1, list.length - 1));   // si hay muchos, se juntan
    list.forEach((id, i) => drawMagnet(c, F, id, team, bx + 240 + i * step, y0 + benchH / 2 - 22, 28, "SUP"));
  });
  return cv;
}

const imageBlob = cv => new Promise(r => cv.toBlob(r, "image/png"));
