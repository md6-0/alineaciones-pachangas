"use strict";
/* Plantilla de ejemplo de la primera visita: 24 jugadores (suficientes para cualquier formato),
   para poder probar la app sin preparar nada. */

function sampleSquad() {
  const pos = [["POR"], ["DEF"], ["DEF"], ["DEF", "MED"], ["MED"], ["MED"], ["MED", "ATQ"], ["ATQ"], ["ATQ"], ["DEF"], ["MED"], ["ATQ"], ["POR", "DEF"], ["DEF", "MED", "ATQ"],
               ["POR"], ["DEF"], ["DEF"], ["MED"], ["MED", "ATQ"], ["ATQ"], ["DEF", "MED"], ["MED"], ["ATQ"], ["DEF"]];
  const atq = [55, 58, 62, 70, 74, 78, 82, 85, 80, 60, 72, 76, 50, 68, 52, 57, 61, 73, 79, 83, 66, 71, 77, 59];
  const def = [60, 82, 78, 74, 70, 64, 60, 55, 58, 76, 68, 62, 70, 72, 58, 80, 75, 69, 61, 54, 73, 66, 57, 79];
  const por = [84, 55, 50, 52, 48, 50, 45, 40, 42, 50, 46, 44, 72, 55, 80, 52, 49, 47, 44, 41, 51, 46, 43, 53];
  const players = {};
  pos.forEach((p, i) => { players["jugador-" + (i + 1)] = { name: "Jugador " + (i + 1), atq: atq[i], def: def[i], por: por[i], pos: p, order: i + 1 }; });
  return { players };
}
