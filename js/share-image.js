"use strict";
/* Imagen de la alineación para compartir (1080 px de ancho): el campo con los imanes y los banquillos.
   Lleva nombres y posiciones. */

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
function drawMagnet(c, F, id, team, x, y, r, role, pill) {
  const n = nameOf(id);
  c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 14; c.shadowOffsetY = 5;
  c.beginPath(); c.arc(x, y, r, 0, 7);
  c.fillStyle = team === "W" ? "#f5f4ef" : "#1b1e21"; c.fill(); c.restore();
  if (team === "W") { c.strokeStyle = "#cfcec6"; c.lineWidth = 2; c.stroke(); }
  if (team === "D") { c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.stroke(); }
  c.fillStyle = team === "W" ? "#16191a" : "#f1f1ee";
  c.font = `700 ${Math.round(r * .58)}px ${F}`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(role, x, y + 1);
  c.font = `600 ${pill ? 25 : 23}px ${F}`;
  const tw = c.measureText(n).width + 20, ly = y + r + 9;
  c.fillStyle = pill ? "rgba(0,0,0,.5)" : "#16191a"; roundRect(c, x - tw / 2, ly, tw, 34, 6); c.fill();
  c.fillStyle = "#fff"; c.fillText(n, x, ly + 18);
  c.textAlign = "left"; c.textBaseline = "alphabetic";
}

/** Dibuja la imagen y devuelve el canvas. */
async function drawImage() {
  try { await document.fonts.ready; } catch {}
  const PT = pitch(), W = 1080, M = 40, bw = W - 2 * M, bh = Math.round(bw * PT.h / PT.w), top = 205;
  const benchW = benchIds("W"), benchD = benchIds("D");
  const H = top + bh + 70 + (benchD.length ? 150 : 0) + (benchW.length ? 150 : 0);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = "Archivo, system-ui, sans-serif";

  // Fondo y título
  c.fillStyle = "#1d3327"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#87a090"; c.font = `600 22px ${F}`; c.textBaseline = "alphabetic";
  c.fillText(`${groupName().toUpperCase()}  ·  ${st.mode} VS ${st.mode}`, M, 72);
  c.fillStyle = "#eef3ef"; c.font = `800 56px ${F}`;
  c.fillText(`ALINEACIÓN · ${matchDayLabel().toUpperCase()}`, M, 150);

  // Campo a franjas, recortado con las esquinas redondeadas
  const bx = M, by = top;
  c.save(); roundRect(c, bx, by, bw, bh, 10); c.clip();
  for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#346649" : "#2f5e44"; c.fillRect(bx, by + i * bh / 10, bw, bh / 10 + 1); }
  const sx = bw / PT.w, sy = bh / PT.h;
  drawPitchLines(c, v => bx + v * sx, v => by + v * sy, sx, sy);
  c.restore();

  // Imanes del campo
  pitchIds().forEach(id => {
    const L = layout[id];
    drawMagnet(c, F, id, L.team, bx + L.x / 100 * bw, by + L.y / 100 * bh, 34, roleAt(L.team, L.y), true);
  });

  // Banquillos
  let y = by + bh + 70;
  [["D", benchD], ["W", benchW]].forEach(([team, list]) => {
    if (!list.length) return;
    c.fillStyle = "#cfe3d2"; roundRect(c, M, y - 14, bw, 136, 10); c.fill();
    c.fillStyle = "#2b4b39"; c.font = `700 20px ${F}`; c.fillText("BANQUILLO", M + 20, y + 46);
    let x = M + 190;
    list.forEach(id => { drawMagnet(c, F, id, team, x, y + 40, 28, "SUP", false); x += 150; });
    y += 150;
  });
  return cv;
}

const imageBlob = cv => new Promise(r => cv.toBlob(r, "image/png"));
