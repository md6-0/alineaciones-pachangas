"use strict";
/* Rewind del año: los números, los premios y un cromo para cada uno que haya jugado al menos REWIND_MIN partidos.
   No toca la pantalla: rewindCards(año) devuelve las historias ya escritas y rewind-ui.js las enseña.
   Victorias, derrotas y rachas cuentan solo partidos con resultado; los goles y la asistencia, todos los del año. */

const REWIND_MIN = 4;   // partidos para tener cromo y optar a los premios de porcentaje

/** Años con partidos en el historial, del más reciente al más antiguo. */
const rewindYears = () => [...new Set(matches.map(m => String(m.date || m.id).slice(0, 4)).filter(y => /^\d{4}$/.test(y)))].sort().reverse();

/** Todo lo que se cuenta de un año. null si ese año no hay partidos. */
function rewindData(year) {
  const ms = matches.filter(m => String(m.date || m.id).startsWith(year + "-"))
    .sort((a, b) => String(a.date || a.id).localeCompare(String(b.date || b.id)));
  if (!ms.length) return null;
  const R = {}, pairs = {}, rivals = {};
  const get = pl => R[pl.id] || (R[pl.id] = { id: pl.id, name: BY[pl.id] ? BY[pl.id].n : pl.name, pos: BY[pl.id] ? BY[pl.id].pos : [],
    apps: 0, pj: 0, w: 0, d: 0, l: 0, g: 0, cur: 0, best: 0 });
  const key = (a, b) => [a, b].sort().join("|");
  let goals = 0, withResult = 0, winsW = 0, winsD = 0, draws = 0, biggest = null, crazy = null;
  const hattricks = [];

  ms.forEach(m => {
    const res = matchResult(m), sc = m.score || {};
    const side = t => (Array.isArray(m[t]) ? m[t] : []).filter(pl => pl && pl.id);
    if (res) {
      withResult++;
      if (res === "W") winsW++; else if (res === "D") winsD++; else draws++;
      const tot = sc.W + sc.D, diff = Math.abs(sc.W - sc.D);
      if (!biggest || diff > biggest.diff) biggest = { m, diff };
      if (!crazy || tot > crazy.tot) crazy = { m, tot };
      goals += tot;
    }
    SIDES.forEach(t => {
      const team = side(t);
      team.forEach(pl => {
        const r = get(pl); r.apps++;
        if (!res) return;
        r.pj++;
        if (res === t) { r.w++; r.cur++; r.best = Math.max(r.best, r.cur); }
        else { if (res === "draw") r.d++; else r.l++; r.cur = 0; }
      });
      // Parejas del mismo equipo y rivales del otro
      for (let i = 0; i < team.length; i++) for (let j = i + 1; j < team.length; j++) {
        const k = key(team[i].id, team[j].id), p = pairs[k] || (pairs[k] = { a: team[i], b: team[j], n: 0, w: 0 });
        if (res) { p.n++; if (res === t) p.w++; }
      }
      if (t === "W") team.forEach(a => side("D").forEach(b => { const k = key(a.id, b.id); (rivals[k] = rivals[k] || { a, b, n: 0 }).n++; }));
      const g = (m.goals && m.goals[t]) || {};
      Object.keys(g).forEach(id => {
        if (!(g[id] > 0)) return;
        const pl = team.find(p => p.id === id) || { id, name: nameOf(id) };
        get(pl).g += g[id];
        if (g[id] >= 3) hattricks.push({ name: get(pl).name, n: g[id], date: m.date || m.id });
      });
    });
  });
  const people = Object.values(R);
  return { year, ms, people, goals, withResult, winsW, winsD, draws, biggest, crazy, hattricks,
    pairs: Object.values(pairs), rivals: Object.values(rivals) };
}

/* ---------- Premios ---------- */

/** Los mejores según una cuenta (todos los empatados), o [] si el mejor no pasa de min. */
function best(list, score, min = 1) {
  const top = Math.max(-Infinity, ...list.map(score));
  return top >= min ? list.filter(x => score(x) === top) : [];
}
const names = list => list.map(x => x.name);
/** «Ana», «Ana y Luis», «Ana, Luis y Pepe»; con muchos empatados, «Ana, Luis, Pepe y 9 más». */
function joinNames(l) {
  if (l.length > 4) return l.slice(0, 3).join(", ") + ` y ${l.length - 3} más`;
  return l.length <= 1 ? (l[0] || "") : l.slice(0, -1).join(", ") + " y " + l[l.length - 1];
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/** Mote de cada cromo: lo más llamativo de su año (de cachondeo suave). */
function nickname(r, d) {
  const share = r.apps / d.ms.length, wr = r.pj ? r.w / r.pj : 0, gpm = r.g / Math.max(r.apps, 1);
  if (gpm >= 1) return "Delantero centro de los de antes";
  if (gpm >= .5) return "Olfato de gol";
  if (r.pj >= 3 && wr >= .65) return "Talismán: si viene, se gana";
  if (share >= .85) return "No falla ni con fiebre";
  if (r.pj >= 3 && r.d / r.pj >= .3) return "Rey del empate";
  if (r.pos.includes("POR")) return "Manos seguras";
  if (r.pos.includes("DEF") && !r.g) return "Muro: lo suyo es que no pase nadie";
  if (!r.g) return "Generoso: los goles, para los demás";
  if (r.pj >= 3 && wr <= .3) return "Corazón de equipo, aunque el marcador no acompañe";
  return "Pieza clave del vestuario";
}

/** Historias del Rewind de un año: [{ kind, emoji, kicker, title, big, sub, lines }]. null si no hay partidos. */
function rewindCards(year) {
  const d = rewindData(year);
  if (!d) return null;
  const P = d.people, regular = P.filter(r => r.apps >= REWIND_MIN), cards = [];
  const add = c => cards.push(Object.assign({ kind: "award", lines: [] }, c));
  const date = m => fmtDate(m.date || m.id);

  add({ kind: "intro", emoji: "🎬", kicker: groupName(), title: `Pachanga Rewind ${year}`, sub: "Lo que dio de sí el año, por las risas. Toca para seguir." });
  add({ kind: "numbers", emoji: "📊", kicker: "El año en números", title: `${cnt(d.ms.length, "partido", "partidos")}`,
    lines: [`⚽ ${cnt(d.goals, "gol", "goles")}${d.withResult ? ` (${(d.goals / d.withResult).toFixed(1).replace(".", ",")} por partido)` : ""}`, `👟 ${cnt(P.length, "jugador distinto", "jugadores distintos")}`] });
  if (d.withResult) add({ kind: "duel", emoji: "⚪⚫", kicker: "Blanco contra Oscuro", title: `${d.winsW} – ${d.winsD}`,
    sub: d.winsW === d.winsD ? "Empate técnico entre colores. Nadie manda aquí." : `El ${d.winsW > d.winsD ? "Blanco" : "Oscuro"} se lleva el año.`, lines: [`${cnt(d.draws, "empate", "empates")}`] });

  const pich = best(P, r => r.g);
  if (pich.length) add({ emoji: "🥇", kicker: "Pichichi", title: joinNames(names(pich)), big: cnt(pich[0].g, "gol", "goles"), sub: pich.length > 1 ? "Empatados arriba. Que lo decidan a penaltis." : "La red tiembla cuando la ve venir." });
  const fijo = best(P, r => r.apps, 2);
  if (fijo.length) add({ emoji: "📅", kicker: "El fijo", title: joinNames(names(fijo)), big: `${fijo[0].apps} de ${d.ms.length} partidos`, sub: "Llueva, truene o haya boda." });
  const minPj = Math.max(REWIND_MIN, Math.ceil(d.withResult * .3));
  const amu = best(P.filter(r => r.pj >= minPj), r => r.w / r.pj, 1e-9);
  if (amu.length && amu[0].w) add({ emoji: "🍀", kicker: "El amuleto", title: joinNames(names(amu)), big: `${pct(amu[0].w, amu[0].pj)}% de victorias`, sub: `Con al menos ${minPj} partidos con resultado. Fichaje obligatorio.` });
  const racha = best(P, r => r.best, 2);
  if (racha.length) add({ emoji: "🔥", kicker: "La racha", title: joinNames(names(racha)), big: `${racha[0].best} victorias seguidas`, sub: "Imparable. Hasta que paró." });
  const pareja = best(d.pairs.filter(p => p.n >= 3), p => p.w * 1000 + pct(p.w, p.n), 1000);
  if (pareja.length) { const p = pareja[0]; add({ emoji: "🤝", kicker: "La pareja letal", title: `${BY[p.a.id] ? BY[p.a.id].n : p.a.name} y ${BY[p.b.id] ? BY[p.b.id].n : p.b.name}`, big: `${cnt(p.w, "victoria", "victorias")} juntos`, sub: `En ${cnt(p.n, "partido", "partidos")} en el mismo equipo. Separadlos por el bien de la liga.` }); }
  const riv = best(d.rivals, r => r.n, 3);
  if (riv.length) { const r = riv[0]; add({ emoji: "⚔️", kicker: "Enemigos íntimos", title: `${BY[r.a.id] ? BY[r.a.id].n : r.a.name} contra ${BY[r.b.id] ? BY[r.b.id].n : r.b.name}`, big: `${r.n} veces frente a frente`, sub: "El reparto lo quiso así. Fuera del campo, todo bien." }); }
  if (d.biggest && d.biggest.diff >= 3) { const m = d.biggest.m; add({ emoji: "💥", kicker: "La mayor goleada", title: `${m.score.W} – ${m.score.D}`, big: date(m), sub: `Ganó el ${m.score.W > m.score.D ? "Blanco" : "Oscuro"}. Mejor no recordárselo al otro.` }); }
  if (d.crazy && d.crazy.tot >= 8 && d.crazy.m !== (d.biggest && d.biggest.m)) { const m = d.crazy.m; add({ emoji: "🎢", kicker: "El partido más loco", title: `${m.score.W} – ${m.score.D}`, big: date(m), sub: `${cnt(d.crazy.tot, "gol", "goles")} en un solo día. Los porteros aún lo sueñan.` }); }
  if (d.hattricks.length) add({ emoji: "🎩", kicker: "Noches mágicas", title: cnt(d.hattricks.length, "hat-trick", "hat-tricks"), lines: d.hattricks.map(h => `${h.name}: ${h.n} goles · ${fmtDate(h.date)}`) });
  const max = Math.max(0, ...P.map(r => r.apps));
  const missed = max >= 4 ? best(P, r => -r.apps, -Infinity).filter(r => r.apps <= max / 4).slice(0, 3) : [];
  if (missed.length) add({ emoji: "👻", kicker: "Se le echó de menos", title: joinNames(names(missed)), big: cnt(missed[0].apps, "partido", "partidos"), sub: "El año que viene te guardamos sitio." });

  // La plantilla: un cromo para cada uno con al menos REWIND_MIN partidos, hasta 4 por historia (repartidos a partes iguales)
  const squad = regular.sort((a, b) => b.apps - a.apps || b.g - a.g || a.name.localeCompare(b.name, "es"));
  const pages = Math.ceil(squad.length / 4), cut = p => Math.round(p * squad.length / pages);
  for (let p = 0; p < pages; p++) {
    add({ kind: "squad", emoji: "🃏", kicker: `La plantilla del año${pages > 1 ? ` · ${p + 1}/${pages}` : ""}`, title: "",
      cromos: squad.slice(cut(p), cut(p + 1)).map(r => ({ name: r.name, nick: nickname(r, d),
        stats: `${cnt(r.apps, "partido", "partidos")} · ${cnt(r.g, "gol", "goles")}${r.pj ? ` · ${r.w}V ${r.d}E ${r.l}D` : ""}` })) });
  }

  add({ kind: "outro", emoji: "🙌", kicker: groupName(), title: `Gracias por ${year}`, sub: `Nos vemos en el campo en ${+year + 1}.` });
  return cards;
}

/* ---------- Publicar (para que lo vean todos) ---------- */

/** Año del Rewind publicado (en los ajustes del grupo), o null. */
const publishedRewind = () => /^\d{4}$/.test(String(settings.rewind || "")) ? String(settings.rewind) : null;

/** Publica el Rewind de un año (null para retirarlo). */
function setRewind(year) {
  settings = Object.assign({}, settings, { rewind: year || null });
  return db.doc("settings/general").set(Object.assign({}, settings));
}
