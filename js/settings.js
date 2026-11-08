"use strict";
/* Ajustes que viajan con los datos (y con la copia de seguridad): de momento, el nombre del grupo.
   Las preferencias de este dispositivo (quién eres, pestaña abierta…) están en state.js. */

const groupName = () => (settings.groupName || "").trim() || DEFAULT_GROUP;

/** Guarda el nombre del grupo (vacío para el de por defecto). */
function setGroupName(v) {
  settings = Object.assign({}, settings, { groupName: v.trim().slice(0, 40) });
  return db.doc("settings/general").set(Object.assign({}, settings));
}
