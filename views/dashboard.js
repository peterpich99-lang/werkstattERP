import { S } from '../auth.js';
import { fmtDate, fmtEuro, tbadge, sbadge, prioBadge, kBy } from '../helpers.js';

export default function vDash() {
  const offen    = S.auftraege.filter(a => a.status === 'offen' || a.status === 'in_arbeit');
  const openRe   = S.rechnungen.filter(r => r.status === 'entwurf' || r.status === 'gesendet');
  const bezahlt  = S.rechnungen.filter(r => r.status === 'bezahlt');
  const openAn   = S.angebote.filter(a => a.status === 'entwurf' || a.status === 'versendet');
  const low      = S.inventar.filter(i => i.mindestbestand > 0 && i.bestand <= i.mindestbestand);
  const in7      = new Date(Date.now() + 7 * 86400000);
  const faellig  = offen.filter(a => a.faellig_am && new Date(a.faellig_am) <= in7);
  const ausstehend = openRe.reduce((s, r) => s + (r.brutto || 0), 0);
  const einnahmen  = bezahlt.reduce((s, r) => s + (r.brutto || 0), 0);

  return `
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-val">${offen.length}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--amber2)"></span>Aufträge offen</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${openAn.length}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--gold2)"></span>Angebote offen</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${fmtEuro(ausstehend)}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--red2)"></span>Ausstehend</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${fmtEuro(einnahmen)}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--green2)"></span>Einnahmen</div>
  </div>
</div>

${faellig.length ? `
<div class="alert" style="border-color:rgba(212,85,85,.3)">
  <div class="alert-t" style="color:var(--red2)">Bald fällig</div>
  ${faellig.map(a => `
    <div style="font-size:.78rem;color:var(--text2);padding:.15rem 0;cursor:pointer"
         onclick="openA('${a.id}')">
      ${a.titel} — ${fmtDate(a.faellig_am)}
    </div>`).join('')}
</div>` : ''}

${low.length ? `
<div class="alert">
  <div class="alert-t">Nachbestellen</div>
  ${low.map(i => `
    <div style="font-size:.78rem;color:var(--text2);padding:.15rem 0;cursor:pointer"
         onclick="setTab('inventar')">
      ${i.name} — ${i.bestand} ${i.einheit} (Min. ${i.mindestbestand})
    </div>`).join('')}
</div>` : ''}

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-bottom:1rem">
  <button class="btn" onclick="openM('neuAuftrag')" style="padding:.6rem .3rem;font-size:.75rem">+ Auftrag</button>
  <button class="btn-ghost" onclick="openM('neuAng')" style="padding:.55rem .3rem;font-size:.75rem">+ Angebot</button>
  <button class="btn-ghost" onclick="openM('neuRe')" style="padding:.55rem .3rem;font-size:.75rem">+ Rechnung</button>
</div>

<div class="sec-h3">Aktuelle Aufträge</div>
${offen.slice(0, 6).map(a => `
  <div class="card" onclick="openA('${a.id}')">
    <div class="row">
      <div style="flex:1;min-width:0">
        <div class="card-title">${a.titel}</div>
        <div class="card-sub">${kBy(a.kunde_id)?.name || '—'} · ${fmtDate(a.erstellt_am)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0">
        ${tbadge(a.auftragstyp_id)}${sbadge(a.status)}${prioBadge(a.prioritaet)}
      </div>
    </div>
  </div>`).join('')}
${offen.length === 0 ? '<div class="empty">Keine offenen Aufträge</div>' : ''}
${offen.length > 6 ? `<div style="text-align:center;padding:.5rem"><button class="btn-ghost" onclick="setTab('auftraege')" style="font-size:.78rem">Alle ${offen.length} Aufträge</button></div>` : ''}
`;
}
