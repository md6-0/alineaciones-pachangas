# ⚽ Mi pachanga

La pizarra del míster para la pachanga del fin de semana: pasas lista, la app reparte dos equipos equilibrados por posiciones y tú colocas a cada uno en su sitio arrastrando los imanes.

Guarda el historial de partidos con resultado y goleadores, y lleva las estadísticas para saber quién es el pichichi del grupo.

Es una aplicación web que se instala en el móvil como cualquier otra app y funciona sin conexión. Puede guardar los datos en un servidor (Firebase) para compartirla con el grupo: quien organiza entra con su cuenta y edita, y los demás abren el enlace y lo ven todo sin poder tocar nada. Sin servidor configurado, todo se guarda en el dispositivo.

---

## Qué puedes hacer

### 📋 Partido

La primera pestaña es el **próximo partido**: arriba, quién va; debajo, cómo quedan los equipos.

- **Apuntados**: la lista por orden de llegada, con el día, la hora y el formato en el título. La primera vez cada uno dice quién es (**Soy…**, de la lista de jugadores; el móvil lo recuerda) y después tiene su botón **Apuntarme** / **Borrarme**. Si se apuntan más de los que pide el formato, entran igual y los últimos van al banquillo.
- **La alineación sale sola** con los apuntados: Equipo Blanco y Equipo Oscuro equilibrando porteros, defensas, medios y delanteros. Si no te convence, **Otra opción**.
- Juega a **fútbol 7, fútbol 8 o fútbol 11**. El de 11 tiene su propio campo, con las medidas reales. Cada formato juega con una **formación fija**: 3-2-1 en fútbol 7, 3-3-1 en fútbol 8 y 4-2-3-1 en fútbol 11. Los jugadores se colocan solos en su línea y puedes moverlos arrastrando: al soltar un imán salta a la posición libre más cercana, y si lo sueltas en la otra mitad del campo cambia de equipo. **Invertir equipos** cambia el Blanco por el Oscuro sin mover a nadie de sitio. Lo que retocas lo ve todo el mundo, y quien se apunte después entra en un hueco libre sin deshacerlo.
- Quien organiza además **apunta y quita a cualquiera**, manda la **lista por WhatsApp** (el día y la hora y un hueco numerado por jugador, con los que ya se han apuntado) y, cuando empieza otra semana, **vacía la lista**.
- **Guardar alineación en historial** guarda el partido con su fecha, para apuntar después el resultado y los goles.
- **Compartir** manda la alineación en texto por WhatsApp o Telegram, o crea una imagen para compartirla o descargarla. Arriba del menú eliges **qué compartes**, tanto en texto como en imagen: la **alineación** (posiciones y banquillo; en imagen, el campo con los imanes) o solo los **equipos** (los jugadores de cada uno, sin posiciones; en imagen, en dos columnas). La app recuerda la última elección.

### 👟 Jugadores

Cada jugador tiene nombre y una o varias posiciones (POR, DEF, MED, ATQ). No hay medias: los equipos se equilibran por posiciones, y en cada equipo va a la portería quien tenga la posición POR.

### 🏆 Historial y estadísticas

En el historial apuntas el resultado y quién marcó cada gol. Puedes volver a cargar cualquier alineación en la pizarra. La pestaña de estadísticas muestra goleadores (con sus partidos jugados; a igualdad de goles, va antes quien ha jugado menos partidos), partidos jugados y partidos ganados, empatados y perdidos de cada jugador. Los datos no mienten. Con **Compartir goleadores** mandas la tabla de goleadores en texto por WhatsApp o Telegram, o en imagen para descargarla o compartirla.

### 👀 Compartir la app con el grupo

Con el servidor configurado (ver *Para desarrolladores → Servidor*), basta con pasar el enlace de la app:

- **Quien abre el enlace** ve el próximo partido (la lista y la alineación), el historial con resultados y goles, y las estadísticas, y puede **apuntarse y borrarse él mismo**. No puede cambiar nada más: ni la alineación, ni el historial, ni los goles; la pestaña Jugadores no aparece. Si a alguien lo apunta quien organiza, solo quien organiza puede quitarlo.
- **Quien organiza entra en Opciones → Administrar** con su correo y contraseña, y entonces lo cambia todo. Lo que guarda llega al momento a todos los demás.
- **Subir los datos de este dispositivo**: si el móvil de quien organiza tenía datos de antes del servidor, Opciones ofrece subirlos (sustituyen a los del servidor y se suben sin las notas de las antiguas medias).

### ⚙️ Opciones

- **Administrar** (solo con servidor): entrar para editar o salir.
- **Nombre del grupo**: el que sale encima del título y en la imagen que compartes.
- **Día y hora del partido**: salen en el título y en la lista por WhatsApp. Por defecto, hoy y sin hora; cuando el día pasa, vuelve solo a hoy.
- **Formato**: 7 vs 7, 8 vs 8 (por defecto) u 11 vs 11. Al cambiarlo, la alineación vuelve a salir sola.
- **Copia de seguridad**: descarga un archivo con todos los jugadores y el historial, y restáuralo en el mismo móvil o en otro. Es la forma de pasar los datos de un dispositivo a otro.
- **Borrar todos los datos**: deja la app vacía, para empezar de cero. Pide confirmación y no se puede deshacer.
- **Versión**: al final de la pestaña, con un botón para buscar actualizaciones.

---

## Saltar al campo

1. Abre [md6-0.github.io/alineaciones-pachangas](https://md6-0.github.io/alineaciones-pachangas/) en el navegador del móvil.
2. Instálala: en Android, menú del navegador → *Añadir a pantalla de inicio*; en iPhone, botón *Compartir* → *Añadir a pantalla de inicio*.
3. Sin servidor, la primera vez la app trae una plantilla de ejemplo de 24 jugadores (Jugador 1, Jugador 2…), suficientes para cualquier formato, ya colocada en la pizarra, para que pruebes sin preparar nada. Cámbiales el nombre y las posiciones en **Jugadores**, o restaura tu copia en **Opciones** (⚙) si ya tenías datos: la copia sustituye a la plantilla de ejemplo.

Cuando hay una versión nueva, la app la busca sola al volver a ella y cada media hora, y te avisa arriba con un botón **Actualizar**: tú decides cuándo, para que no se recargue mientras escribes.

Sin servidor, los datos se guardan en el navegador de cada dispositivo y, si borras los datos del navegador, se pierden: descarga una copia de vez en cuando, mejor después de cada partido. Con servidor, los datos están en Firebase y el móvil guarda una copia para funcionar sin conexión.

## Para desarrolladores

### Ponerla en marcha

La app son archivos estáticos: no tiene dependencias ni necesita compilarse. Para probarla en el ordenador basta un servidor web cualquiera:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. La parte que permite usarla sin conexión (el *service worker*) solo funciona en `localhost` o con HTTPS.

Se publica con GitHub Pages desde la rama `main`, carpeta raíz.

### Servidor (Firebase)

Para compartir la app con el grupo, los datos van a un proyecto de Firebase en el plan gratuito (Spark, sin tarjeta):

1. En [console.firebase.google.com](https://console.firebase.google.com), **Crear proyecto** (Google Analytics no hace falta).
2. **Compilación → Firestore Database → Crear base de datos**, en una ubicación de Europa y en modo de producción.
3. **Compilación → Authentication → Comenzar → Método de acceso**: activa **Correo electrónico/contraseña** y **Anónimo** (el anónimo es para que los demás se apunten sin cuenta). En **Usuarios → Agregar usuario**, crea el de quien organiza y copia su **UID**.
4. **Firestore Database → Reglas**: pega `firestore.rules` cambiando `PON_AQUI_TU_UID` por ese UID, y **Publicar**.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registra la app (sin Hosting) y copia el objeto `firebaseConfig` en `js/firebase-config.js` (`const FIREBASE_CONFIG = { … };`). No es secreto: lo que protege los datos son las reglas.
6. Publica una versión nueva. Quien organiza entra en **Opciones → Administrar** y, si tenía datos en el móvil, pulsa **Subir los datos de este dispositivo**.

Nadie más puede crear cuentas que escriban: aunque alguien se registrara con la clave pública del proyecto, las reglas solo dejan escribir al UID de quien organiza; cualquier otro usuario, anónimo o no, solo puede apuntarse a sí mismo y borrar lo que apuntó él.

### Pruebas

La carpeta `tests/` tiene pruebas que abren la app en un navegador real (con [Playwright](https://playwright.dev)) y hacen lo que haría una persona: repartir equipos, arrastrar imanes, editar jugadores, guardar partidos con resultado y goles, hacer y restaurar copias, compartir, usarla sin conexión, verla sin poder editar con el servidor… No forman parte de la app publicada. Para ejecutarlas:

```bash
cd tests
npm install
npx playwright install chromium
npm test                 # todas; también: node run.js 2 5 para elegir algunas
```

Cada prueba levanta su propio servidor local y no necesita internet. Las del servidor (`test8.js`) usan un Firebase simulado (`tests/fake-firebase.js`) con las mismas reglas que `firestore.rules`: quien no ha entrado puede leer pero no escribir. Si cambias algo de la interfaz y una prueba falla, suele ser porque el texto o el comportamiento que comprobaba ha cambiado a propósito: se actualiza la prueba.

### Publicar una versión nueva

Antes de subir cambios hay que **aumentar `VERSION` en `sw.js`** (por ejemplo, de `1.7.0` a `1.7.1`) y el número que se ve en Opciones, al final de `index.html`. El de `sw.js` es lo que hace que el navegador detecte que hay algo nuevo y muestre el aviso. Sin cambiarlo, quien ya tenga la app instalada seguirá con la versión anterior.

Si has añadido o renombrado algún archivo, inclúyelo también en la lista `SHELL` de `sw.js`, para que se guarde en el dispositivo y la app siga funcionando sin conexión (una prueba lo comprueba).

### Cómo está organizado el código

`index.html` contiene solo la estructura de la página y de sus pestañas. El aspecto está en `css/`, una hoja por pantalla, y el comportamiento en `js/`, repartido en archivos pequeños, cada uno con una única responsabilidad:

```
index.html             estructura de la app y de sus pestañas
sw.js                  funcionamiento sin conexión y versión
manifest.webmanifest   datos para instalarla (nombre, iconos, colores)
tests/                 pruebas automáticas en un navegador real (no se publican)

css/base.css           colores, botones, pestañas y piezas comunes (avisos, banda de versión nueva)
css/board.css          la pizarra: campo, imanes y huecos
css/lineup.css         pestaña Partido: lista de apuntados, equipos, banquillos y menú Compartir
css/players.css        pestaña Jugadores
css/history.css        pestaña Historial
css/stats.css          pestaña Estadísticas
css/options.css        pestaña Opciones

js/util.js             utilidades generales: DOM, texto, fechas y descargas
js/sample-squad.js     plantilla de ejemplo de la primera visita (sin servidor)
js/firebase-config.js  configuración del servidor (null: sin servidor)
js/db-local.js         datos en el dispositivo (localStorage)
js/db-cloud.js         datos en el servidor (Firebase: Firestore y Authentication)
js/db.js               elige dónde se guardan los datos; canEdit() dice si quien usa la app puede cambiarlos
js/vendor/             librería de Firebase (solo se carga con servidor)
js/config.js           constantes: equipos, formatos, formaciones y posiciones
js/state.js            estado en memoria y preferencias de este dispositivo
js/settings.js         ajustes que viajan con los datos (nombre del grupo)
js/dates.js            día del partido
js/players.js          jugadores: lectura, añadir, cambiar y quitar
js/teams.js            reparto en dos equipos equilibrados por posiciones
js/formation.js        colocación en la pizarra: huecos, portero, soltar imanes, invertir equipos
js/matches.js          historial: guardar la alineación, resultado y goles
js/next-match.js       próximo partido: apuntados, día, hora, formato y la alineación (automática o retocada)
js/stats.js            cálculo de las estadísticas
js/backup.js           copia de seguridad, subir datos al servidor (sin las medias antiguas) y borrar todo
js/ui.js               piezas de interfaz reutilizables: avisos, confirmaciones, imagen a pantalla completa
js/views.js            pestañas y repintado
js/pitch.js            dibujo del campo en SVG
js/tab-lineup.js       pestaña Partido: lista de apuntados, «Soy…», pizarra y equipos
js/drag.js             arrastrar imanes
js/share-image.js      imagen de la alineación para compartir
js/share-teams-image.js imagen de los equipos (solo jugadores) para compartir
js/share-menu.js       piezas comunes de los menús Compartir (abrir, cerrar, enlaces, botones de imagen)
js/share.js            menú Compartir de la pestaña Partido
js/share-signup.js     lista por WhatsApp con los apuntados
js/tab-players.js      pestaña Jugadores
js/tab-history.js      pestaña Historial
js/tab-stats.js        pestaña Estadísticas
js/share-scorers.js    goleadores para compartir: texto, imagen y su menú
js/tab-options.js      pestaña Opciones (también entrar y salir, y subir los datos del dispositivo)
js/updates.js          aviso de versión nueva
js/main.js             arranque
```

Los archivos de `js/` se cargan en ese orden y cada uno se apoya en los anteriores. Forman tres capas:

- **La base** (`util`, `sample-squad`, `firebase-config`, `db-local`, `db-cloud`, `db`, `config`, `state`) no sabe nada de la interfaz.
- **Las reglas** (de `settings` a `backup`) no tocan la pantalla. Todo lo que decide cómo se reparten los equipos, dónde va cada jugador, qué se guarda en un partido está ahí, en un único sitio. El resto de la app llama a esas funciones (`solve`, `rebuild`, `dropOnPitch`, `saveLineup`, `changeGoal`, `computeStats`…) en lugar de repetir la lógica.
- **La interfaz** (`ui`, `views` y un archivo por pestaña o funcionalidad) pinta la pantalla a partir del estado y responde a lo que hace el usuario.

El flujo es siempre el mismo: una acción cambia los datos o la pizarra y se vuelve a pintar a partir del estado. Los cambios de los datos (jugadores, partidos, ajustes, apuntados y el próximo partido) se guardan con `db`, que avisa a `main.js`; este recalcula el estado y repinta lo que depende de él. La pizarra (`layout`) se calcula en cada dispositivo a partir de los apuntados con `syncBoard()` (`next-match.js`): si quien organiza no la ha retocado, sale del reparto automático, que es determinista y por eso es igual en todos los móviles; si la ha retocado (arrastrar, invertir), su colocación se guarda en `next/current` y los nuevos apuntados entran en un hueco libre.

### Algunas decisiones

**Sin frameworks ni herramientas de compilación.** La app es lo bastante pequeña como para no necesitarlos. Así se puede publicar en cualquier sitio y abrir con un editor de texto, sin instalar nada.

**Scripts normales en lugar de módulos de JavaScript.** Los archivos comparten el mismo espacio de nombres y se cargan en el orden de `index.html`. Es lo que permite prescindir de herramientas, pero obliga a que cada nombre global sea único. Si la app creciera mucho, el paso natural sería convertirlos en módulos (`import`/`export`).

**`db` imita a una base de datos de documentos.** El resto de la app solo usa `collection().onSnapshot()` y `doc().set/update/delete()`, así que da igual si los datos están en el dispositivo (`db-local.js`) o en Firestore (`db-cloud.js`). Una diferencia que tapa `db-cloud.js`: en Firestore, `update()` sustituye los objetos enteros, y la app manda cambios anidados (`{ score: { W: 3 } }`) que solo deben tocar lo que traen; se convierten en rutas de campo (`score.W`).

**Solo ver se decide en la interfaz y se garantiza en el servidor.** Sin entrar, la app esconde todo lo que cambia datos (clase `viewer` en `body` y `.edit-only`), pero lo que de verdad impide escribir son las reglas de `firestore.rules`.

**Sin medias.** La app las tuvo y se quitaron para poder compartirla. Los datos antiguos pueden traer `atq`, `def` y `por` en los jugadores, y `ovr` y `por` en los partidos: se ignoran, y al restaurar una copia o subir los datos al servidor se borran, para que nadie pueda leerlos.

**La app abre desde la caché.** Cada versión guarda todos sus archivos en el dispositivo al instalarse, y al abrir la app se leen de ahí sin preguntar al servidor por cada uno. Por eso abre al momento, con o sin conexión, y por eso los cambios solo llegan al subir `VERSION`.

**El reparto es determinista.** La misma lista de apuntados da siempre las mismas opciones (en todos los móviles): entre los repartos igual de equilibrados se elige uno con un generador aleatorio con semilla, y **Otra opción** cambia la semilla. Hasta 16 apuntados se prueban todos los repartos; con más, se buscan al azar y se mejoran intercambiando parejas.

### Cómo se guardan los datos

Los datos son cinco colecciones: `players` (cada jugador: `name`, `pos` con sus posiciones y `order` en la lista), `matches` (el historial), `settings` (el nombre del grupo), `signups` (los apuntados al próximo partido: el id del jugador, con `at`, cuándo se apuntó, y `uid`, quién lo apuntó) y `next` (un documento, `current`, con el día, la hora, el formato, las formaciones, el reparto que se muestra y, si quien organiza la ha retocado, la colocación de la alineación). Con servidor están en Cloud Firestore (y Firestore guarda una copia en el dispositivo para funcionar sin conexión); sin servidor, en el `localStorage` del navegador. Además hay preferencias de cada dispositivo, siempre en `localStorage`:

- **`pachangas-db-v1`** (sin servidor): los datos, en tres colecciones. `players` (cada jugador: `name`, `pos` con sus posiciones y `order` en la lista), `matches` (cada partido, con la fecha como id: formato, formaciones, los jugadores de cada equipo con su posición, `score` y `goals`) y `settings` (el nombre del grupo). Es lo que va en la copia de seguridad.
- **`pach-v4`**: las preferencias de este dispositivo: quién eres (para apuntarte), pestaña abierta y qué se comparte (alineación o equipos), y lo último que llegó del próximo partido.
- **`pach-subido`**: ya se subieron al servidor los datos que había en este dispositivo.

### Ampliar la app

- **Otra formación:** se cambia en `FORMS` (`config.js`). Las de tres líneas (3-3-1) y cuatro (4-2-3-1) ya tienen sus alturas en `LINES`.
- **Un formato nuevo:** sus formaciones en `FORMS`, cuántos jugadores necesita en `NEED` y su botón en Opciones (`index.html`). Si necesita otro campo, se dibuja en `pitch.js` y en `drawPitchLines` (`share-image.js`).
- **Una estadística nueva:** se calcula en `computeStats` (`stats.js`) y se añade su tarjeta en `tab-stats.js`.
- **Un archivo nuevo:** se añade a `index.html` en el lugar que le corresponda según de qué dependa, y a la lista `SHELL` de `sw.js`.
