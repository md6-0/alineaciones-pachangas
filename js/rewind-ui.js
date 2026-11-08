"use strict";
/* Rewind en pantalla: el recuadro de Estadísticas (quien organiza lo ve y lo publica; los demás, cuando está publicado)
   y las historias a pantalla completa (tocar a la derecha avanza, a la izquierda vuelve). Cada historia se puede
   compartir como imagen vertical (1080 × 1920). Las historias las escribe rewind.js. */

const RW_COLORS = [["#1d3327", "#2f6b4a"], ["#3a1f4d", "#7a3f8f"], ["#4a2412", "#b0582a"], ["#10304a", "#2c7aa8"],
  ["#4a3a10", "#b08a1e"], ["#4a1520", "#a83246"], ["#183a3a", "#2c8a80"]];
let rw = null;   // { year, cards, i }

/* ---------- Recuadro en Estadísticas ---------- */

function renderRewindBox() {
  const box = $("#rwbox"), years = histLoaded ? rewindYears() : [], pub = publishedRewind();
  if (!canEdit()) {
    box.innerHTML = pub && years.includes(pub) ? `<button class="rwopen" type="button" data-rw="${pub}"><span>🎬</span><b>Pachanga Rewind ${pub}</b><small>El año de la pachanga, en historias</small></button>` : "";
    return;
  }
  if (!years.length) { box.innerHTML = ""; return; }
  const sel = years.includes(rwBoxYear) ? rwBoxYear : years[0];
  box.innerHTML = `<section class="rwadmin"><h2>🎬 Rewind del año</h2>
    <div class="btns"><select id="rwyear" aria-label="Año">${years.map(y => `<option${y === sel ? " selected" : ""}>${y}</option>`).join("")}</select>
      <button class="btn ghost" type="button" data-rw="${sel}">Ver</button>
      ${pub === sel ? `<button class="btn ghost" type="button" id="rwpub" data-pub="">Retirar</button>` : `<button class="btn" type="button" id="rwpub" data-pub="${sel}">Publicar para todos</button>`}</div>
    <p class="hint">${pub ? `Publicado: el de ${pub}. Todos lo ven en Estadísticas.` : "Sin publicar: solo lo ves tú. Revísalo y publícalo cuando quieras."}</p></section>`;
}
let rwBoxYear = null;

$("#rwbox").addEventListener("change", e => { if (e.target.id === "rwyear") { rwBoxYear = e.target.value; renderRewindBox(); } });
$("#rwbox").addEventListener("click", e => {
  const open = e.target.closest("[data-rw]");
  if (open) { openRewind(open.dataset.rw); return; }
  const pub = e.target.closest("#rwpub");
  if (pub) setRewind(pub.dataset.pub || null)
    .then(() => { toast(pub.dataset.pub ? `Rewind ${pub.dataset.pub} publicado: ya lo ven todos.` : "Rewind retirado."); renderRewindBox(); })
    .catch(() => toast("No se pudo guardar."));
});

/* ---------- Historias ---------- */

function openRewind(year) {
  const cards = rewindCards(year);
  if (!cards) { toast("Ese año no hay partidos."); return; }
  rw = { year, cards, i: 0 };
  $("#rw").hidden = false; document.body.classList.add("rw-on");
  paintRewind();
}
function closeRewind() { rw = null; $("#rw").hidden = true; document.body.classList.remove("rw-on"); }
function stepRewind(d) {
  if (!rw) return;
  const i = rw.i + d;
  if (i >= rw.cards.length) { closeRewind(); return; }
  rw.i = Math.max(0, i); paintRewind();
}

function cardHTML(c) {
  if (c.kind === "squad") return `<p class="rwk">${esc(c.kicker)}</p><div class="rwsquad">${c.cromos.map(k =>
    `<div class="cromo"><b>${esc(k.name)}</b><span class="nick">${esc(k.nick)}</span><small>${esc(k.stats)}</small></div>`).join("")}</div>`;
  return `<div class="rwe">${c.emoji}</div><p class="rwk">${esc(c.kicker)}</p><h2 class="rwt">${esc(c.title)}</h2>`
    + (c.big ? `<p class="rwb">${esc(c.big)}</p>` : "") + (c.sub ? `<p class="rws">${esc(c.sub)}</p>` : "")
    + (c.lines.length ? `<ul class="rwl">${c.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : "");
}

function paintRewind() {
  const c = rw.cards[rw.i], [a, b] = RW_COLORS[rw.i % RW_COLORS.length];
  $("#rw").style.background = `linear-gradient(160deg,${a},${b})`;
  $("#rwbars").innerHTML = rw.cards.map((_, i) => `<i class="${i < rw.i ? "done" : i === rw.i ? "now" : ""}"></i>`).join("");
  $("#rwcard").innerHTML = cardHTML(c);
}

$("#rwprev").addEventListener("click", () => stepRewind(-1));
$("#rwnext").addEventListener("click", () => stepRewind(1));
$("#rwclose").addEventListener("click", closeRewind);
document.addEventListener("keydown", e => {
  if (!rw) return;
  if (e.key === "Escape") closeRewind(); else if (e.key === "ArrowRight") stepRewind(1); else if (e.key === "ArrowLeft") stepRewind(-1);
});
$("#rwshare").addEventListener("click", async e => {
  e.stopPropagation();
  if (!rw) return;
  const blob = await imageBlob(drawRewindCard(rw.cards[rw.i], rw.i)), file = `pachanga-rewind-${rw.year}-${rw.i + 1}.png`;
  if (!canShareFiles) { saveFile(file, blob); toast("Imagen guardada."); return; }
  try { await navigator.share({ files: [new File([blob], file, { type: "image/png" })], title: `Pachanga Rewind ${rw.year}` }); }
  catch (err) { if (err && err.name !== "AbortError") toast("No se pudo compartir la imagen."); }
});

/* ---------- Imagen de una historia (1080 × 1920) ---------- */

/** Escribe un texto centrado en varias líneas si no cabe; devuelve dónde acaba. */
function wrapCenter(c, text, x, y, max, lh) {
  const words = String(text).split(" "); let line = "";
  words.forEach(w => {
    const t = line ? line + " " + w : w;
    if (c.measureText(t).width > max && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t;
  });
  if (line) { c.fillText(line, x, y); y += lh; }
  return y;
}

function drawRewindCard(card, i) {
  const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), F = "Archivo, system-ui, sans-serif", [a, b] = RW_COLORS[i % RW_COLORS.length];
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#fff";
  let y;
  if (card.kind === "squad") {
    c.globalAlpha = .75; c.font = `700 40px ${F}`; c.fillText(card.kicker.toUpperCase(), W / 2, 300); c.globalAlpha = 1;
    y = 400;
    card.cromos.forEach(k => {
      c.fillStyle = "rgba(255,255,255,.12)"; roundRect(c, 90, y, W - 180, 300, 28); c.fill();
      c.fillStyle = "#fff"; c.font = `800 62px ${F}`; c.fillText(fitText(c, k.name, W - 260), W / 2, y + 100);
      c.font = `600 38px ${F}`; c.fillText(fitText(c, k.nick, W - 260), W / 2, y + 170);
      c.globalAlpha = .75; c.font = `500 34px ${F}`; c.fillText(fitText(c, k.stats, W - 260), W / 2, y + 235); c.globalAlpha = 1;
      y += 340;
    });
  } else {
    c.font = `200px ${F}`; c.fillText(card.emoji, W / 2, 620);
    c.globalAlpha = .75; c.font = `700 44px ${F}`; c.fillText(card.kicker.toUpperCase(), W / 2, 780); c.globalAlpha = 1;
    c.font = `800 104px ${F}`; y = wrapCenter(c, card.title, W / 2, 920, W - 160, 112);
    if (card.big) { c.font = `700 64px ${F}`; y = wrapCenter(c, card.big, W / 2, y + 40, W - 160, 76); }
    if (card.sub) { c.globalAlpha = .85; c.font = `500 46px ${F}`; y = wrapCenter(c, card.sub, W / 2, y + 50, W - 200, 60); c.globalAlpha = 1; }
    if (card.lines.length) { c.font = `600 42px ${F}`; y += 30; card.lines.forEach(l => { y = wrapCenter(c, l, W / 2, y + 20, W - 200, 54); }); }
  }
  c.globalAlpha = .7; c.font = `700 34px ${F}`; c.fillText(`PACHANGA REWIND ${rw ? rw.year : ""} · ${groupName().toUpperCase()}`, W / 2, H - 120); c.globalAlpha = 1;
  return cv;
}
