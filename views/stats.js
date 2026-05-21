import { S } from '../auth.js';
import { fmtEuro } from '../helpers.js';

export default function vStats() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const reMonat = S.rechnungen.filter(r => {
    const d = new Date(r.erstellt_am);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const reBezahlt = S.rechnungen.filter(r => r.status === 'bezahlt');
  const reOffen = S.rechnungen.filter(r => r.status === 'gesendet' || r.status === 'entwurf');

  const umsatzMonat = reMonat.filter(r => r.status === 'bezahlt').reduce((s, r) => s + (r.brutto || 0), 0);
  const umsatzGesamt = reBezahlt.reduce((s, r) => s + (r.brutto || 0), 0);
  const ausstehend = reOffen.reduce((s, r) => s + (r.brutto || 0), 0);

  const auftraege = S.auftraege;
  const byStatus = {
    offen: auftraege.filter(a => a.status === 'offen').length,
    in_arbeit: auftraege.filter(a => a.status === 'in_arbeit').length,
    abgeschlossen: auftraege.filter(a => a.status === 'abgeschlossen').length,
    storniert: auftraege.filter(a => a.status === 'storniert').length,
  };
  const total = auftraege.length || 1;

  const monatsNamen = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const umsatz = S.rechnungen
      .filter(r => r.status === 'bezahlt' && new Date(r.erstellt_am).getMonth() === m && new Date(r.erstellt_am).getFullYear() === y)
      .reduce((s, r) => s + (r.brutto || 0), 0);
    return { label: monatsNamen[m], umsatz };
  });
  const maxVal = Math.max(...last6.map(x => x.umsatz), 1);

  const topKunden = S.kunden.map(k => ({
    name: k.name,
    umsatz: reBezahlt.filter(r => r.kunde_id === k.id).reduce((s, r) => s + (r.brutto || 0), 0)
  })).filter(k => k.umsatz > 0).sort((a, b) => b.umsatz - a.umsatz).slice(0, 5);

  return `
<div class="sec-head">
  <h2>Statistik</h2>
</div>

<div class="kpi-grid" style="margin-bottom:.85rem">
  <div class="kpi">
    <div class="kpi-val" style="font-size:1rem">${fmtEuro(umsatzMonat)}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--green2)"></span>Diesen Monat</div>
  </div>
  <div class="kpi">
    <div class="kpi-val" style="font-size:1rem">${fmtEuro(umsatzGesamt)}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--gold2)"></span>Gesamt</div>
  </div>
  <div class="kpi">
    <div class="kpi-val" style="font-size:1rem">${fmtEuro(ausstehend)}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--red2)"></span>Ausstehend</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${reBezahlt.length}</div>
    <div class="kpi-lbl"><span class="kpi-dot" style="background:var(--blue2)"></span>Bezahlte Re.</div>
  </div>
</div>

<div class="sec-label">Umsatz letzte 6 Monate</div>
<div style="display:flex;align-items:flex-end;gap:.35rem;height:100px;margin-bottom:.3rem;padding:0 .2rem">
  ${last6.map(m => `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:.2rem">
    <div style="width:100%;background:var(--gold);border-radius:3px 3px 0 0;height:${Math.max(4, (m.umsatz/maxVal)*80)}px;opacity:${m.umsatz>0?'1':'0.3'}"></div>
    <div style="font-size:.58rem;color:var(--text3)">${m.label}</div>
  </div>`).join('')}
</div>

<div class="sec-label" style="margin-top:.85rem">Aufträge nach Status</div>
${[
  { k: 'offen', l: 'Offen', c: 'var(--amber2)' },
  { k: 'in_arbeit', l: 'In Arbeit', c: 'var(--gold2)' },
  { k: 'abgeschlossen', l: 'Fertig', c: 'var(--green2)' },
  { k: 'storniert', l: 'Storniert', c: 'var(--red2)' },
].map(({ k, l, c }) => `
  <div style="margin-bottom:.35rem">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:.15rem">
      <span style="color:var(--text2)">${l}</span>
      <span style="color:${c};font-weight:600">${byStatus[k]}</span>
    </div>
    <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
      <div style="height:100%;width:${(byStatus[k]/total)*100}%;background:${c};border-radius:2px"></div>
    </div>
  </div>`).join('')}

${topKunden.length > 0 ? `
<div class="sec-label" style="margin-top:.85rem">Top Kunden</div>
${topKunden.map((k, i) => `
  <div class="tbl-row">
    <span style="font-size:.72rem;color:var(--text3);width:1.2rem">${i+1}.</span>
    <span style="flex:1;font-size:.82rem">${k.name}</span>
    <span style="font-family:'DM Serif Display',serif;color:var(--gold2)">${fmtEuro(k.umsatz)}</span>
  </div>`).join('')}` : ''}

${reOffen.length > 0 ? `
<div class="sec-label" style="margin-top:.85rem">Offene Rechnungen</div>
${reOffen.map(r => {
  const overdue = r.faellig_am && new Date(r.faellig_am) < new Date();
  return `
  <div class="tbl-row" onclick="S.doktab='rechnungen';setTab('dokumente')" style="cursor:pointer">
    <div style="flex:1;min-width:0">
      <div style="font-size:.82rem">${r.titel||r.nummer||'—'}</div>
      <div style="font-size:.65rem;color:var(--text3)">${r.nummer||''}</div>
    </div>
    ${overdue ? `<span style="font-size:.65rem;font-weight:600;color:var(--red2)">Überfällig</span>` : ''}
    <span style="font-family:'DM Serif Display',serif;color:var(--amber2)">${fmtEuro(r.brutto)}</span>
  </div>`;
}).join('')}
<div style="text-align:right;margin-top:.4rem;font-size:.78rem;font-weight:600;color:var(--amber2)">
  Gesamt ausstehend: ${fmtEuro(ausstehend)}
</div>` : ''}
`;
}
