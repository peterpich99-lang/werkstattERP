import { S } from '../auth.js';
import { fmtDate } from '../helpers.js';

export default function vKunden() {
  const srch = (document.getElementById('kunden-search')?.value || '').toLowerCase();
  const list = S.kunden.filter(k =>
    !srch || k.name?.toLowerCase().includes(srch) || k.email?.toLowerCase().includes(srch) || k.telefon?.includes(srch)
  );

  return `
<div class="sec-head">
  <h2>Kunden</h2>
  <button class="btn" onclick="openM('neuKunde')">+ Neu</button>
</div>

<input id="kunden-search" placeholder="Suchen…" oninput="appRender()"
       style="margin-bottom:.7rem" value="${srch}">

${list.map(k => {
  const auftraege = S.auftraege.filter(a => a.kunde_id === k.id);
  const offen = auftraege.filter(a => a.status === 'offen' || a.status === 'in_arbeit').length;
  return `
  <div class="card" onclick="openM('editKunde','${k.id}')">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div class="card-title">${k.name}</div>
        <div class="card-sub">
          ${k.email ? `<span>${k.email}</span>` : ''}
          ${k.email && k.telefon ? ' · ' : ''}
          ${k.telefon ? `<span>${k.telefon}</span>` : ''}
          ${!k.email && !k.telefon ? '—' : ''}
        </div>
        ${k.adresse ? `<div style="font-size:.68rem;color:var(--text3);margin-top:.1rem">${k.adresse}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;flex-shrink:0">
        ${auftraege.length > 0 ? `<span class="badge b-gray">${auftraege.length} Auftr.</span>` : ''}
        ${offen > 0 ? `<span class="badge b-amb">${offen} offen</span>` : ''}
      </div>
    </div>
  </div>`;
}).join('')}
${list.length === 0 ? '<div class="empty">Keine Kunden gefunden</div>' : ''}
<div style="margin-top:.85rem;text-align:center;color:var(--text3);font-size:.72rem">
  ${list.length} Kunden
</div>
`;
}
