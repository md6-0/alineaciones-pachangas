"use strict";
/* Reparto de los convocados en dos equipos lo más igualados posible. No toca la pantalla. */

/** Portero que tendría un equipo: primero quien tenga la posición POR; después, la mejor nota POR. */
function pickGK(list) {
  return [...list].sort((a, b) => (b.pos.includes("POR") - a.pos.includes("POR")) || b.por - a.por || a.m - b.m)[0];
}

/** Media de un equipo: el portero cuenta con su nota POR y el resto con su media. */
function teamValue(list, gk) {
  if (!list.length) return 0;
  const g = gk !== undefined ? gk : pickGK(list);
  return list.reduce((a, p) => a + (p === g ? p.por : p.m), 0) / list.length;
}

/** Lo desigual que es un reparto: diferencia de medias más una penalización si un equipo tiene
    bastantes más porteros, defensas o delanteros que el otro. */
function splitCost(A, B) {
  const can = (p, r) => p.pos.includes(r);
  let cost = Math.abs(teamValue(A) - teamValue(B));
  for (const r of ["POR", "DEF", "ATQ"]) {
    const d = Math.abs(A.filter(p => can(p, r)).length - B.filter(p => can(p, r)).length);
    cost += Math.max(0, d - 1) * (r === "POR" ? 6 : 1.5);
  }
  return cost;
}

/** Generador de números aleatorios con semilla: la misma convocatoria da siempre las mismas opciones. */
function rng(seedN) {
  let t = seedN >>> 0;
  return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; };
}

/** Todos los repartos posibles (hasta 16 jugadores). Con número par, solo los que dejan al primero en A (la otra mitad es la misma con los equipos cambiados). */
function allSplits(list) {
  const n = list.length, k = Math.floor(n / 2), odd = n % 2 === 1, out = [];
  for (let m = 0; m < (1 << n); m++) {
    let c = 0, x = m; while (x) { c += x & 1; x >>= 1; }
    if (c !== k) continue;
    if (!odd && !(m & 1)) continue;
    const A = [], B = [];
    for (let i = 0; i < n; i++) ((m >> i) & 1 ? A : B).push(list[i]);
    out.push({ A, B, cost: splitCost(A, B) });
  }
  return out;
}

/** Demasiados jugadores para probarlos todos: 120 repartos al azar, cada uno mejorado intercambiando parejas. */
function searchSplits(list) {
  const n = list.length, k = Math.floor(n / 2), odd = n % 2 === 1, out = [];
  const rand = rng(n * 7919 + list.reduce((a, p) => a + p.m, 0) | 0), seen = new Set();
  for (let t = 0; t < 120; t++) {
    const idx = [...list.keys()];
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    let A = idx.slice(0, k).map(i => list[i]), B = idx.slice(k).map(i => list[i]), cost = splitCost(A, B), better = true;
    while (better) {
      better = false;
      for (let i = 0; i < A.length && !better; i++) for (let j = 0; j < B.length && !better; j++) {
        const A2 = A.slice(), B2 = B.slice(); [A2[i], B2[j]] = [B2[j], A2[i]];
        const c2 = splitCost(A2, B2); if (c2 < cost - 1e-9) { A = A2; B = B2; cost = c2; better = true; }
      }
    }
    if (!odd && !A.includes(list[0])) [A, B] = [B, A];
    const key = A.map(p => p.id).sort().join("|");
    if (!seen.has(key)) { seen.add(key); out.push({ A, B, cost }); }
  }
  return out;
}

/** Reparto de la lista: uno de los 6 mejores, según la semilla (Otra opción pasa al siguiente). null si hay menos de 2. */
function solve(list, seedN = seed) {
  if (list.length < 2) return null;
  const out = list.length <= 16 ? allSplits(list) : searchSplits(list);
  if (!out.length) return null;
  out.sort((a, b) => a.cost - b.cost);
  const top = out.slice(0, Math.min(6, out.length));
  const s = top[seedN % top.length];
  return { A: s.A, B: s.B };
}
