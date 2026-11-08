# ⚽ Mi pachanga

La uso para organizar la pachanga del finde con mis colegas. Quien organiza apunta a quien viene al próximo partido, la app reparte dos equipos equilibrados por posiciones y los coloca en una pizarra que se retoca arrastrando los imanes. El resto del grupo abre el enlace y ve la lista, la alineación, el historial con resultados y goleadores, las estadísticas y, a final de año, el **Rewind**.

Es una aplicación web que se instala en el móvil como cualquier otra app y funciona sin conexión. Los datos están en un servidor (Firebase): solo quien organiza puede cambiarlos, entrando con su cuenta, y los demás solo los ven. Sin servidor configurado, todo se guarda en el dispositivo.

---

## Qué puedes hacer

### 📋 Partido

La primera pestaña es el **próximo partido**: arriba, quién va; debajo, cómo quedan los equipos.

- **Apuntados**: la lista por orden de llegada, con el día y la hora como título y el número de apuntados bien grande. Los apunta quien organiza. Si hay más de los que pide el formato, entran igual y los últimos van al banquillo.
- **La alineación sale sola** con los apuntados: Equipo Blanco y Equipo Oscuro equilibrando porteros, defensas, medios y delanteros.
- Juega a **fútbol 7, fútbol 8 o fútbol 11**. El de 11 tiene su propio campo, con las medidas reales. Cada formato juega con una **formación fija**: 3-2-1 en fútbol 7, 3-3-1 en fútbol 8 y 4-2-3-1 en fútbol 11. Los jugadores se colocan solos en su línea y puedes moverlos arrastrando: al soltar un imán salta a la posición libre más cercana, y si lo sueltas en la otra mitad del campo cambia de equipo. Lo que retocas lo ve todo el mundo, y quien apuntes después entra en un hueco libre sin deshacerlo.
- Quien organiza elige arriba el **día y la hora**, en un solo campo (con «Hoy», hoy y sin hora; cuando el día pasa, vuelve solo a hoy), **apunta y quita jugadores**, manda la **lista por WhatsApp** (el día y la hora y un hueco numerado por jugador, con los que ya se han apuntado) y, cuando empieza otra semana, **vacía la lista**.
- **Partido jugado**, después de jugar: guarda la alineación en el historial con su fecha, vacía la lista para el próximo y te lleva al historial para apuntar el resultado y los goles.
- **Compartir** manda la alineación en texto por WhatsApp o, con **Compartir imagen**, como imagen por el menú de compartir del móvil (en el ordenador, la descarga). Arriba del menú eliges **qué compartes**, tanto en texto como en imagen: la **alineación** (posiciones y banquillo; en imagen, el campo con los imanes) o solo los **equipos** (los jugadores de cada uno, sin posiciones; en imagen, en dos columnas). La app recuerda la última elección.

### 👀 El grupo

Con el servidor configurado (ver *Para desarrolladores → Servidor*), basta con pasar el enlace de la app:

- **Quien abre el enlace** ve el próximo partido (la lista y la alineación), el historial con resultados y goles, y las estadísticas, sin poder cambiar nada; la pestaña Jugadores no aparece. Para apuntarse, se lo dice a quien organiza.
- **Quien organiza entra en Opciones → Administrar** con su correo y contraseña, y entonces lo cambia todo. Lo que guarda llega al momento a todos los demás.
- **Subir los datos de este dispositivo**: si el móvil de quien organiza tenía datos de antes del servidor, Opciones ofrece subirlos (sustituyen a los del servidor y se suben sin las notas de las antiguas medias).

### 👟 Jugadores

Solo para quien organiza. Cada jugador tiene nombre y una o varias posiciones (POR, DEF, MED, ATQ). No hay medias: los equipos se equilibran por posiciones, y en cada equipo va a la portería quien tenga la posición POR.

### 🏆 Historial y estadísticas

En el historial, quien organiza apunta el resultado y quién marcó cada gol (con **+** y **−** junto a cada goleador para sumarle o quitarle uno). La pestaña de estadísticas muestra goleadores (con sus partidos jugados; a igualdad de goles, va antes quien ha jugado menos partidos), partidos jugados y partidos ganados, empatados y perdidos de cada jugador. Los datos no mienten. Con **Compartir goleadores** mandas la tabla de goleadores en texto por WhatsApp o como imagen.

### 🎬 Rewind del año

En **Estadísticas**, quien organiza tiene el **Rewind** de cada año: historias a pantalla completa, al estilo de los resúmenes anuales de las apps de música, que se pasan tocando a la derecha (y a la izquierda para volver). Lleva los números del año, el duelo Blanco contra Oscuro, premios (pichichi, el fijo, el amuleto, la racha, la pareja letal, enemigos íntimos, la mayor goleada, el partido más loco, los hat-tricks, a quién se echó de menos) y **la plantilla del año**: un cromo con mote y números para cada uno que haya jugado al menos 4 partidos. Cada historia se comparte como imagen vertical. Solo lo ve quien organiza hasta que pulsa **Publicar para todos**; entonces aparece en Estadísticas para el grupo.

### ⚙️ Opciones

- **Administrar** (solo con servidor): entrar para editar o salir.
- **Nombre del grupo**: el que sale encima del título y en la imagen que compartes.
- **Formato**: 7 vs 7, 8 vs 8 (por defecto) u 11 vs 11. Al cambiarlo, la alineación vuelve a salir sola.
- **Copia de seguridad** (como todo lo de Opciones salvo Administrar, solo para quien organiza): descarga un archivo con todos los jugadores y el historial, y restáuralo en el mismo móvil o en otro. Es la forma de pasar los datos de un dispositivo a otro.
- **Borrar todos los datos**: deja la app vacía, para empezar de cero. Pide confirmación y no se puede deshacer.
- **Versión**: al final de la pestaña, con un botón para buscar actualizaciones.

---

## Saltar al campo

1. Abre [md6-0.github.io/alineaciones-pachangas](https://md6-0.github.io/alineaciones-pachangas/) en el navegador del móvil.
2. Instálala: en Android, menú del navegador → *Añadir a pantalla de inicio*; en iPhone, botón *Compartir* → *Añadir a pantalla de inicio*.
3. Con el servidor ya configurado (como la versión publicada), la app abre con los datos del grupo. Sin servidor, la primera vez la app trae una plantilla de ejemplo de 24 jugadores (Jugador 1, Jugador 2…), suficientes para cualquier formato, con los primeros apuntados y ya colocados en la pizarra, para que pruebes sin preparar nada. Cámbiales el nombre y las posiciones en **Jugadores**, o restaura tu copia en **Opciones** (⚙) si ya tenías datos: la copia sustituye a la plantilla de ejemplo.

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
3. **Compilación → Authentication → Comenzar → Método de acceso**: activa **Correo electrónico/contraseña**. En **Usuarios → Agregar usuario**, crea el de quien organiza y copia su **UID**.
4. **Firestore Database → Reglas**: pega `firestore.rules` cambiando `PON_AQUI_TU_UID` por ese UID, y **Publicar**.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registra la app (sin Hosting) y copia el objeto `firebaseConfig` en `js/firebase-config.js` (`const FIREBASE_CONFIG = { … };`). No es secreto: lo que protege los datos son las reglas.
6. Publica una versión nueva. Quien organiza entra en **Opciones → Administrar** y, si tenía datos en el móvil, pulsa **Subir los datos de este dispositivo**.

Nadie más puede crear cuentas que escriban: aunque alguien se registrara con la clave pública del proyecto, las reglas solo dejan escribir al UID de quien organiza.

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
css/rewind.css         Rewind del año (recuadro e historias)
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
js/formation.js        colocación en la pizarra: huecos, portero y soltar imanes
js/matches.js          historial: guardar la alineación, resultado y goles
js/next-match.js       próximo partido: apuntados, día, hora, formato y la alineación (automática o retocada)
js/stats.js            cálculo de las estadísticas
js/rewind.js           Rewind del año: números, premios, cromos y publicarlo
js/backup.js           copia de seguridad, subir datos al servidor (sin las medias antiguas) y borrar todo
js/ui.js               piezas de interfaz reutilizables: avisos, confirmaciones, imagen a pantalla completa
js/views.js            pestañas y repintado
js/pitch.js            dibujo del campo en SVG
js/tab-lineup.js       pestaña Partido: lista de apuntados, pizarra y equipos
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
js/rewind-ui.js        Rewind en pantalla: recuadro de Estadísticas, historias e imagen de cada una
js/tab-options.js      pestaña Opciones (también entrar y salir, y subir los datos del dispositivo)
js/updates.js          aviso de versión nueva
js/main.js             arranque
```

Los archivos de `js/` se cargan en ese orden y cada uno se apoya en los anteriores. Forman tres capas:

- **La base** (`util`, `sample-squad`, `firebase-config`, `db-local`, `db-cloud`, `db`, `config`, `state`) no sabe nada de la interfaz.
- **Las reglas** (de `settings` a `backup`) no tocan la pantalla. Todo lo que decide cómo se reparten los equipos, dónde va cada jugador, qué se guarda en un partido está ahí, en un único sitio. El resto de la app llama a esas funciones (`solve`, `rebuild`, `dropOnPitch`, `saveLineup`, `changeGoal`, `computeStats`…) en lugar de repetir la lógica.
- **La interfaz** (`ui`, `views` y un archivo por pestaña o funcionalidad) pinta la pantalla a partir del estado y responde a lo que hace el usuario.

El flujo es siempre el mismo: una acción cambia los datos o la pizarra y se vuelve a pintar a partir del estado. Los cambios de los datos (jugadores, partidos, ajustes, apuntados y el próximo partido) se guardan con `db`, que avisa a `main.js`; este recalcula el estado y repinta lo que depende de él. La pizarra (`layout`) se calcula en cada dispositivo a partir de los apuntados con `syncBoard()` (`next-match.js`): si quien organiza no la ha retocado, sale del reparto automático, que es determinista y por eso es igual en todos los móviles; si la ha retocado (arrastrando imanes), su colocación se guarda en `next/current` y los nuevos apuntados entran en un hueco libre.

### Algunas decisiones

**Sin frameworks ni herramientas de compilación.** La app es lo bastante pequeña como para no necesitarlos. Así se puede publicar en cualquier sitio y abrir con un editor de texto, sin instalar nada.

**Scripts normales en lugar de módulos de JavaScript.** Los archivos comparten el mismo espacio de nombres y se cargan en el orden de `index.html`. Es lo que permite prescindir de herramientas, pero obliga a que cada nombre global sea único. Si la app creciera mucho, el paso natural sería convertirlos en módulos (`import`/`export`).

**`db` imita a una base de datos de documentos.** El resto de la app solo usa `collection().onSnapshot()` y `doc().set/update/delete()`, así que da igual si los datos están en el dispositivo (`db-local.js`) o en Firestore (`db-cloud.js`). Una diferencia que tapa `db-cloud.js`: en Firestore, `update()` sustituye los objetos enteros, y la app manda cambios anidados (`{ score: { W: 3 } }`) que solo deben tocar lo que traen; se convierten en rutas de campo (`score.W`).

**Solo ver se decide en la interfaz y se garantiza en el servidor.** Sin entrar, la app esconde todo lo que cambia datos (clase `viewer` en `body` y `.edit-only`), pero lo que de verdad impide escribir son las reglas de `firestore.rules`.

**Sin medias.** La app las tuvo y se quitaron para poder compartirla. Los datos antiguos pueden traer `atq`, `def` y `por` en los jugadores, y `ovr` y `por` en los partidos: se ignoran, y al restaurar una copia o subir los datos al servidor se borran, para que nadie pueda leerlos.

**La app abre desde la caché.** Cada versión guarda todos sus archivos en el dispositivo al instalarse, y al abrir la app se leen de ahí sin preguntar al servidor por cada uno. Por eso abre al momento, con o sin conexión, y por eso los cambios solo llegan al subir `VERSION`.

**El reparto es determinista.** La misma lista de apuntados da siempre el mismo reparto, en todos los móviles: entre los repartos igual de equilibrados se elige uno con un generador aleatorio cuya semilla sale de los ids de los apuntados. Hasta 16 apuntados se prueban todos los repartos; con más, se buscan al azar y se mejoran intercambiando parejas.

### Cómo se guardan los datos

Los datos son cinco colecciones: `players` (cada jugador: `name`, `pos` con sus posiciones y `order` en la lista), `matches` (el historial), `settings` (el nombre del grupo y el año del Rewind publicado), `signups` (los apuntados al próximo partido: el id del jugador, con `at`, cuándo se apuntó) y `next` (un documento, `current`, con el día, la hora, el formato y, si quien organiza la ha retocado, la colocación de la alineación). Con servidor están en Cloud Firestore (y Firestore guarda una copia en el dispositivo para funcionar sin conexión); sin servidor, en el `localStorage` del navegador. Además hay preferencias de cada dispositivo, siempre en `localStorage`:

- **`pachangas-db-v1`** (sin servidor): las cinco colecciones. Cada partido de `matches` lleva la fecha como id, el formato, la formación, los jugadores de cada equipo con su puesto y su sitio, `score` y `goals`. La copia de seguridad lleva `players`, `matches` y `settings`.
- **`pach-v4`**: las preferencias de este dispositivo: pestaña abierta y qué se comparte (alineación o equipos), y lo último que llegó del próximo partido.
- **`pach-subido`**: ya se subieron al servidor los datos que había en este dispositivo.

### Ampliar la app

- **Otra formación:** se cambia en `FORMS` (`config.js`). Las de tres líneas (3-3-1) y cuatro (4-2-3-1) ya tienen sus alturas en `LINES`.
- **Un formato nuevo:** su formación en `FORMS`, cuántos jugadores necesita en `NEED` y su botón en Opciones (`index.html`). Si necesita otro campo, se dibuja en `pitch.js` y en `drawPitchLines` (`share-image.js`).
- **Una estadística nueva:** se calcula en `computeStats` (`stats.js`) y se añade su tarjeta en `tab-stats.js`.
- **Un archivo nuevo:** se añade a `index.html` en el lugar que le corresponda según de qué dependa, y a la lista `SHELL` de `sw.js`.
