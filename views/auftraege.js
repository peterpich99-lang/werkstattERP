import { S } from '../auth.js';
import { fmtDate, tbadge, sbadge, prioBadge, kBy } from '../helpers.js';

export default function vAuftraege() {
  const srch = (document.getElementById('auftrag-search')?.value || '').toLowerCase();
  const list = S.auftraege.filter(a =>
    (S.filter === 'alle' || a.status === S.filter) &&
    (!srch || a.titel?.toLowerCase().includes(srch) || (kBy(a.kunde_id)?.name || '').toLowerCase().includes(srch))
  );

  const filters = [
    { id: 'alle', l: 'Alle' },
    { id: 'offen', l: 'Offen' },
    { id: 'in_arbeit', l: 'In Arbeit' },
    { id: 'abgeschlossen', l: 'Fertig' },
  ];

  return `
<div class="sec-head">
  <h2>Aufträge</h2>
  <button class="btn" onclick="openM('neuAuftrag')">+ Neu</button>
</div>

<input id="auftrag-search" placeholder="Suchen…" oninput="appRender()"
       style="margin-bottom:.7rem" value="${srch}">

<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.85rem">
  ${filters.map(f => `
    <button class="btn-sm" data-action="filter" data-val="${f.id}"
            style="${S.filter === f.id ? 'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600' : ''}">
      ${f.l}
    </button>`).join('')}
</div>

${list.map(a => `
  <div class="card" onclick="openA('${a.id}')">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div class="card-title">${a.titel}</div>
        <div class="card-sub">
          ${kBy(a.kunde_id)?.name || '—'} · ${fmtDate(a.erstellt_am)}
          ${a.faellig_am ? ` · Fällig ${fmtDate(a.faellig_am)}` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0">
        ${tbadge(a.auftragstyp_id)}${sbadge(a.status)}${prioBadge(a.prioritaet)}
        ${S.timer?.auftragId === a.id ? '<span class="badge b-red">● Läuft</span>' : ''}
      </div>
    </div>
  </div>`).join('')}
${list.length === 0 ? '<div class="empty">Keine Aufträge gefunden</div>' : ''}
`;
}
