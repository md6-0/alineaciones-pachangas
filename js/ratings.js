"use strict";
/* Medias de los jugadores (solo quien organiza). No toca la pantalla.
   ratings/{id del jugador} = { media: 1-99 }   (la pone quien organiza)
   Las reglas de Firebase solo dejan leerlas a quien organiza: los demás no las descargan y nunca ven un número.
   Quien no tiene media cuenta como RATING_DEFAULT. El reparto de equipos la usa para igualarlos; como los demás no
   pueden leerla, quien organiza guarda el reparto en next/current.split y los demás usan ese. */

const RATING_DEFAULT = 70;

let ratings = {}, ratingsLoaded = false, ratingsFailed = false, offRatings = null;

/** Media del jugador (1-99), o null si no tiene. */
function mediaOf(id) {
  const m = ratings[id] && ratings[id].media;
  return Number.isInteger(m) && m >= 1 && m <= 99 ? m : null;
}
/** Lo que vale un jugador para el reparto (solo si se pueden leer las medias). */
const ratingOf = id => { const m = mediaOf(id); return m === null ? RATING_DEFAULT : m; };

/** Color de la carta: bronce, plata, oro y azul de 90 para arriba. */
const tierOf = m => m >= 90 ? "blue" : m >= 75 ? "gold" : m >= 65 ? "silver" : "bronze";

/** Pone la media de un jugador (null la quita). Se aplica al momento, sin esperar al servidor. */
function setMedia(id, m) {
  if (m === null) { delete ratings[id]; return db.doc("ratings/" + id).delete(); }
  ratings[id] = { media: m };
  return db.doc("ratings/" + id).set({ media: m });
}

/** Escucha las medias solo mientras se puede editar (con servidor, al entrar; al salir se olvidan). */
function watchRatings() {
  if (canEdit() && !offRatings) {
    offRatings = db.collection("ratings").onSnapshot(s => {
      ratings = Object.fromEntries(s.docs.map(d => [d.id, d.data()]));
      ratingsLoaded = true; ratingsFailed = false;
      syncBoard(); render(); renderPlayers();
    }, () => { ratingsFailed = true; renderPlayers(); });
  } else if (!canEdit() && offRatings) {
    offRatings(); offRatings = null;
    ratings = {}; ratingsLoaded = false; ratingsFailed = false;
  }
}

/* ---------- Reparto compartido ---------- */

let sharedSplit = null;   // next/current.split: { W: [ids], D: [ids] }, el reparto con medias que guarda quien organiza

/** Equipos guardados por quien organiza, si son justo los apuntados de ahora (para quien no puede leer las medias). */
function sharedTeams(list) {
  if (ratingsLoaded || !sharedSplit || !Array.isArray(sharedSplit.W) || !Array.isArray(sharedSplit.D)) return null;
  const ids = list.map(p => p.id).sort().join("|"), saved = sharedSplit.W.concat(sharedSplit.D).sort().join("|");
  if (ids !== saved) return null;
  return { A: list.filter(p => sharedSplit.W.includes(p.id)), B: list.filter(p => sharedSplit.D.includes(p.id)) };
}

/** Quien organiza, con las medias cargadas: si el reparto automático ha cambiado, lo guarda para que lo vean igual los demás. */
function shareSplit() {
  if (!db.cloud || !canEdit() || !ratingsLoaded) return;
  const split = { W: idsOf("W").sort(), D: idsOf("D").sort() };
  if (sharedSplit && JSON.stringify(sharedSplit) === JSON.stringify(split)) return;
  sharedSplit = split;
  saveNext().catch(() => {});
}
