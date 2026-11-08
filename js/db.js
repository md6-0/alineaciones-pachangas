"use strict";
/* Dónde se guardan los datos: en el servidor si está configurado (db-cloud.js) y si no, en el dispositivo (db-local.js).
   Las dos imitan a una base de datos de documentos, así que el resto de la app no sabe cuál se usa:
     db.collection("players").onSnapshot(fn, fallo)   avisa con todos los documentos al empezar y después de cada cambio
     db.doc("players/id").set(v) | .update(cambios) | .delete()   (update mezcla los objetos por dentro)
     db.cloud, db.user, db.onAuth(fn)   si hay servidor y quién ha entrado (en el dispositivo, cualquiera edita) */

const db = FIREBASE_CONFIG ? cloudDb(FIREBASE_CONFIG) : localDb();

/** Si quien usa la app puede cambiar datos: sin servidor, siempre; con servidor, solo quien ha entrado con su cuenta. */
const canEdit = () => !db.cloud || !!db.user;
