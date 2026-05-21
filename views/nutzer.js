import { S } from '../auth.js';
import { fmtDate } from '../helpers.js';

export default function vNutzer() {
  const pending = S.nutzer.filter(n => n.freigegeben === false);
  const active  = S.nutzer.filter(n => n.freigegeben !== false);

  return `
<div class="sec-head">
  <h2>Nutzer</h2>
  <button class="btn" onclick="openM('einladen')">+ Einladen</button>
</div>

${pending.length > 0 ? `
<div class="alert" style="border-color:rgba(245,158,11,.3);margin-bottom:.7rem">
  <div class="alert-t" style="color:var(--amber2)">Freigabe ausstehend (${pending.length})</div>
  ${pending.map(n => `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:.3rem 0;border-top:1px solid var(--border)">
    <div>
      <div style="font-size:.82rem">${n.name || '—'}</div>
      <div style="font-size:.65rem;color:var(--text3)">${n.email || '—'}</div>
    </div>
    <div style="display:flex;gap:.3rem">
      <button class="btn-sm" style="color:var(--green2);border-color:var(--green2)"
              onclick="toggleNutzer('${n.id}',true)">Freigeben</button>
      <button class="btn-sm" onclick="openM('editNutzer','${n.id}')">Edit</button>
    </div>
  </div>`).join('')}
</div>` : ''}

${[...active].map(n => {
  const isMe = n.id === S.user?.id || n.profil_id === S.profil?.id;
  const rolleLabel = { admin: 'Admin', mitarbeiter: 'Mitarbeiter', leserecht: 'Leserecht' }[n.rolle] || n.rolle || '—';
  return `
  <div class="card">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div class="card-title">${n.name || n.email || '—'} ${isMe ? '<span style="font-size:.65rem;color:var(--text3)">(ich)</span>' : ''}</div>
        <div class="card-sub">${n.email || '—'}</div>
        ${n.last_seen ? `<div style="font-size:.65rem;color:var(--text3)">Zuletzt aktiv ${fmtDate(n.last_seen)}</div>` : n.erstellt_am ? `<div style="font-size:.65rem;color:var(--text3)">Seit ${fmtDate(n.erstellt_am)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;flex-shrink:0">
        <span class="badge ${n.rolle==='admin'?'b-gold':n.rolle==='mitarbeiter'?'b-blu':'b-gray'}">${rolleLabel}</span>
        ${n.freigegeben === false ? '<span class="badge b-red">Gesperrt</span>' : '<span class="badge b-grn">Aktiv</span>'}
      </div>
    </div>
    ${!isMe && S.profil?.rolle === 'admin' ? `
    <div style="display:flex;gap:.4rem;margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border)">
      <button class="btn-sm" onclick="openM('editNutzer','${n.id}')">Bearbeiten</button>
      <button class="btn-sm" style="color:var(--red2);border-color:var(--red2)" onclick="toggleNutzer('${n.id}',${!n.freigegeben})">
        ${n.freigegeben === false ? 'Freigeben' : 'Sperren'}
      </button>
    </div>` : ''}
  </div>`;
}).join('')}
${S.nutzer.length === 0 ? '<div class="empty">Keine Nutzer</div>' : ''}

<div style="margin-top:1rem;padding:.85rem;background:var(--s2);border:1px solid var(--border2);border-radius:10px;font-size:.78rem;color:var(--text2)">
  <div style="font-weight:600;color:var(--text1);margin-bottom:.35rem">Firma-Einstellungen</div>
  <div>Firma: ${S.firma?.name || '—'}</div>
  <div style="margin-top:.2rem">USt-Satz: ${S.firma?.ust_satz || 20}%
    ${S.firma?.kleinunternehmer ? ' · <span style="color:var(--amber2)">Kleinunternehmer</span>' : ''}
  </div>
  <button class="btn-ghost" style="margin-top:.6rem;font-size:.75rem" onclick="setTab('settings')">Einstellungen öffnen</button>
</div>
`;
}
