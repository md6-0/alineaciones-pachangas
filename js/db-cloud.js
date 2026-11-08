"use strict";
/* Datos en el servidor (Firebase: Cloud Firestore y Authentication), con la misma interfaz que db-local.js.
   La librería de Firebase (js/vendor) solo se carga si hay servidor configurado. Firestore guarda una copia
   en el dispositivo, así que la app sigue funcionando sin conexión y se sincroniza al volver.
   Leer puede cualquiera; cambiar, solo quien organiza, que entra con correo y contraseña (lo comprueban las reglas). */

const FIREBASE_SDK = ["js/vendor/firebase-app-compat.js", "js/vendor/firebase-auth-compat.js", "js/vendor/firebase-firestore-compat.js"];

function cloudDb(config) {
  const load = src => new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => ko({ code: "unavailable" });
    document.head.appendChild(s);
  });
  let fs = null, auth = null;
  const authSubs = [];
  const api = { cloud: true, user: null, authKnown: false };

  const ready = FIREBASE_SDK.reduce((p, src) => p.then(() => load(src)), Promise.resolve()).then(() => {
    firebase.initializeApp(config);
    fs = firebase.firestore();
    fs.enablePersistence({ synchronizeTabs: true }).catch(() => {});   // sin copia local (navegación privada…): sigue funcionando
    auth = firebase.auth();
    auth.onAuthStateChanged(u => {
      api.user = u && !u.isAnonymous ? { uid: u.uid, email: u.email } : null; api.authKnown = true;   // un anónimo de versiones anteriores no cuenta
      authSubs.forEach(f => { try { f(api.user); } catch (e) { console.error(e); } });
    });
  });
  ready.catch(() => {});

  /** Errores de Firebase con los mismos códigos que usa la app. */
  const CODES = { "permission-denied": "invalid_argument", unauthenticated: "invalid_argument", "not-found": "invalid_argument", "resource-exhausted": "quota_exceeded" };
  const wrap = p => p.catch(e => { throw { code: CODES[e && e.code] || (e && e.code) || "unknown", cause: e }; });

  /** update() de Firestore sustituye los objetos enteros; la app manda cambios anidados ({ score: { W: 3 } })
      que solo deben tocar lo que traen. Se convierten en rutas de campo: score.W = 3. */
  function fieldPaths(patch) {
    const out = [];
    const walk = (obj, path) => Object.keys(obj).forEach(k => {
      const v = obj[k], p = [...path, k];
      if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) walk(v, p);
      else out.push(new firebase.firestore.FieldPath(...p), v);
    });
    walk(patch, []);
    return out;
  }

  return Object.assign(api, {
    /** Avisa con el usuario (o null) al saberlo y cada vez que entra o sale. */
    onAuth(cb) { authSubs.push(cb); if (api.authKnown) cb(api.user); },
    signIn: (email, pass) => ready.then(() => auth.signInWithEmailAndPassword(email, pass)),
    signOut: () => ready.then(() => auth.signOut()),
    collection: c => ({
      onSnapshot(cb, err) {
        let off = null, gone = false;
        ready.then(() => {
          if (gone) return;
          off = fs.collection(c).onSnapshot(s => cb({ docs: s.docs.map(d => ({ id: d.id, exists: true, data: () => d.data() })) }), e => err && err(e));
        }, e => err && err(e));
        return () => { gone = true; if (off) off(); };
      }
    }),
    doc: path => ({
      set: v => wrap(ready.then(() => fs.doc(path).set(clone(v)))),
      update: v => wrap(ready.then(() => fs.doc(path).update(...fieldPaths(clone(v))))),
      delete: () => wrap(ready.then(() => fs.doc(path).delete()))
    })
  });
}
