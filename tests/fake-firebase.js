/* Firebase simulado para las pruebas (sustituye a js/vendor/firebase-app-compat.js; los otros dos archivos llegan vacíos).
   Imita lo que usa db-cloud.js: initializeApp, firestore() con collection().onSnapshot y doc().set/update/delete,
   FieldPath y auth() con correo y contraseña. Los datos van en localStorage («fake-firestore»), así que las páginas de
   una misma prueba comparten «servidor»; la sesión va en sessionStorage, así que cada página entra por su cuenta.
   Reglas como las de firestore.rules: lee cualquiera; escribe solo el usuario admin-uid. */
(function () {
  const KEY = "fake-firestore", ADMIN = { uid: "admin-uid", email: "mario@example.com" }, PASS = "secreta";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(KEY, JSON.stringify(d));
  const subs = [];
  const fail = code => Promise.reject({ code });
  let user = null; try { user = JSON.parse(sessionStorage.getItem("fake-user") || "null"); } catch {}
  const authSubs = [];

  const snapOf = c => ({ docs: Object.entries(read()[c] || {}).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })) });
  const emitAll = () => subs.forEach(s => s.cb(snapOf(s.c)));
  window.addEventListener("storage", e => { if (e.key === KEY) emitAll(); });
  const canWrite = () => user && user.uid === ADMIN.uid;
  const change = fn => { if (!canWrite()) return fail("permission-denied"); const d = read(); const r = fn(d); if (r) return r; write(d); setTimeout(emitAll, 0); return Promise.resolve(); };

  class FieldPath { constructor(...segs) { this.segs = segs; } }

  const firestore = () => ({
    enablePersistence: () => Promise.resolve(),
    collection: c => ({
      onSnapshot(cb) { const s = { c, cb }; subs.push(s); setTimeout(() => cb(snapOf(c)), 0); return () => subs.splice(subs.indexOf(s), 1); }
    }),
    doc: path => {
      const [c, id] = path.split("/");
      return {
        set: v => change(d => { (d[c] = d[c] || {})[id] = JSON.parse(JSON.stringify(v)); }),
        update: (...args) => change(d => {
          const doc = d[c] && d[c][id]; if (!doc) return fail("not-found");
          for (let i = 0; i < args.length; i += 2) {
            const segs = args[i] instanceof FieldPath ? args[i].segs : String(args[i]).split(".");
            let t = doc; segs.slice(0, -1).forEach(k => { if (!t[k] || typeof t[k] !== "object") t[k] = {}; t = t[k]; });
            t[segs[segs.length - 1]] = args[i + 1];
          }
        }),
        delete: () => change(d => { if (d[c]) delete d[c][id]; })
      };
    }
  });
  firestore.FieldPath = FieldPath;

  const setUser = u => { user = u; sessionStorage.setItem("fake-user", JSON.stringify(u)); authSubs.forEach(f => f(u)); };
  const auth = () => ({
    onAuthStateChanged(cb) { authSubs.push(cb); setTimeout(() => cb(user), 0); },
    signInWithEmailAndPassword: (email, pass) => email === ADMIN.email && pass === PASS ? (setUser(ADMIN), Promise.resolve({ user: ADMIN })) : fail("auth/invalid-credential"),
    signOut: () => { setUser(null); return Promise.resolve(); }
  });

  window.firebase = { initializeApp: () => ({}), firestore, auth };
})();
