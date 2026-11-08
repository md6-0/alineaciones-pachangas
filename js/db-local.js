"use strict";
/* Datos guardados en el dispositivo (localStorage): se usa si no hay servidor configurado (firebase-config.js).
   Todo va en una sola clave con tres colecciones: players, matches y settings (con un documento, general).
   La interfaz es la misma que la del servidor (ver db.js). Los avisos también llegan si los datos cambian en otra pestaña. */

const DB_KEY = "pachangas-db-v1";

/** Datos guardados en este dispositivo, o null si no hay (para subirlos al servidor). */
function readLocalData() {
  try { const d = JSON.parse(localStorage.getItem(DB_KEY) || "null"); return d && typeof d === "object" && d.players ? d : null; } catch { return null; }
}

function localDb() {
  const read = () => { try { const d = JSON.parse(localStorage.getItem(DB_KEY) || "null"); if (d && typeof d === "object") return d; } catch {} return {}; };
  let data = read();
  const subs = {};

  // Primera visita: la plantilla de ejemplo
  let firstRun = false; try { firstRun = localStorage.getItem(DB_KEY) === null; } catch {}
  if (firstRun) {
    data = sampleSquad();
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch {}
  }

  const persist = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch { throw { code: "quota_exceeded" }; } };
  const snap = c => ({ docs: Object.entries(data[c] || {}).map(([id, v]) => ({ id, exists: true, data: () => clone(v) })) });
  const emit = c => (subs[c] || []).forEach(f => { try { f(snap(c)); } catch (e) { console.error(e); } });
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  /** Mezcla los cambios en el documento: los objetos se mezclan por dentro, el resto se sustituye. */
  const merge = (t, s) => { for (const k in s) { if (isObj(s[k]) && isObj(t[k])) merge(t[k], s[k]); else t[k] = isObj(s[k]) ? clone(s[k]) : s[k]; } return t; };

  window.addEventListener("storage", e => { if (e.key === DB_KEY) { data = read(); Object.keys(subs).forEach(emit); } });

  return {
    cloud: false,
    firstRun,           // primera visita: main.js apunta a los primeros jugadores
    user: null,
    onAuth: () => {},
    collection: c => ({
      onSnapshot(cb) {
        (subs[c] = subs[c] || []).push(cb);
        setTimeout(() => cb(snap(c)), 0);
        return () => { subs[c] = subs[c].filter(f => f !== cb); };
      }
    }),
    doc: path => {
      const [c, id] = path.split("/");
      return {
        set: async v => { (data[c] = data[c] || {})[id] = clone(v); persist(); emit(c); },
        update: async v => { const col = data[c] = data[c] || {}; if (!col[id]) throw { code: "invalid_argument" }; merge(col[id], v); persist(); emit(c); },
        delete: async () => { if (data[c]) { delete data[c][id]; persist(); emit(c); } }
      };
    }
  };
}
