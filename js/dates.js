"use strict";
/* Día del partido: el que elige quien organiza (st.date, llega con next/current), también si es anterior a hoy; si no hay, hoy.
   Para cambiarlo: setMatchWhen (next-match.js), que cambia a la vez el día y la hora. */

/** Fecha elegida, o null si no hay. Se queda aunque ya haya pasado, hasta que se quite con «Hoy» o se elija otra. */
const customDate = () => st.date ? fromIso(st.date) : null;
/** Día del partido (a mediodía). */
function matchDay() {
  const c = customDate(); if (c) return c;
  const d = new Date(); d.setHours(12, 0, 0, 0); return d;
}
const matchDayName = () => WEEKDAYS[matchDay().getDay()];
/** «Sábado 7 mar», para el título y la alineación compartida. */
const matchDayLabel = () => { const d = matchDay(); return `${matchDayName()} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
/** «Domingo 15 nov · 12:00» (sin hora si no la hay). */
const matchWhen = () => [matchDayLabel(), st.time].filter(Boolean).join(" · ");

