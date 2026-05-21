import { S, isDemoMode } from '../auth.js';
import { sbq, DB, isLocalMode } from '../db.js';
import { fmtDate, fmtEuro, fmtH, tbadge, sbadge, prioBadge, kBy, fmt } from '../helpers.js';

export default async function vDetail() {
  const a = S.auftraege.find(x => x.id === S.aktId);
  if (!a) return '<div class="empty" style="padding:2rem;text-align:center">Auftrag nicht gefunden</div>';

  const kunde = kBy(a.kunde_id);
  const isActive = S.timer?.auftragId === a.id;

  // Load Zeiteinträge
  let zeiten = [];
  let material = [];
  try {
    if (isDemoMode) {
      zeiten = [
        { id: 'z1', dauer_ms: 4500000, start_zeit: new Date(Date.now()-86400000).toISOString(), typ: 'global' },
        { id: 'z2', dauer_ms: 2700000, start_zeit: new Date(Date.now()-43200000).toISOString(), typ: 'global' },
      ];
      material = a.id === 'a1' ? [
        { id: 'm1', name: 'PU-Leim Würth', menge: 1, einheit: 'Stk', preis: 12.5, status: 'vorhanden' },
        { id: 'm2', name: 'Fensterkit weiß', menge: 2, einheit: 'Stk', preis: 6.5, status: 'bestellen' },
      ] : [];
    } else {
      const [zr, mr] = await Promise.all([
        sbq('zeiteintraege').select('*').eq('auftrag_id', a.id).order('start_zeit', { ascending: false }),
        sbq('auftrag_material').select('*').eq('auftrag_id', a.id),
      ]);
      zeiten   = zr.data || [];
      material = mr.data || [];
    }
  } catch (e) { console.warn('detail load error', e); }

  const gesamtMs   = zeiten.reduce((s, z) => s + (z.dauer_ms || 0), 0);
  const gesamtMat  = material.reduce((s, m) => s + (m.menge || 0) * (m.preis || 0), 0);
  const lohn       = a.stundensatz ? (gesamtMs / 3600000) * a.stundensatz : 0;

  const statusOpts = ['offen','in_arbeit','abgeschlossen','storniert'];

  return `
<div style="margin-bottom:.85rem">
  <button class="btn-sm" onclick="S.aktId=null;appRender()"
          style="margin-bottom:.65rem;font-size:.75rem;color:var(--text2);border-color:var(--border)">
    ← Aufträge
  </button>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.5rem">
    <div style="flex:1;min-width:0">
      <div style="font-family:'DM Serif Display',serif;font-size:1.15rem;line-height:1.3">${a.titel}</div>
      <div style="font-size:.72rem;color:var(--text2);margin-top:.25rem">
        ${kunde?.name || '—'} · ${fmtDate(a.erstellt_am)}
        ${a.faellig_am ? ` · <span style="color:var(--red2)">Fällig ${fmtDate(a.faellig_am)}</span>` : ''}
      </div>
    </div>
    <button class="btn-sm" onclick="openM('editAuftrag','${a.id}')">Bearbeiten</button>
  </div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
    ${tbadge(a.auftragstyp_id)}${sbadge(a.status)}${prioBadge(a.prioritaet)}
  </div>
</div>

<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.85rem">
  ${statusOpts.map(s => `
    <button class="btn-sm" onclick="changeStatus('${a.id}','${s}')"
            style="${a.status===s?'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600':''}">
      ${{offen:'Offen',in_arbeit:'In Arbeit',abgeschlossen:'Fertig',storniert:'Storniert'}[s]}
    </button>`).join('')}
</div>

<!-- Timer -->
<div class="timer-box" style="margin-bottom:.85rem">
  <div>
    <div style="font-size:.55rem;color:var(--text3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.2rem">
      ${isActive ? 'Läuft gerade' : 'Letzte Sitzung'}
    </div>
    <div class="timer-disp" ${isActive ? 'data-live' : ''}>${isActive ? fmt(S.timer ? Date.now() - S.timer.startEpoch : 0) : fmt(zeiten[0]?.dauer_ms || 0)}</div>
    <div style="font-size:.62rem;color:var(--text3);margin-top:.15rem">
      Gesamt: ${fmtH(gesamtMs)} · ${fmtEuro(lohn)} Lohn
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:.4rem;align-items:flex-end">
    ${isActive
      ? `<button class="btn-sm btn-stop" style="background:#5c1a1a;border-color:var(--red2);color:var(--red2);font-weight:600" onclick="stopTimerAction('${a.id}')">■ Stop</button>`
      : `<button class="btn" onclick="startTimerAction('${a.id}')">▶ Start</button>`}
  </div>
</div>

<div style="display:flex;justify-content:space-between;align-items:center">
  <div class="sec-label" style="margin-bottom:0">Zeiteinträge</div>
  <button class="btn-sm" onclick="openM('neuZeit','${a.id}')" style="font-size:.7rem">+ Eintragen</button>
</div>
${zeiten.length > 0 ? `
<div style="margin-top:.4rem">
${zeiten.slice(0, 8).map(z => `
  <div class="tbl-row">
    <span style="font-size:.72rem;color:var(--text2);min-width:60px">${fmtDate(z.start_zeit)}</span>
    <span style="font-family:'DM Serif Display',serif;font-size:.9rem;color:var(--gold2)">${fmt(z.dauer_ms)}</span>
    <span style="font-size:.72rem;color:var(--text3)">${fmtH(z.dauer_ms)}</span>
    <span style="font-size:.72rem;color:var(--text2)">${fmtEuro((z.dauer_ms/3600000)*(a.stundensatz||0))}</span>
    ${z.typ==='manuell' ? `<button onclick="delZeit('${z.id}','${a.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem;padding:0 .2rem">✕</button>` : ''}
  </div>`).join('')}
</div>
` : '<div style="font-size:.72rem;color:var(--text3);padding:.4rem 0">Noch keine Zeiteinträge</div>'}

<div style="display:flex;justify-content:space-between;align-items:center;margin-top:.85rem">
  <div class="sec-label" style="margin:0">Material</div>
  <button class="btn-sm" onclick="openM('neuMaterial','${a.id}')" style="font-size:.7rem">+ Hinzufügen</button>
</div>
${material.length > 0 ? `
<div style="margin-top:.4rem">
${material.map(m => `
  <div class="tbl-row">
    <span style="flex:1;font-size:.82rem">${m.name}</span>
    <span style="color:var(--text2);font-size:.72rem">${m.menge} ${m.einheit}</span>
    <span style="font-size:.65rem;font-weight:600;${m.status==='bestellen'?'color:var(--amber2)':'color:var(--green2)'}">${m.status==='bestellen'?'Bestellen':'OK'}</span>
    <span style="color:var(--gold2);font-weight:600">${fmtEuro((m.menge||0)*(m.preis||0))}</span>
    <button onclick="delMaterial('${m.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem;padding:0 .2rem">✕</button>
  </div>`).join('')}
<div style="text-align:right;margin-top:.5rem;padding-top:.4rem;border-top:1px solid var(--border);font-size:.78rem;color:var(--text2)">
  Material: ${fmtEuro(gesamtMat)} · Lohn: ${fmtEuro(lohn)} ·
  <strong style="color:var(--gold3)">Gesamt: ${fmtEuro(gesamtMat + lohn)}</strong>
</div>
</div>
` : '<div style="font-size:.72rem;color:var(--text3);padding:.4rem 0">Noch kein Material</div>'}

${a.notizen ? `
<div class="sec-label">Notizen</div>
<div style="font-size:.82rem;color:var(--text2);background:var(--s2);border:1px solid var(--border2);border-radius:8px;padding:.7rem .85rem;line-height:1.5">${a.notizen}</div>
` : ''}

<hr class="divider">
<div style="display:flex;gap:.4rem;flex-wrap:wrap">
  <button class="btn-ghost" onclick="openM('neuAng','${a.id}')" style="font-size:.78rem">+ Angebot</button>
  <button class="btn-ghost" onclick="openM('neuRe','${a.id}')" style="font-size:.78rem">+ Rechnung</button>
  <button class="btn-danger" onclick="delAuftrag('${a.id}')" style="font-size:.75rem;margin-left:auto">Auftrag löschen</button>
</div>
`;
}
