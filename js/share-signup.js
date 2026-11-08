"use strict";
/* Lista para apuntarse por WhatsApp: el día del partido y huecos numerados (los jugadores del formato y unas reservas). */

const SIGNUP_RESERVES = 3;

/** Mensaje para apuntarse, con huecos vacíos. */
function signupText() {
  const n = st.mode * 2, slots = k => Array.from({ length: k }, (_, i) => `${i + 1}. `);
  return [`⚽ Pachanga · ${matchDayLabel()} (${st.mode} vs ${st.mode})`,
    "",
    ...slots(n), "", "Reservas", ...slots(SIGNUP_RESERVES)].join("\n");
}

// El enlace se prepara al pulsarlo, con el día y el formato de ese momento
$("#signup").addEventListener("click", e => {
  e.currentTarget.href = "https://wa.me/?text=" + encodeURIComponent(signupText());
});
