"use strict";
/* Pestaña Pagos (solo quien organiza): quién ha pagado su parte de la pista en cada partido y la lista de lo que falta.
   Cada partido tiene su documento payments/{id del partido} = { court: precio de la pista, paid: { idJugador: true } }.
   La pista se reparte a partes iguales entre todos los que jugaron (los dos equipos, banquillo incluido).
   Las reglas de Firebase solo dejan leer y escribir los pagos a quien organiza: los demás ni los descargan. */

const COURT_PRICE = 20;
let payments = {}, paysLoaded = false, paysFailed = false, offPayments = null;
const payOpen = {};   // partidos abiertos o cerrados a mano (si no, se abren los que tienen algo pendiente)

const payOf = id => payments[id] || {};
const courtOf = id => { const c = payOf(id).court; return typeof c === "number" && isFinite(c) && c >= 0 ? c : COURT_PRICE; };
/** Jugadores del partido, sin repetir y por orden alfabético (para encontrar rápido a quien paga). */
function payers(m) {
  const seen = new Set();
  return [].concat(Array.isArray(m.W) ? m.W : [], Array.isArray(m.D) ? m.D : [])
    .filter(p => p && p.id && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => payName(a).localeCompare(payName(b), "es"));
}
/** Lo que paga cada uno en un partido, redondeado al céntimo. */
const shareOf = m => { const n = payers(m).length; return n ? Math.round(courtOf(m.id) * 100 / n) / 100 : 0; };
/** Nombre actual del jugador (o el que tenía en el partido, si ya no está en la plantilla). */
const payName = p => BY[p.id] ? BY[p.id].n : p.name;
const euros = v => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",") + " €";

/** Partidos con alguien sin pagar: [{ m, share, who: [jugador] }], del más reciente al más antiguo. */
function pendingList() {
  return matches.map(m => {
    const paid = payOf(m.id).paid || {};
    return { m, share: shareOf(m), who: payers(m).filter(p => !paid[p.id]) };
  }).filter(x => x.who.length && x.share > 0);
}

/** Texto para WhatsApp: quién falta por pagar en cada partido y el total de cada uno. "" si no falta nadie. */
function pendingText() {
  const list = pendingList();
  if (!list.length) return "";
  const tot = {};
  const blocks = list.map(({ m, share, who }) => {
    who.forEach(p => { const t = tot[p.id] = tot[p.id] || { name: payName(p), v: 0, n: 0 }; t.v += share; t.n++; });
    return `*${fmtDate(m.date || m.id)}* · ${euros(share)} cada uno\n${who.map(p => "- " + (payName(p))).join("\n")}`;
  });
  const people = Object.values(tot).sort((a, b) => b.v - a.v || a.name.localeCompare(b.name, "es"));
  return `💶 Falta por pagar la pista\n\n${blocks.join("\n\n")}`
    + (list.length > 1 ? `\n\n*Total por persona*\n${people.map(p => `${p.name}: ${euros(p.v)}`).join("\n")}` : "");
}

/** Escucha los pagos solo mientras se puede editar (con servidor, al entrar; al salir se olvidan). */
function watchPayments() {
  if (canEdit() && !offPayments) {
    offPayments = db.collection("payments").onSnapshot(s => {
      payments = Object.fromEntries(s.docs.map(d => [d.id, d.data()]));
      paysLoaded = true; paysFailed = false; renderPayments();
    }, () => { paysFailed = true; renderPayments(); });
  } else if (!canEdit() && offPayments) {
    offPayments(); offPayments = null;
    payments = {}; paysLoaded = false; paysFailed = false;
  }
}

/* ---------- Pintar ---------- */

function payHTML(m) {
  const ps = payers(m), paid = payOf(m.id).paid || {}, k = ps.filter(p => paid[p.id]).length, full = k === ps.length;
  const open = m.id in payOpen ? payOpen[m.id] : !full;
  return `<details class="pay${full ? " full" : ""}" data-id="${esc(m.id)}"${open ? " open" : ""}>
      <summary><span class="pdate">${esc(fmtDate(m.date || m.id))}</span><span class="pk">${full ? "Pagado ✓" : `${k} de ${ps.length}`}</span></summary>
      <div class="pbody">
        <div class="prow"><label>Pista <input type="number" inputmode="decimal" min="0" max="999" step="0.5" data-court value="${courtOf(m.id)}" aria-label="Precio de la pista"> €</label>
          <span class="pper"><b>${euros(shareOf(m))}</b> cada uno (${ps.length})</span></div>
        <div class="pchips">${ps.map(p => `<button type="button" class="pchip${paid[p.id] ? " on" : ""}" data-pid="${esc(p.id)}" aria-pressed="${!!paid[p.id]}">${paid[p.id] ? "✓ " : ""}${esc(payName(p))}</button>`).join("")}</div>
        <div class="pfoot"><button type="button" class="btn ghost" data-all="${full ? "" : "1"}">${full ? "Desmarcar a todos" : "Han pagado todos"}</button></div>
      </div>
    </details>`;
}

function renderPayments() {
  const box = $("#paylist"), sum = $("#paysum");
  if (!canEdit()) { box.innerHTML = ""; sum.innerHTML = ""; return; }
  if (paysFailed) { sum.innerHTML = ""; box.innerHTML = '<p class="hint">No se pueden leer los pagos. Si acabas de actualizar, añade la regla de <b>payments</b> en Firebase (Firestore Database → Reglas): está en el README.</p>'; return; }
  if (failed) { sum.innerHTML = ""; box.innerHTML = `<p class="hint">${LOAD_ERROR}</p>`; return; }
  if (!histLoaded || !paysLoaded) { sum.innerHTML = ""; box.innerHTML = '<p class="hint">Cargando pagos…</p>'; return; }
  const ae = document.activeElement;
  if (box.contains(ae) && ae.tagName === "INPUT") return;   // no repintar mientras se escribe el precio
  const ms = matches.filter(m => payers(m).length);
  if (!ms.length) { sum.innerHTML = ""; box.innerHTML = '<p class="hint">Aún no hay partidos. Cuando guardes uno con "Partido jugado", aquí podrás apuntar quién te ha pagado.</p>'; return; }
  const pend = pendingList(), n = pend.reduce((s, x) => s + x.who.length, 0), owed = pend.reduce((s, x) => s + x.share * x.who.length, 0);
  sum.innerHTML = n ? `<b>${euros(owed)}</b> por cobrar · ${n} ${n === 1 ? "pago pendiente" : "pagos pendientes"}` : "<b>Todo cobrado</b> ✓";
  box.innerHTML = ms.map(payHTML).join("");
}

/* ---------- Acciones ---------- */

/** Guarda el documento entero del partido (puede no existir aún). Se aplica al momento, sin esperar al servidor. */
function setPay(id, { court, paid = {} }) {
  const cur = payOf(id), next = { court: court === undefined ? courtOf(id) : court, paid: Object.assign({}, cur.paid || {}) };
  for (const k in paid) { if (paid[k]) next.paid[k] = true; else delete next.paid[k]; }
  payments[id] = next;
  renderPayments();
  return db.doc("payments/" + id).set(next).catch(() => toast("No se pudo guardar el pago."));
}

const paylist = $("#paylist");
paylist.addEventListener("click", e => {
  const sm = e.target.closest("summary");
  if (sm) { const d = sm.parentElement; payOpen[d.dataset.id] = !d.open; return; }   // recordar lo que se abre o cierra a mano
  const chip = e.target.closest("[data-pid]"), all = e.target.closest("[data-all]");
  if (!chip && !all) return;
  const id = e.target.closest(".pay").dataset.id, m = matchById(id); if (!m) return;
  if (chip) { const pid = chip.dataset.pid; setPay(id, { paid: { [pid]: !(payOf(id).paid || {})[pid] } }); return; }
  const on = !!all.dataset.all;
  setPay(id, { paid: Object.fromEntries(payers(m).map(p => [p.id, on])) });
});
paylist.addEventListener("change", e => {
  const inp = e.target.closest("[data-court]"); if (!inp) return;
  const id = inp.closest(".pay").dataset.id, v = Math.round(parseFloat(String(inp.value).replace(",", ".")) * 100) / 100;
  if (!isFinite(v) || v < 0 || v > 999) { inp.value = courtOf(id); toast("Pon el precio de la pista en euros."); return; }
  setPay(id, { court: v });
});
paylist.addEventListener("focusout", () => {
  setTimeout(() => { if (!paylist.contains(document.activeElement)) renderPayments(); }, 50);
});


const paymenu = $("#paymenu");
dropMenu($("#paybtn"), paymenu, {
  open: () => {
    const t = pendingText();
    if (!t) { toast("No falta nadie por pagar."); return false; }
    setTextLinks(paymenu, t);
  }
});
paymenu.querySelector(".s-copy").addEventListener("click", () => {
  const t = pendingText();
  if (!t) return;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
    .then(() => toast("Lista copiada."), () => toast("No se pudo copiar."));
});
