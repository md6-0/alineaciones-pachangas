"use strict";
/* Piezas comunes de los menús Compartir (Alineación y Estadísticas): abrir y cerrar el menú, que quepa en la pantalla,
   los enlaces de WhatsApp y Telegram y los tres botones de imagen (descargar, compartir y ver).
   Cada menú marca sus piezas con clases: .s-wa, .s-tg, .s-dl, .s-share y .s-view. */

/** Si el navegador puede compartir archivos (si no, «Compartir imagen» no aparece). */
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

/** Prepara los enlaces de WhatsApp y Telegram con un texto (en Telegram, la primera línea va como título). */
function setTextLinks(menu, text) {
  const [first, ...rest] = text.split("\n");
  menu.querySelector(".s-wa").href = "https://wa.me/?text=" + encodeURIComponent(text);
  menu.querySelector(".s-tg").href = "https://t.me/share/url?url=" + encodeURIComponent(first) + "&text=" + encodeURIComponent(rest.join("\n"));
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

/** Da vida a los botones de imagen de un menú. img() → { draw, file, title }; ready() devuelve false (y avisa) si no hay nada que enseñar. */
function imageButtons(menu, img, ready) {
  const share = menu.querySelector(".s-share");
  if (canShareFiles) share.hidden = false;
  share.addEventListener("click", async () => {
    if (!ready()) return;
    const i = img(), file = new File([await imageBlob(await i.draw())], i.file, { type: "image/png" });
    try { await navigator.share({ files: [file], title: i.title }); }
    catch (e) { if (e && e.name !== "AbortError") toast("No se pudo compartir la imagen."); }
  });
  menu.querySelector(".s-view").addEventListener("click", async () => {
    if (!ready()) return;
    showImage((await img().draw()).toDataURL("image/png"));
  });
  menu.querySelector(".s-dl").addEventListener("click", async () => {
    if (!ready()) return;
    const i = img();
    saveFile(i.file, await imageBlob(await i.draw()));
    toast("Imagen guardada.");
  });
}
