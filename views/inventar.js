import { S } from '../auth.js';
import { fmtEuro } from '../helpers.js';

export default function vInventar() {
  const srch = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const filter = S.invFilter || 'alle';
  let list = S.inventar.filter(i =>
    !srch || i.name?.toLowerCase().includes(srch) || i.kategorie?.toLowerCase().includes(srch)
  );
  if (filter === 'low') list = list.filter(i => i.mindestbestand > 0 && i.bestand <= i.mindestbestand);

  const lowCount = S.inventar.filter(i => i.mindestbestand > 0 && i.bestand <= i.mindestbestand).length;

  return `
<div class="sec-head">
  <h2>Inventar</h2>
  <button class="btn" onclick="openM('neuInventar')">+ Neu</button>
</div>

<input id="inv-search" placeholder="Suchen…" oninput="appRender()"
       style="margin-bottom:.7rem" value="${srch}">

<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.85rem">
  <button class="btn-sm" onclick="S.invFilter='alle';appRender()"
          style="${filter==='alle'?'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600':''}">Alle</button>
  <button class="btn-sm" onclick="S.invFilter='low';appRender()"
          style="${filter==='low'?'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600':''}">
    Nachbestellen${lowCount > 0 ? ` (${lowCount})` : ''}
  </button>
</div>

${list.map(i => {
  const isLow = i.mindestbestand > 0 && i.bestand <= i.mindestbestand;
  const wert = (i.bestand || 0) * (i.einkaufspreis || 0);
  return `
  <div class="card" onclick="openM('editInventar','${i.id}')">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div class="card-title">${i.name}</div>
        <div class="card-sub">
          ${i.kategorie || '—'}
          ${i.lieferant ? ` · ${i.lieferant}` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0">
        <span style="font-family:'DM Serif Display',serif;font-size:1rem;${isLow?'color:var(--red2)':'color:var(--gold2)'}">
          ${i.bestand ?? 0} ${i.einheit || 'Stk'}
        </span>
        ${isLow ? `<span class="badge b-red">Bestellen</span>` : `<span class="badge b-grn">OK</span>`}
        ${wert > 0 ? `<span style="font-size:.65rem;color:var(--text3)">${fmtEuro(wert)}</span>` : ''}
      </div>
    </div>
    ${i.mindestbestand > 0 ? `
    <div style="margin-top:.4rem">
      <div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, ((i.bestand||0)/(i.mindestbestand||1))*100)}%;background:${isLow?'var(--red2)':'var(--green2)'};border-radius:2px"></div>
      </div>
      <div style="font-size:.62rem;color:var(--text3);margin-top:.2rem">Min. ${i.mindestbestand} ${i.einheit||'Stk'}</div>
    </div>` : ''}
  </div>`;
}).join('')}
${list.length === 0 ? '<div class="empty">Keine Artikel gefunden</div>' : ''}
<div style="margin-top:.85rem;text-align:center;color:var(--text3);font-size:.72rem">
  ${list.length} Artikel · Wert: ${fmtEuro(list.reduce((s,i)=>s+(i.bestand||0)*(i.einkaufspreis||0),0))}
</div>
`;
}
