"use strict";
/* Constantes del juego: equipos, formatos, formaciones y posiciones. */

const TEAMS = { W: "Equipo Blanco", D: "Equipo Oscuro" };
const SIDES = ["W", "D"];
const other = team => team === "W" ? "D" : "W";

/** Formaciones de cada formato (la primera es la de por defecto) y jugadores necesarios para completarlo. */
const FORMS = { "7": ["2-3-1", "3-2-1", "2-2-2", "3-1-2"], "8": ["3-3-1", "3-2-2", "2-3-2", "2-4-1"], "11": ["4-4-2", "4-3-3", "3-5-2", "4-5-1"] };
const NEED = { "7": 14, "8": 16, "11": 22 };

/** Posiciones de un jugador, en el orden en que se muestran. SUP es el suplente (banquillo) en el historial. */
const POSITIONS = ["POR", "DEF", "MED", "ATQ"];
const ROLE_ORDER = ["POR", "DEF", "MED", "ATQ", "SUP"];
/** Distancia de cada línea a la portería propia, en % del largo del campo. */
const DIST = { GK: 6, DEF: 18, MED: 30.5, ATQ: 43.5 };

const DEFAULT_GROUP = "Mi pachanga ⚽";
