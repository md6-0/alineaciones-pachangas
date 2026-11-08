"use strict";
/* Constantes del juego: equipos, formatos, formaciones y posiciones. */

const TEAMS = { W: "Equipo Blanco", D: "Equipo Oscuro" };
const SIDES = ["W", "D"];
const other = team => team === "W" ? "D" : "W";

/** Formación fija de cada formato (la misma para los dos equipos) y jugadores necesarios para completarlo. */
const FORMS = { "7": "3-2-1", "8": "3-3-1", "11": "4-2-3-1" };
const NEED = { "7": 14, "8": 16, "11": 22 };

/** Posiciones de un jugador, en el orden en que se muestran. SUP es el suplente (banquillo) en el historial. */
const POSITIONS = ["POR", "DEF", "MED", "ATQ"];
const ROLE_ORDER = ["POR", "DEF", "MED", "ATQ", "SUP"];
/** Distancia a la portería propia, en % del largo del campo: del portero y de cada línea según cuántas tenga la formación
    (3: defensa, medio y ataque; 4, como el 4-2-3-1: defensa, pivotes, mediapuntas y ataque). */
const DIST = { GK: 6 };
const LINES = {
  3: [["DEF", 18], ["MED", 30.5], ["ATQ", 43.5]],
  4: [["DEF", 15], ["MED", 24.5], ["MED", 34.5], ["ATQ", 44.5]]
};

const DEFAULT_GROUP = "Mi pachanga ⚽";
