"use strict";
/* Dibujo del campo (líneas de cal en SVG). Fútbol 7 y 8 usan el mismo campo; fútbol 11, uno más largo.
   w y h son las proporciones del campo, que también usan la pizarra, el arrastre y la imagen para compartir. */

// Campo de fútbol 7 (y 8), en unidades de 44 × 64
const LINES7=`<svg class="lines" viewBox="0 0 44 64" preserveAspectRatio="none" aria-hidden="true">
<g fill="none" stroke="var(--chalk)" stroke-width=".2" stroke-linecap="round">
<rect x="2" y="2" width="40" height="60"/>
<line x1="2" y1="32" x2="42" y2="32"/>
<circle cx="22" cy="32" r="6"/>
<rect x="10" y="2" width="24" height="11"/><rect x="16" y="2" width="12" height="4.3"/>
<rect x="10" y="51" width="24" height="11"/><rect x="16" y="57.7" width="12" height="4.3"/>
<rect x="19" y=".9" width="6" height="1.1"/><rect x="19" y="62" width="6" height="1.1"/>
<path d="M2 2.6 A.6 .6 0 0 0 2.6 2 M41.4 2 A.6 .6 0 0 0 42 2.6 M2 61.4 A.6 .6 0 0 1 2.6 62 M41.4 62 A.6 .6 0 0 1 42 61.4"/>
</g>
<g fill="none" stroke="var(--chalk)" stroke-width=".2" stroke-dasharray=".9 .7"><line x1="2" y1="15" x2="42" y2="15"/><line x1="2" y1="49" x2="42" y2="49"/></g>
<g fill="var(--chalk)"><circle cx="22" cy="32" r=".35"/><circle cx="22" cy="11" r=".3"/><circle cx="22" cy="53" r=".3"/></g></svg>`;
// Campo de fútbol 11 con sus medidas reales (105 × 68 m), dibujado en metros con 2 m de margen
const LINES11=`<svg class="lines" viewBox="0 0 72 109" preserveAspectRatio="none" aria-hidden="true">
<g fill="none" stroke="var(--chalk)" stroke-width=".25" stroke-linecap="round">
<rect x="2" y="2" width="68" height="105"/>
<line x1="2" y1="54.5" x2="70" y2="54.5"/>
<circle cx="36" cy="54.5" r="9.15"/>
<rect x="15.84" y="2" width="40.32" height="16.5"/><rect x="26.84" y="2" width="18.32" height="5.5"/>
<rect x="15.84" y="90.5" width="40.32" height="16.5"/><rect x="26.84" y="101.5" width="18.32" height="5.5"/>
<path d="M30.51 18.5 A9.15 9.15 0 0 0 41.49 18.5"/><path d="M30.51 90.5 A9.15 9.15 0 0 1 41.49 90.5"/>
<rect x="32.34" y=".6" width="7.32" height="1.4"/><rect x="32.34" y="107" width="7.32" height="1.4"/>
<path d="M2 3 A1 1 0 0 0 3 2 M69 2 A1 1 0 0 0 70 3 M2 106 A1 1 0 0 1 3 107 M69 107 A1 1 0 0 1 70 106"/>
</g>
<g fill="var(--chalk)"><circle cx="36" cy="54.5" r=".45"/><circle cx="36" cy="13" r=".4"/><circle cx="36" cy="96" r=".4"/></g></svg>`;
const PITCH = { "7": { w: 44, h: 64, svg: LINES7 }, "11": { w: 72, h: 109, svg: LINES11 } };
/** Campo del formato actual. */
const pitch = () => PITCH[st.mode === "11" ? "11" : "7"];
