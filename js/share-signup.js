"use strict";
/* Lista para apuntarse por WhatsApp: día y hora del partido y un hueco numerado por cada jugador del formato,
   con los que ya se han apuntado en la app (por orden de llegada); si sobran, siguen numerados debajo. */

/** Mensaje para apuntarse. */
function signupText() {
  const head = ["⚽ Pachanga", matchWhen()].join(" · ");
  const names = signupIds().map(nameOf);
  const slots = Array.from({ length: Math.max(st.mode * 2, names.length) }, (_, i) => `${i + 1}. ${names[i] || ""}`.trimEnd());
  return [head, "", "", ...slots].join("\n");
}

// El enlace se prepara al pulsarlo, con el día, la hora y el formato de ese momento
$("#signup").addEventListener("click", e => {
  e.currentTarget.href = "https://wa.me/?text=" + encodeURIComponent(signupText());
});
