"use strict";
/* Lista para apuntarse por WhatsApp: día y hora del partido y un hueco numerado por cada jugador del formato.
   Si has puesto tu nombre en Opciones, sales ya apuntado en el primero. */

/** Mensaje para apuntarse. */
function signupText() {
  const head = ["⚽ Pachanga", matchDayLabel(), st.time].filter(Boolean).join(" · ");
  const me = (st.myName || "").trim();
  const slots = Array.from({ length: st.mode * 2 }, (_, i) => `${i + 1}. ${i === 0 ? me : ""}`.trimEnd());
  return [head, "", "", ...slots].join("\n");
}

// El enlace se prepara al pulsarlo, con el día, la hora y el formato de ese momento
$("#signup").addEventListener("click", e => {
  e.currentTarget.href = "https://wa.me/?text=" + encodeURIComponent(signupText());
});
