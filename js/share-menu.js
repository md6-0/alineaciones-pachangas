"use strict";
/* Piezas comunes de los menús Compartir (Partido y Estadísticas): abrir y cerrar el menú, que quepa en la pantalla,
   el enlace de WhatsApp (.s-wa) y el botón Compartir imagen (.s-share). */

/** Si el navegador puede compartir archivos (si no, «Compartir imagen» descarga la imagen). */
const canShareFiles = (() => {
  try {
    const f = new File([new Blob(["x"], { type: "image/png" })], "x.png", { type: "image/png" });
    return !!(navigator.canShare && navigator.canShare({ files: [f] }));
  } catch { return false; }
})();

/** Mete el menú dentro de la pantalla si se sale por un lado (según dónde haya quedado el botón al ajustarse la página). */
function fitMenu(menu) {
  menu.style.transform = "";
  const r = menu.getBoundingClientRect(), W = document.documentElement.clientWidth, m = 8;
  let dx = 0;
  if (r.right > W - m) dx = W - m - r.right;
  if (r.left + dx < m) dx = m - r.left;
  if (dx) menu.style.transform = `translateX(${Math.round(dx)}px)`;
}

/** Prepara el enlace de WhatsApp con un texto. */
function setTextLinks(menu, text) {
  menu.querySelector(".s-wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
}

/** Convierte un botón y su menú en un menú desplegable. open() se llama antes de abrir y, si devuelve false, no se abre.
    Elegir una opción lo cierra, salvo lo que esté dentro de keep (un selector). También se cierra con Escape o con un clic fuera. */
function dropMenu(btn, menu, { open, keep } = {}) {
  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    if (!menu.hidden) { close(); return; }
    if (open && open() === false) return;
    menu.hidden = false; btn.setAttribute("aria-expanded", "true"); fitMenu(menu);
  });
  menu.addEventListener("click", e => { if (e.target.closest("a,button") && !(keep && e.target.closest(keep))) setTimeout(close, 0); });
  document.addEventListener("click", e => { if (!menu.hidden && !menu.parentElement.contains(e.target)) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) close(); });
}

/** Da vida al botón Compartir imagen de un menú: abre el menú de compartir del móvil (WhatsApp, Telegram…) y, donde no lo hay
    (en el ordenador), descarga la imagen. img() → { draw, file, title }; ready() devuelve false (y avisa) si no hay nada. */
function imageButtons(menu, img, ready) {
  menu.querySelector(".s-share").addEventListener("click", async () => {
    if (!ready()) return;
    const i = img(), blob = await imageBlob(await i.draw());
    if (!canShareFiles) { saveFile(i.file, blob); toast("Imagen guardada."); return; }
    try { await navigator.share({ files: [new File([blob], i.file, { type: "image/png" })], title: i.title }); }
    catch (e) { if (e && e.name !== "AbortError") toast("No se pudo compartir la imagen."); }
  });
}
