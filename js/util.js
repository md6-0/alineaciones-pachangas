"use strict";
/* Utilidades generales (DOM, texto, fechas y descargas).
   No saben nada de jugadores, equipos ni de la interfaz concreta de la app. */

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

/** Escapa un texto para meterlo en HTML. */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** «1 jugador», «3 jugadores». */
const cnt = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Limita un número entre dos valores. */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Copia profunda de datos sencillos (lo que se guarda en JSON). */
const clone = v => JSON.parse(JSON.stringify(v));

/** Si el foco está en un campo de texto (para no recargar ni repintar mientras se escribe). */
const editing = () => { const a = document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "file"; };

/* ---------- Fechas ---------- */

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha como 2026-11-05, en la hora local. */
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayIso = () => isoDate(new Date());
/** 2026-11-05 → Date a mediodía (así no le afectan los cambios de hora). */
const fromIso = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d, 12); };
/** Hoy a las 00:00. */
const startOfToday = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
/** «Jueves 5 nov 2026». */
const fmtDate = iso => { const dt = fromIso(iso); return `${WEEKDAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`; };

/* ---------- Archivos ---------- */

/** Descarga un archivo (texto o Blob) con el nombre indicado. */
function saveFile(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: filename.endsWith(".json") ? "application/json" : "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
