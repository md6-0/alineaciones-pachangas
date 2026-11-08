"use strict";
/* Plantilla de ejemplo de la primera visita: 24 jugadores (suficientes para cualquier formato),
   para poder probar la app sin preparar nada. */

function sampleSquad() {
  const pos = [["POR"], ["DEF"], ["DEF"], ["DEF", "MED"], ["MED"], ["MED"], ["MED", "ATQ"], ["ATQ"], ["ATQ"], ["DEF"], ["MED"], ["ATQ"], ["POR", "DEF"], ["DEF", "MED", "ATQ"],
               ["POR"], ["DEF"], ["DEF"], ["MED"], ["MED", "ATQ"], ["ATQ"], ["DEF", "MED"], ["MED"], ["ATQ"], ["DEF"]];
  const players = {};
  pos.forEach((p, i) => { players["jugador-" + (i + 1)] = { name: "Jugador " + (i + 1), pos: p, order: i + 1 }; });
  return { players };
}
