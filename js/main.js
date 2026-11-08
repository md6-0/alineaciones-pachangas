"use strict";
/* Arranque: escucha los cambios de los datos (jugadores, historial y ajustes) y pinta la app.
   Cada aviso de db vuelve a calcular el estado y repinta lo que depende de él. */

/** Al abrir la app, la pizarra carga la última alineación guardada (cuando ya han llegado jugadores e historial). */
function autoLoadLatest() {
  if (autoLoaded || !loaded || !histLoaded || !matches.length || !P.length) return;
  autoLoaded = true;
  loadMatch(matches[0], true);
}

function onPlayers(snap) {
  derivePlayers(snap.docs);
  const ids = new Set(P.map(p => p.id));
  if (!loaded) {
    loaded = true;
    if (!Array.isArray(st.sel)) st.sel = P.slice(0, NEED[st.mode]).map(p => p.id);   // primera vez: los primeros que pide el formato
    st.sel = st.sel.filter(id => ids.has(id)); save(); rebuild();
  } else {
    // Si se ha quitado a alguien convocado o en la pizarra, se rehace el reparto
    const before = st.sel.length;
    st.sel = st.sel.filter(id => ids.has(id));
    const gone = Object.keys(layout).some(k => !ids.has(k));
    if (gone || before !== st.sel.length) { save(); rebuild(); }
  }
  render(); renderPlayers(); if (histLoaded) renderStats(); autoLoadLatest();
}

function onMatches(snap) {
  histLoaded = true;
  matches = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(b.date || b.id).localeCompare(String(a.date || a.id)));
  renderHistory(); renderStats(); autoLoadLatest();
}

function onSettings(snap) {
  const d = snap.docs.find(x => x.id === "general");
  settings = d ? Object.assign({}, d.data()) : {};
  paintGroup();
}

db.collection("settings").onSnapshot(onSettings, () => {});
db.collection("matches").onSnapshot(onMatches, () => { if (!histLoaded) { failed = true; renderHistory(); renderStats(); } });
db.collection("players").onSnapshot(onPlayers, () => { if (!loaded) { failed = true; render(); renderPlayers(); } else toast("Se perdió la conexión con los datos. Recarga la página."); });

paintGroup(); applyRatings(); showTab(); render(); renderPlayers(); renderHistory();
window.addEventListener("load", initServiceWorker);
