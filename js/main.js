"use strict";
/* Arranque: escucha los cambios de los datos (jugadores, historial, ajustes, apuntados y próximo partido) y pinta la app.
   Cada aviso de db vuelve a calcular el estado y repinta lo que depende de él. */

let firstSignups = false;
/** Sin servidor, la primera vez: se apuntan los primeros que pide el formato, para ver la app en marcha. */
function firstRunSignups() {
  if (firstSignups || !db.firstRun || !loaded || !signupsLoaded || Object.keys(signups).length) return;
  firstSignups = true;
  const t = Date.now();
  P.slice(0, NEED[st.mode]).forEach((p, i) => db.doc("signups/" + p.id).set({ at: new Date(t + i).toISOString(), uid: "local" }));
}

function onPlayers(snap) {
  derivePlayers(snap.docs);
  loaded = true;
  firstRunSignups(); syncBoard();
  render(); renderPlayers(); if (histLoaded) renderStats();
}

function onSignups(snap) {
  signups = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
  signupsLoaded = true;
  firstRunSignups(); syncBoard(); render();
}

function onNext(snap) {
  const d = snap.docs.find(x => x.id === "current");
  applyNext(d ? d.data() : {});
  syncBoard(); render();
}

function onMatches(snap) {
  histLoaded = true;
  matches = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(b.date || b.id).localeCompare(String(a.date || a.id)));
  renderHistory(); renderStats();
}

function onSettings(snap) {
  const d = snap.docs.find(x => x.id === "general");
  settings = d ? Object.assign({}, d.data()) : {};
  paintGroup();
}

/** Con servidor: al saber quién ha entrado (o al entrar o salir), la app pasa a editar o a solo ver. */
function applyRole() {
  document.body.classList.toggle("viewer", !canEdit());
  paintAccount(); showTab(); renderAll();
}

db.collection("settings").onSnapshot(onSettings, () => {});
db.collection("next").onSnapshot(onNext, () => {});
db.collection("signups").onSnapshot(onSignups, () => {});
db.collection("matches").onSnapshot(onMatches, () => { if (!histLoaded) { failed = true; renderHistory(); renderStats(); } });
db.collection("players").onSnapshot(onPlayers, () => { if (!loaded) { failed = true; render(); renderPlayers(); } else toast("Se perdió la conexión con los datos. Recarga la página."); });

document.body.classList.toggle("viewer", !canEdit());
db.onAuth(applyRole);
paintGroup(); paintAccount(); showTab(); render(); renderPlayers(); renderHistory();
window.addEventListener("load", initServiceWorker);
