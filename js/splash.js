"use strict";
/* Pantalla de inicio (el balón): se va con un fundido en cuanto la app ha pintado los datos.
   Si algo fallara, se va sola a los 4 s para no dejar la app tapada. */

function hideSplash() {
  const s = $("#splash");
  if (!s || s.classList.contains("out")) return;
  s.classList.add("out");
  setTimeout(() => s.remove(), 400);
}
setTimeout(hideSplash, 4000);
