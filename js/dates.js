"use strict";
/* Día del partido: el que elige quien organiza (st.date, llega con next/current) mientras no haya pasado; si no, hoy.
   Para cambiarlo: setMatchDate (next-match.js). */

/** Fecha elegida, o null si no hay o ya pasó. */
function customDate() {
  if (!st.date) return null;
  const dt = fromIso(st.date);
  return dt >= startOfToday() ? dt : null;
}
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

