"use strict";
/* Menú Compartir: la alineación en texto (WhatsApp, Telegram) o en imagen (descargar, compartir o ver). */

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
  smenu.hidden = false; sbtn.setAttribute("aria-expanded", "true");
});
smenu.addEventListener("click", e => { if (e.target.closest("a,button")) setTimeout(closeMenu, 0); });
document.addEventListener("click", e => { if (!smenu.hidden && !e.target.closest(".share")) closeMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !smenu.hidden) closeMenu(); });

// «Compartir imagen» solo aparece si el navegador puede compartir archivos
try {
  const f = new File([new Blob(["x"], { type: "image/png" })], "x.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) $("#shareimg").hidden = false;
} catch {}

$("#shareimg").addEventListener("click", async () => {
  if (!needLineup()) return;
  const file = new File([await imageBlob(await drawImage())], "pachanga-alineaciones.png", { type: "image/png" });
  try { await navigator.share({ files: [file], title: "Alineación" }); }
  catch (e) { if (e && e.name !== "AbortError") toast("No se pudo compartir la imagen."); }
});

$("#viewimg").addEventListener("click", async () => {
  if (!needLineup()) return;
  showImage((await drawImage()).toDataURL("image/png"));
});

$("#export").addEventListener("click", async () => {
  if (!needLineup("Marca jugadores antes de exportar.")) return;
  saveFile("pachanga-alineaciones.png", await imageBlob(await drawImage()));
  toast("Imagen guardada.");
});
