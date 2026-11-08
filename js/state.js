"use strict";
/* Estado de la app en memoria y preferencias guardadas en este dispositivo. */

/* ---------- Preferencias (localStorage, clave pach-v4) ---------- */
const PREFS_KEY = "pach-v4";
let st = {
  me: null,           // quién eres (id del jugador), para apuntarte desde este dispositivo
  // Lo siguiente es del próximo partido y llega del servidor (next/current, ver next-match.js); aquí queda lo último que llegó
  date: null,         // día del partido (2026-11-05) o null para hoy
  time: null,         // hora del partido ("12:00") o null
  mode: "8",          // formato: "7", "8" u "11" (por defecto, 8 vs 8)
  form: { W: { "7": "2-3-1", "8": "3-3-1" }, D: { "7": "2-3-1", "8": "3-3-1" } },   // formación de cada equipo en cada formato
  tab: "alin",        // pestaña abierta
  img: "lineup"       // qué se comparte (texto e imagen): "lineup" (la alineación) o "teams" (solo los jugadores de cada equipo)
};
try { const s = JSON.parse(localStorage.getItem(PREFS_KEY) || "null"); if (s && typeof s === "object") st = Object.assign(st, s); } catch {}
["ratings", "sort", "sel", "myName", "datePast"].forEach(k => delete st[k]);   // preferencias de versiones anteriores
SIDES.forEach(t => { st.form[t] = st.form[t] || {}; Object.keys(FORMS).forEach(m => { if (!FORMS[m].includes(st.form[t][m])) st.form[t][m] = FORMS[m][0]; }); });
if (!FORMS[st.mode]) st.mode = "8";
// Las direcciones #jugadores, #historial… abren esa pestaña
const HASH_TABS = { "#jugadores": "jug", "#historial": "hist", "#estadisticas": "stats", "#opciones": "opc" };
if (HASH_TABS[location.hash]) st.tab = HASH_TABS[location.hash];

const save = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(st)); } catch {} };

/* ---------- Datos (llegan de db.js) ---------- */
let loaded = false;      // ya han llegado los jugadores
let histLoaded = false;  // ya ha llegado el historial
let failed = false;      // no se pudieron leer los datos
let rawPlayers = {};     // jugadores tal como están guardados (para la copia de seguridad y el borrado)
let P = [];              // jugadores ya calculados (ver players.js), en el orden de la lista
let BY = {};             // los mismos, por id
let matches = [];        // partidos del historial, del más reciente al más antiguo
let settings = {};       // ajustes compartidos con los datos (nombre del grupo)

/* ---------- Pizarra ---------- */
// Dónde está cada apuntado: { id: { team: "W"|"D", zone: "pitch", x, y } } o { team, zone: "bench" }. x e y en % del campo.
let layout = {};
let seed = 0;            // qué opción de reparto se muestra (llega con next/current)

const nameOf = id => BY[id] ? BY[id].n : id;
