# ⚽ Alineador pachangas

La pizarra del míster para la pachanga del fin de semana: pasas lista, la app reparte dos equipos lo más igualados posible y tú colocas a cada uno en su sitio arrastrando los imanes.

Guarda el historial de partidos con resultado y goleadores, y lleva las estadísticas para saber quién es el pichichi del grupo.

Es una aplicación web que se instala en el móvil como cualquier otra app. Funciona sin conexión, no pide cuenta ni registro y todo se guarda en tu dispositivo: no hay ningún servidor detrás.

---

## Qué puedes hacer

### 📋 Alineación

- Marca en la **convocatoria** quién viene y la app reparte el Equipo Blanco y el Equipo Oscuro igualando sus medias y repartiendo bien las posiciones. Si no te convence el reparto, pulsa **Otra opción**.
- Cada equipo elige su **formación** (2-3-1, 3-2-1, 3-3-1…). Los jugadores se colocan solos en su línea y puedes moverlos arrastrando: al soltar un imán salta a la posición libre más cercana, y si lo sueltas en la otra mitad del campo cambia de equipo. Los fichajes de última hora, en dos segundos.
- **Invertir equipos** cambia el Blanco por el Oscuro sin mover a nadie de sitio.
- El portero cuenta en la media de su equipo con su nota de portero, y su imán la muestra.
- **Guardar alineación en historial** guarda el partido con la fecha elegida (por defecto, el próximo sábado). Al abrir la app, la pizarra carga la última alineación guardada.
- **Compartir** manda la alineación en texto por WhatsApp o Telegram, o crea una imagen sin medias para compartirla o descargarla. Así nadie se pica al ver su nota.

### 👟 Jugadores

Cada jugador tiene nota de ataque, defensa y portero (de 1 a 99) y una o varias posiciones. La media se calcula según la posición: un defensa cuenta más su defensa, un delantero su ataque, y un portero su nota de portero.

### 🏆 Historial y estadísticas

En el historial apuntas el resultado y quién marcó cada gol. Puedes volver a cargar cualquier alineación en la pizarra. La pestaña de estadísticas muestra goleadores, partidos jugados y partidos ganados, empatados y perdidos de cada jugador. Los datos no mienten.

### ⚙️ Opciones

- **Nombre del grupo**: el que sale encima del título y en la imagen que compartes.
- **Día del partido**: por defecto el próximo sábado, pero puedes elegir cualquier fecha. Cuando ese día pasa, vuelve solo al sábado.
- Formato: 7 vs 7 u 8 vs 8.
- **Medias**: puedes ocultarlas en toda la app sin perder las notas.
- **Copia de seguridad**: descarga un archivo con todos los jugadores y el historial, y restáuralo en el mismo móvil o en otro. Es la forma de pasar los datos de un dispositivo a otro.

---

## Saltar al campo

1. Abre [md6-0.github.io/alineaciones-pachangas](https://md6-0.github.io/alineaciones-pachangas/) en el navegador del móvil.
2. Instálala: en Android, menú del navegador → *Añadir a pantalla de inicio*; en iPhone, botón *Compartir* → *Añadir a pantalla de inicio*.
3. La primera vez la app trae una plantilla de ejemplo (Jugador 1, Jugador 2…) ya colocada en la pizarra, para que pruebes sin preparar nada. Cámbiales el nombre y las notas en **Jugadores**, o restaura tu copia en **Opciones** (⚙) si ya tenías datos: la copia sustituye a la plantilla de ejemplo.

Los datos se guardan en el navegador de cada dispositivo. Si borras los datos del navegador se pierden, así que descarga una copia de vez en cuando, mejor después de cada partido.

## Cómo está hecha

Una sola página (`index.html`) con HTML, CSS y JavaScript sin dependencias ni paso de compilación. Los datos se guardan en `localStorage`; `sw.js` hace que funcione sin conexión y `manifest.webmanifest` permite instalarla.

Para probarla en local basta con servir la carpeta, por ejemplo con `python3 -m http.server`, y abrir `http://localhost:8000`.
