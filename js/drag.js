"use strict";
/* Arrastrar imanes con el dedo o el ratón: al campo (salta al hueco más cercano) o a un banquillo.
   Un toque sin mover (menos de 4 px) no hace nada. */

let drag = null;

function startDrag(e) {
  const c = e.target.closest(".mag"); if (!c || e.button > 0 || !canEdit()) return;
  e.preventDefault();
  drag = { el: c, n: c.dataset.n, sx: e.clientX, sy: e.clientY, moved: false };
  try { c.setPointerCapture(e.pointerId); } catch {}
}

/** Campo o banquillo bajo el dedo. */
function dropTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  return el ? el.closest(".board,.bench") : null;
}
const clearOver = () => $$(".over").forEach(x => x.classList.remove("over"));

function moveDrag(e) {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
  if (!drag.moved) { drag.moved = true; drag.el.classList.add("dragging"); }
  drag.el.style.left = e.clientX + "px"; drag.el.style.top = e.clientY + "px";
  clearOver();
  const t = dropTarget(e); if (t) t.classList.add("over");
}

function endDrag(e) {
  if (!drag) return;
  const d = drag; drag = null;
  clearOver();
  if (d.moved && layout[d.n]) {
    const t = dropTarget(e);
    if (t && t.classList.contains("board")) {
      const r = t.getBoundingClientRect();
      dropOnPitch(d.n, (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, pitch().h / pitch().w);
    } else if (t) dropOnBench(d.n, t.dataset.team);
    if (t) keepBoard().catch(() => toast("No se pudo guardar la alineación."));   // la ven todos
  }
  render();
}

$("#board").addEventListener("pointerdown", startDrag);
$("#teams").addEventListener("pointerdown", startDrag);
document.addEventListener("pointermove", moveDrag);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
