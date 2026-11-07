"use strict";
/* Menú Compartir: la alineación en texto (WhatsApp, Telegram) o en imagen (descargar, compartir o ver).
   La imagen puede ser la alineación en el campo o solo los jugadores de cada equipo (selector «Imagen»). */

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

const smenu = $("#smenu"), sbtn = $("#sharebtn");
/** Mete el menú dentro de la pantalla si se sale por un lado (según dónde haya quedado el botón al ajustarse la cabecera). */
function fitMenu() {
  smenu.style.transform = "";
  const r = smenu.getBoundingClientRect(), W = document.documentElement.clientWidth, m = 8;
  let dx = 0;
  if (r.right > W - m) dx = W - m - r.right;
  if (r.left + dx < m) dx = m - r.left;
  if (dx) smenu.style.transform = `translateX(${Math.round(dx)}px)`;
}
function closeMenu() { smenu.hidden = true; sbtn.setAttribute("aria-expanded", "false"); }
/** Avisa y devuelve false si todavía no hay alineación. */
function needLineup(msg = "Marca jugadores antes de compartir.") { if (hasLineup()) return true; toast(msg); return false; }

sbtn.addEventListener("click", e => {
  e.stopPropagation();
  if (!smenu.hidden) { closeMenu(); return; }
  if (!needLineup()) return;
  const t = lineupText(), [first, ...rest] = t.split("\n");
  $("#s-wa").href = "https://wa.me/?text=" + encodeURIComponent(t);
  $("#s-tg").href = "https://t.me/share/url?url=" + encodeURIComponent(first) + "&text=" + encodeURIComponent(rest.join("\n"));
  smenu.hidden = false; sbtn.setAttribute("aria-expanded", "true"); fitMenu();
});
smenu.addEventListener("click", e => { if (e.target.closest("a,button") && !e.target.closest("#imgseg")) setTimeout(closeMenu, 0); });

/* ---------- Qué imagen: alineación o equipos ---------- */
const IMAGES = {
  lineup: { draw: () => drawImage(), file: "pachanga-alineaciones.png", title: "Alineación" },
  teams: { draw: () => drawTeamsImage(), file: "pachanga-equipos.png", title: "Equipos" }
};
const image = () => IMAGES[st.img] || IMAGES.lineup;
function paintImgSeg() { $$("#imgseg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.img === (IMAGES[st.img] ? st.img : "lineup")))); }
$("#imgseg").addEventListener("click", e => {
  const b = e.target.closest("button[data-img]"); if (!b) return;
  st.img = b.dataset.img; save(); paintImgSeg();
});
paintImgSeg();
document.addEventListener("click", e => { if (!smenu.hidden && !e.target.closest(".share")) closeMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !smenu.hidden) closeMenu(); });

// «Compartir imagen» solo aparece si el navegador puede compartir archivos
try {
  const f = new File([new Blob(["x"], { type: "image/png" })], "x.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) $("#shareimg").hidden = false;
} catch {}

$("#shareimg").addEventListener("click", async () => {
  if (!needLineup()) return;
  const img = image(), file = new File([await imageBlob(await img.draw())], img.file, { type: "image/png" });
  try { await navigator.share({ files: [file], title: img.title }); }
  catch (e) { if (e && e.name !== "AbortError") toast("No se pudo compartir la imagen."); }
});

$("#viewimg").addEventListener("click", async () => {
  if (!needLineup()) return;
  showImage((await image().draw()).toDataURL("image/png"));
});

$("#export").addEventListener("click", async () => {
  if (!needLineup("Marca jugadores antes de exportar.")) return;
  const img = image();
  saveFile(img.file, await imageBlob(await img.draw()));
  toast("Imagen guardada.");
});
