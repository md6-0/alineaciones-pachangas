"use strict";
/* Piezas de interfaz reutilizables: avisos y botones que piden confirmación. */

const LOAD_ERROR = "No se pudieron leer los datos guardados en este navegador.";

/** Aviso breve arriba; se cierra solo a los 3,5 s o al tocarlo. */
function toast(msg) {
  const t = $("#toast");
  t.hidden = true; void t.offsetWidth;   // reinicia la animación si ya había uno
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3500);
}

/** Botón que pide confirmación: la primera pulsación lo «arma» (cambia el texto) y devuelve false;
    la segunda, dentro de ms milisegundos, devuelve true. Pasado ese tiempo vuelve a su texto. */
function confirmFirst(btn, armedText, ms) {
  if (btn.classList.contains("arm")) return true;
  const label = btn.textContent;
  btn.classList.add("arm"); btn.textContent = armedText;
  setTimeout(() => { if (btn.isConnected && !btn.disabled && btn.classList.contains("arm")) disarm(btn, label); }, ms);
  return false;
}
function disarm(btn, label) { btn.classList.remove("arm"); btn.textContent = label; }

$("#toast").addEventListener("click", () => { $("#toast").hidden = true; });
