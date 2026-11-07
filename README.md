# ⚽ Mi pachanga

La pizarra del míster para la pachanga del fin de semana: pasas lista, la app reparte dos equipos lo más igualados posible y tú colocas a cada uno en su sitio arrastrando los imanes.

Guarda el historial de partidos con resultado y goleadores, y lleva las estadísticas para saber quién es el pichichi del grupo.

Es una aplicación web que se instala en el móvil como cualquier otra app. Funciona sin conexión, no pide cuenta ni registro y todo se guarda en tu dispositivo: no hay ningún servidor detrás.

---

## Qué puedes hacer

### 📋 Alineación

- Marca en la **convocatoria** quién viene y la app reparte el Equipo Blanco y el Equipo Oscuro igualando sus medias y repartiendo bien las posiciones. Si no te convence el reparto, pulsa **Otra opción**.
- Juega a **fútbol 7, fútbol 8 o fútbol 11**. El de 11 tiene su propio campo, con las medidas reales. Cada equipo elige su **formación** (2-3-1, 3-3-1, 4-4-2, 4-3-3…). Los jugadores se colocan solos en su línea y puedes moverlos arrastrando: al soltar un imán salta a la posición libre más cercana, y si lo sueltas en la otra mitad del campo cambia de equipo. Los fichajes de última hora, en dos segundos.
- **Invertir equipos** cambia el Blanco por el Oscuro sin mover a nadie de sitio.
- El portero cuenta en la media de su equipo con su nota de portero, y su imán la muestra.
- **Guardar alineación en historial** guarda el partido con la fecha elegida (por defecto, la de hoy). Al abrir la app, la pizarra carga la última alineación guardada.
- **Compartir** manda la alineación en texto por WhatsApp o Telegram, o crea una imagen sin medias para compartirla o descargarla. Así nadie se pica al ver su nota. Arriba del menú eliges **qué compartes**, tanto en texto como en imagen: la **alineación** (posiciones y banquillo; en imagen, el campo con los imanes) o solo los **equipos** (los jugadores de cada uno, sin posiciones; en imagen, en dos columnas). La app recuerda la última elección.

### 👟 Jugadores

Cada jugador tiene nota de ataque, defensa y portero (de 1 a 99) y una o varias posiciones. La media se calcula según la posición: un defensa cuenta más su defensa, un delantero su ataque, y un portero su nota de portero.

### 🏆 Historial y estadísticas

En el historial apuntas el resultado y quién marcó cada gol. Puedes volver a cargar cualquier alineación en la pizarra. La pestaña de estadísticas muestra goleadores (con sus partidos jugados; a igualdad de goles, va antes quien ha jugado menos partidos), partidos jugados y partidos ganados, empatados y perdidos de cada jugador. Los datos no mienten. Con **Compartir goleadores** mandas la tabla de goleadores en texto por WhatsApp o Telegram, o en imagen para descargarla o compartirla.

### ⚙️ Opciones

- **Nombre del grupo**: el que sale encima del título y en la imagen que compartes.
- **Día del partido**: por defecto, hoy, pero puedes elegir cualquier fecha. Cuando ese día pasa, vuelve sola a la de hoy.
- **Formato**: 7 vs 7, 8 vs 8 u 11 vs 11.
- **Medias**: puedes ocultarlas en toda la app sin perder las notas.
- **Copia de seguridad**: descarga un archivo con todos los jugadores y el historial, y restáuralo en el mismo móvil o en otro. Es la forma de pasar los datos de un dispositivo a otro.
- **Borrar todos los datos**: deja la app vacía, para empezar de cero. Pide confirmación y no se puede deshacer.
- **Versión**: al final de la pestaña, con un botón para buscar actualizaciones.

---

## Saltar al campo

1. Abre [md6-0.github.io/alineaciones-pachangas](https://md6-0.github.io/alineaciones-pachangas/) en el navegador del móvil.
2. Instálala: en Android, menú del navegador → *Añadir a pantalla de inicio*; en iPhone, botón *Compartir* → *Añadir a pantalla de inicio*.
3. La primera vez la app trae una plantilla de ejemplo de 24 jugadores (Jugador 1, Jugador 2…), suficientes para cualquier formato, ya colocada en la pizarra, para que pruebes sin preparar nada. Cámbiales el nombre y las notas en **Jugadores**, o restaura tu copia en **Opciones** (⚙) si ya tenías datos: la copia sustituye a la plantilla de ejemplo.

Cuando hay una versión nueva, la app la busca sola al volver a ella y cada media hora, y te avisa arriba con un botón **Actualizar**: tú decides cuándo, para que no se recargue mientras escribes.

Los datos se guardan en el navegador de cada dispositivo. Si borras los datos del navegador se pierden, así que descarga una copia de vez en cuando, mejor después de cada partido.

## Para desarrolladores

### Ponerla en marcha

La app son archivos estáticos: no tiene dependencias ni necesita compilarse. Para probarla en el ordenador basta un servidor web cualquiera:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. La parte que permite usarla sin conexión (el *service worker*) solo funciona en `localhost` o con HTTPS.

Se publica con GitHub Pages desde la rama `main`, carpeta raíz.

### Pruebas

La carpeta `tests/` tiene pruebas que abren la app en un navegador real (con [Playwright](https://playwright.dev)) y hacen lo que haría una persona: repartir equipos, arrastrar imanes, editar jugadores, guardar partidos con resultado y goles, hacer y restaurar copias, compartir, usarla sin conexión… No forman parte de la app publicada. Para ejecutarlas:

```bash
cd tests
npm install
npx playwright install chromium
npm test                 # todas; también: node run.js 2 5 para elegir algunas
```

Cada prueba levanta su propio servidor local y no necesita internet. Si cambias algo de la interfaz y una prueba falla, suele ser porque el texto o el comportamiento que comprobaba ha cambiado a propósito: se actualiza la prueba.

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
css/lineup.css         pestaña Alineación: convocatoria, equipos, banquillos y menú Compartir
css/players.css        pestaña Jugadores
css/history.css        pestaña Historial
css/stats.css          pestaña Estadísticas
css/options.css        pestaña Opciones

js/util.js             utilidades generales: DOM, texto, fechas y descargas
js/sample-squad.js     plantilla de ejemplo de la primera visita
js/db.js               almacenamiento en el dispositivo (localStorage)
js/config.js           constantes: equipos, formatos, formaciones, posiciones y pesos de la media
js/state.js            estado en memoria y preferencias de este dispositivo
js/settings.js         ajustes que viajan con los datos (nombre del grupo)
js/dates.js            día del partido
js/players.js          jugadores: lectura, media según la posición, añadir, cambiar y quitar
js/teams.js            reparto en dos equipos igualados
js/formation.js        colocación en la pizarra: huecos, portero, soltar imanes, invertir equipos
js/matches.js          historial: guardar la alineación, resultado, goles y volver a cargarla
js/stats.js            cálculo de las estadísticas
js/backup.js           copia de seguridad y borrar todo
js/ui.js               piezas de interfaz reutilizables: avisos, confirmaciones, imagen a pantalla completa
js/views.js            pestañas y repintado
js/pitch.js            dibujo del campo en SVG
js/tab-lineup.js       pestaña Alineación
js/drag.js             arrastrar imanes
js/share-image.js      imagen de la alineación para compartir
js/share-teams-image.js imagen de los equipos (solo jugadores) para compartir
js/share-menu.js       piezas comunes de los menús Compartir (abrir, cerrar, enlaces, botones de imagen)
js/share.js            menú Compartir de la Alineación
js/tab-players.js      pestaña Jugadores
js/tab-history.js      pestaña Historial
js/tab-stats.js        pestaña Estadísticas
js/share-scorers.js    goleadores para compartir: texto, imagen y su menú
js/tab-options.js      pestaña Opciones
js/updates.js          aviso de versión nueva
js/main.js             arranque
```

Los archivos de `js/` se cargan en ese orden y cada uno se apoya en los anteriores. Forman tres capas:

- **La base** (`util`, `sample-squad`, `db`, `config`, `state`) no sabe nada de la interfaz.
- **Las reglas** (de `settings` a `backup`) no tocan la pantalla. Todo lo que decide cómo se reparten los equipos, dónde va cada jugador, cómo se calcula una media o qué se guarda en un partido está ahí, en un único sitio. El resto de la app llama a esas funciones (`solve`, `rebuild`, `dropOnPitch`, `saveLineup`, `changeGoal`, `computeStats`…) en lugar de repetir la lógica.
- **La interfaz** (`ui`, `views` y un archivo por pestaña o funcionalidad) pinta la pantalla a partir del estado y responde a lo que hace el usuario.

El flujo es siempre el mismo: una acción cambia los datos o la pizarra y se vuelve a pintar a partir del estado. Los cambios de los datos (jugadores, partidos, ajustes) se guardan con `db`, que avisa a `main.js`; este recalcula el estado y repinta lo que depende de él. Los cambios de la pizarra (convocatoria, formaciones, arrastrar) no se guardan en `db`: cambian `layout` y llaman a `render()`.

### Algunas decisiones

**Sin frameworks ni herramientas de compilación.** La app es lo bastante pequeña como para no necesitarlos. Así se puede publicar en cualquier sitio y abrir con un editor de texto, sin instalar nada.

**Scripts normales en lugar de módulos de JavaScript.** Los archivos comparten el mismo espacio de nombres y se cargan en el orden de `index.html`. Es lo que permite prescindir de herramientas, pero obliga a que cada nombre global sea único. Si la app creciera mucho, el paso natural sería convertirlos en módulos (`import`/`export`).

**`db` imita a una base de datos de documentos.** Hoy guarda todo en `localStorage`, pero el resto de la app solo usa `collection().onSnapshot()` y `doc().set/update/delete()`. Para pasar a una base de datos en la nube bastaría con cambiar `db.js`.

**La app abre desde la caché.** Cada versión guarda todos sus archivos en el dispositivo al instalarse, y al abrir la app se leen de ahí sin preguntar al servidor por cada uno. Por eso abre al momento, con o sin conexión, y por eso los cambios solo llegan al subir `VERSION`.

**El reparto es determinista.** La misma convocatoria da siempre las mismas opciones; **Otra opción** pasa a la siguiente de las seis mejores. Hasta 16 convocados se prueban todos los repartos; con más, se buscan con un generador aleatorio con semilla.

### Cómo se guardan los datos

Todo está en el `localStorage` del navegador, en dos claves:

- **`pachangas-db-v1`**: los datos, en tres colecciones. `players` (cada jugador: `name`, `atq`, `def`, `por` de 1 a 99, `pos` con sus posiciones y `order` en la lista), `matches` (cada partido, con la fecha como id: formato, formaciones, los jugadores de cada equipo con su posición, `score` y `goals`) y `settings` (el nombre del grupo). Es lo que va en la copia de seguridad.
- **`pach-v4`**: las preferencias de este dispositivo: convocatoria, formato, formaciones, medias, fecha elegida, pestaña abierta, orden de la tabla de jugadores y qué se comparte (alineación o equipos).

### Ampliar la app

- **Una formación nueva:** se añade a `FORMS` en `config.js`, en el formato que corresponda.
- **Un formato nuevo:** sus formaciones en `FORMS`, cuántos jugadores necesita en `NEED` y su botón en Opciones (`index.html`). Si necesita otro campo, se dibuja en `pitch.js` y en `drawPitchLines` (`share-image.js`).
- **Una estadística nueva:** se calcula en `computeStats` (`stats.js`) y se añade su tarjeta en `tab-stats.js`.
- **Un archivo nuevo:** se añade a `index.html` en el lugar que le corresponda según de qué dependa, y a la lista `SHELL` de `sw.js`.
