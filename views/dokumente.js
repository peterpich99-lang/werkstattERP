import { S } from '../auth.js';
import { fmtDate, fmtEuro, sbadge, kBy } from '../helpers.js';

export default function vDokumente() {
  const isAng = (S.doktab || 'angebote') === 'angebote';
  const list  = isAng ? S.angebote : S.rechnungen;

  return `
<div class="sec-head">
  <h2>Dokumente</h2>
  <button class="btn" onclick="openM('${isAng ? 'neuAng' : 'neuRe'}')">+ Neu</button>
</div>

<div style="display:flex;border-bottom:1px solid var(--border);margin-bottom:.85rem">
  <button class="auth-tab${isAng ? ' on' : ''}" data-action="doktab" data-val="angebote">Angebote</button>
  <button class="auth-tab${!isAng ? ' on' : ''}" data-action="doktab" data-val="rechnungen">Rechnungen</button>
</div>

${list.map(d => {
  const kunde = kBy(d.kunde_id);
  return `
  <div class="card" onclick="openM('${isAng ? 'viewAng' : 'viewRe'}','${d.id}')">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div style="font-size:.65rem;color:var(--text3);font-weight:600;letter-spacing:.5px">${d.nummer || ''}</div>
        <div class="card-title" style="margin-top:.1rem">${d.titel || '—'}</div>
        <div class="card-sub">${kunde?.name || '—'} · ${fmtDate(d.erstellt_am)}</div>
        ${!isAng && d.faellig_am ? `<div style="font-size:.7rem;color:var(--amber2)">Fällig: ${fmtDate(d.faellig_am)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;flex-shrink:0">
        ${sbadge(d.status)}
        <span style="font-family:'DM Serif Display',serif;font-size:1rem;color:var(--gold2)">${fmtEuro(d.brutto)}</span>
      </div>
    </div>
  </div>`;
}).join('')}
${list.length === 0 ? `<div class="empty">Keine ${isAng ? 'Angebote' : 'Rechnungen'}</div>` : ''}

<div style="margin-top:.85rem;text-align:center;color:var(--text3);font-size:.72rem">
  ${list.length} ${isAng ? 'Angebote' : 'Rechnungen'} ·
  Gesamt: ${fmtEuro(list.reduce((s, d) => s + (d.brutto || 0), 0))}
</div>
`;
}
