"use strict";
/* Día del partido: el elegido en Opciones mientras no haya pasado; si no, hoy.
   Si viene de cargar un partido pasado del historial, vale aunque haya pasado (hasta volver a abrir la app). */

/** Fecha elegida, o null si no hay o ya pasó. */
function customDate() {
  if (!st.date) return null;
  const dt = fromIso(st.date);
  return (dt >= startOfToday() || st.datePast) ? dt : null;
}
/** Día del partido (a mediodía). */
function matchDay() {
  const c = customDate(); if (c) return c;
  const d = new Date(); d.setHours(12, 0, 0, 0); return d;
}
const matchDayName = () => WEEKDAYS[matchDay().getDay()];
/** «Sábado 7 mar», para el título y la alineación compartida. */
const matchDayLabel = () => { const d = matchDay(); return `${matchDayName()} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

/** Elige la fecha del partido (null para hoy). */
function setMatchDate(iso, past = false) {
  st.date = iso && ISO_DATE.test(iso) ? iso : null; st.datePast = past; save();
}
