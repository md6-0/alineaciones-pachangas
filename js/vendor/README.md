# Firebase (librería de terceros)

`firebase-app-compat.js`, `firebase-auth-compat.js` y `firebase-firestore-compat.js` son la versión 11.10.0 del SDK web de Firebase (paquete `firebase` de npm, versión «compat»), copiados tal cual sin la línea del mapa de código. Licencia Apache 2.0 (© Google LLC).

Solo se cargan si `js/firebase-config.js` tiene configuración (ver `db-cloud.js`). Para actualizarlos: `npm install firebase@<versión>` en una carpeta aparte y copiar esos tres archivos de `node_modules/firebase/`.
