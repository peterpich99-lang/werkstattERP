import { S } from '../auth.js';
import { fmtEuro, calcPos, nextNummer, kBy, aBy, fmtDate } from '../helpers.js';
import { openPDF } from '../pdf.js';

function kOpts(sel) {
  return S.kunden.map(k =>
    `<option value="${k.id}" ${sel===k.id?'selected':''}>${k.name}</option>`
  ).join('');
}
function typOpts(sel) {
  return S.typen.map(t =>
    `<option value="${t.id}" ${sel===t.id?'selected':''}>${t.name}</option>`
  ).join('');
}

function posRows(pos) {
  return (pos || []).map((p, i) => `
  <div class="pos-row" data-i="${i}">
    <input class="pos-bez" placeholder="Bezeichnung" value="${p.bezeichnung||''}" oninput="updPos(${i},'bezeichnung',this.value)">
    <div style="display:flex;gap:.3rem;margin-top:.25rem">
      <input class="pos-menge" type="number" placeholder="Menge" value="${p.menge||1}" style="width:70px"
             oninput="updPos(${i},'menge',+this.value)">
      <input class="pos-preis" type="number" placeholder="Preis" value="${p.einzelpreis||''}" style="flex:1"
             oninput="updPos(${i},'einzelpreis',+this.value)">
      <button class="btn-sm" style="color:var(--red2);border-color:var(--red2);flex-shrink:0" onclick="delPos(${i})">✕</button>
    </div>
  </div>`).join('');
}

function dokFooter(pos) {
  const { netto, ust, brutto } = calcPos(pos);
  const ku = S.firma?.kleinunternehmer;
  return `
  <div style="margin-top:.5rem;padding:.6rem .7rem;background:var(--s1);border:1px solid var(--border2);border-radius:8px;font-size:.78rem">
    <div style="display:flex;justify-content:space-between;color:var(--text2)"><span>Netto</span><span>${fmtEuro(netto)}</span></div>
    ${!ku ? `<div style="display:flex;justify-content:space-between;color:var(--text2)"><span>USt. ${S.firma?.ust_satz||20}%</span><span>${fmtEuro(ust)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:600;color:var(--gold3);margin-top:.25rem"><span>Brutto</span><span>${fmtEuro(brutto)}</span></div>
  </div>`;
}

export function mNeuAuftrag(auftragId) {
  const a = auftragId ? S.auftraege.find(x => x.id === auftragId) : null;
  const title = a ? 'Auftrag bearbeiten' : 'Neuer Auftrag';
  const id = a?.id || '';
  return `
<div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div><label class="form-label">Titel *</label>
    <input id="m-titel" value="${a?.titel||''}" placeholder="z.B. Fenster reparieren"></div>
  <div><label class="form-label">Kunde</label>
    <select id="m-kunde"><option value="">— Kein Kunde —</option>${kOpts(a?.kunde_id)}</select></div>
  <div><label class="form-label">Auftragstyp</label>
    <select id="m-typ"><option value="">— Kein Typ —</option>${typOpts(a?.auftragstyp_id)}</select></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Priorität</label>
      <select id="m-prio">
        ${['niedrig','normal','hoch','dringend'].map(p=>`<option value="${p}" ${(a?.prioritaet||'normal')===p?'selected':''}>${{niedrig:'Niedrig',normal:'Normal',hoch:'Hoch',dringend:'Dringend'}[p]}</option>`).join('')}
      </select></div>
    <div><label class="form-label">Fällig am</label>
      <input type="date" id="m-faellig" value="${a?.faellig_am?.slice(0,10)||''}"></div>
  </div>
  <div><label class="form-label">Stundensatz (€)</label>
    <input type="number" id="m-stunde" value="${a?.stundensatz||S.profil?.stundensatz||''}" placeholder="${S.profil?.stundensatz||80}"></div>
  <div><label class="form-label">Notizen</label>
    <textarea id="m-notizen" rows="3">${a?.notizen||''}</textarea></div>
  <input type="hidden" id="m-id" value="${id}">
  <button class="btn" style="margin-top:.3rem" onclick="saveAuftrag()">Speichern</button>
  ${id ? `<button class="btn-danger" onclick="delAuftrag('${id}')">Löschen</button>` : ''}
</div>`;
}

export function mNeuKunde(kundeId) {
  const k = kundeId ? S.kunden.find(x => x.id === kundeId) : null;
  const title = k ? 'Kunde bearbeiten' : 'Neuer Kunde';
  return `
<div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div><label class="form-label">Name *</label>
    <input id="mk-name" value="${k?.name||''}" placeholder="Max Mustermann"></div>
  <div><label class="form-label">E-Mail</label>
    <input type="email" id="mk-email" value="${k?.email||''}" placeholder="max@..."></div>
  <div><label class="form-label">Telefon</label>
    <input type="tel" id="mk-tel" value="${k?.telefon||''}" placeholder="+43..."></div>
  <div><label class="form-label">Adresse</label>
    <input id="mk-adresse" value="${k?.adresse||''}" placeholder="Straße, PLZ Ort"></div>
  <div><label class="form-label">Notiz</label>
    <textarea id="mk-notiz" rows="2">${k?.notiz||''}</textarea></div>
  <input type="hidden" id="mk-id" value="${k?.id||''}">
  <button class="btn" style="margin-top:.3rem" onclick="saveKunde()">Speichern</button>
  ${k?.id ? `<button class="btn-danger" onclick="delKunde('${k.id}')">Löschen</button>` : ''}
</div>`;
}

export function mNeuAng(auftragId) {
  const a = auftragId ? aBy(auftragId) : null;
  const nr = nextNummer('angebot');
  const pos = [{ bezeichnung: '', menge: 1, einzelpreis: 0 }];
  window._mPos = pos;
  return `
<div class="modal-header"><span class="modal-title">Neues Angebot</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Nummer</label>
      <input id="ma-nr" value="${nr}"></div>
    <div><label class="form-label">Datum</label>
      <input type="date" id="ma-datum" value="${new Date().toISOString().slice(0,10)}"></div>
  </div>
  <div><label class="form-label">Titel *</label>
    <input id="ma-titel" value="${a?.titel||''}" placeholder="Angebotsbeschreibung"></div>
  <div><label class="form-label">Kunde</label>
    <select id="ma-kunde"><option value="">— Kein Kunde —</option>${kOpts(a?.kunde_id)}</select></div>
  <div><label class="form-label">Gültig bis</label>
    <input type="date" id="ma-gueltig" value="${new Date(Date.now()+30*86400000).toISOString().slice(0,10)}"></div>
  <div class="sec-label" style="margin:0">Positionen</div>
  <div id="ma-pos-wrap">${posRows(pos)}</div>
  <button class="btn-ghost" style="font-size:.75rem" onclick="addPos('ang')">+ Position</button>
  <div id="ma-footer">${dokFooter(pos)}</div>
  <div><label class="form-label">Notiz</label>
    <textarea id="ma-notiz" rows="2">${S.firma?.rechnung_notiz||''}</textarea></div>
  <input type="hidden" id="ma-aufid" value="${auftragId||''}">
  <button class="btn" style="margin-top:.3rem" onclick="saveAngebot()">Speichern</button>
</div>`;
}

export function mViewAng(angId) {
  const d = S.angebote.find(x => x.id === angId);
  if (!d) return '<div class="empty">Nicht gefunden</div>';
  const kunde = kBy(d.kunde_id);
  const pos = d.positionen || [];
  const { netto, ust, brutto } = calcPos(pos);
  const ku = S.firma?.kleinunternehmer;
  return `
<div class="modal-header"><span class="modal-title">Angebot ${d.nummer||''}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="padding:.1rem 0">
  <div style="font-family:'DM Serif Display',serif;font-size:1.1rem;margin-bottom:.3rem">${d.titel||'—'}</div>
  <div style="font-size:.72rem;color:var(--text2);margin-bottom:.7rem">
    ${kunde?.name||'—'} · ${fmtDate(d.erstellt_am)}
    ${d.gueltig_bis ? ` · Gültig bis ${fmtDate(d.gueltig_bis)}` : ''}
  </div>

  ${pos.length > 0 ? `
  <div class="sec-label">Positionen</div>
  ${pos.map(p => `
  <div class="tbl-row">
    <span style="flex:1">${p.bezeichnung||'—'}</span>
    <span style="color:var(--text2);font-size:.72rem">${p.menge}×${fmtEuro(p.einzelpreis)}</span>
    <span style="color:var(--gold2);font-weight:600">${fmtEuro((p.menge||0)*(p.einzelpreis||0))}</span>
  </div>`).join('')}
  <div style="margin-top:.5rem;padding:.6rem .7rem;background:var(--s1);border:1px solid var(--border2);border-radius:8px;font-size:.78rem">
    <div style="display:flex;justify-content:space-between;color:var(--text2)"><span>Netto</span><span>${fmtEuro(netto)}</span></div>
    ${!ku ? `<div style="display:flex;justify-content:space-between;color:var(--text2)"><span>USt. ${S.firma?.ust_satz||20}%</span><span>${fmtEuro(ust)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:600;color:var(--gold3);margin-top:.25rem"><span>Brutto</span><span>${fmtEuro(brutto)}</span></div>
  </div>` : ''}

  ${d.notiz ? `<div class="sec-label" style="margin-top:.7rem">Notiz</div>
  <div style="font-size:.78rem;color:var(--text2)">${d.notiz}</div>` : ''}

  <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.85rem">
    ${['entwurf','versendet','angenommen','abgelehnt'].map(s => `
    <button class="btn-sm" onclick="changeDocStatus('ang','${d.id}','${s}')"
            style="${d.status===s?'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600':''}">
      ${{entwurf:'Entwurf',versendet:'Versendet',angenommen:'Angenommen',abgelehnt:'Abgelehnt'}[s]}
    </button>`).join('')}
  </div>
  <div style="display:flex;gap:.4rem;margin-top:.6rem;flex-wrap:wrap">
    <button class="btn" style="font-size:.78rem" onclick="openPDF('ang','${d.id}')">PDF</button>
    <button class="btn-ghost" style="flex:1;font-size:.78rem" onclick="angToRe('${d.id}')">→ Rechnung</button>
    <button class="btn-danger" style="font-size:.75rem" onclick="delAngebot('${d.id}')">Löschen</button>
  </div>
</div>`;
}

export function mNeuRe(auftragId) {
  const a = auftragId ? aBy(auftragId) : null;
  const nr = nextNummer('rechnung');
  const pos = a?.id ? [{ bezeichnung: a.titel || '', menge: 1, einzelpreis: 0 }] : [{ bezeichnung: '', menge: 1, einzelpreis: 0 }];
  window._mPos = pos;
  const faellig = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  return `
<div class="modal-header"><span class="modal-title">Neue Rechnung</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Nummer</label>
      <input id="mr-nr" value="${nr}"></div>
    <div><label class="form-label">Datum</label>
      <input type="date" id="mr-datum" value="${new Date().toISOString().slice(0,10)}"></div>
  </div>
  <div><label class="form-label">Titel *</label>
    <input id="mr-titel" value="${a?.titel||''}" placeholder="Rechnungsbeschreibung"></div>
  <div><label class="form-label">Kunde</label>
    <select id="mr-kunde"><option value="">— Kein Kunde —</option>${kOpts(a?.kunde_id)}</select></div>
  <div><label class="form-label">Fällig am</label>
    <input type="date" id="mr-faellig" value="${faellig}"></div>
  <div class="sec-label" style="margin:0">Positionen</div>
  <div id="mr-pos-wrap">${posRows(pos)}</div>
  <button class="btn-ghost" style="font-size:.75rem" onclick="addPos('re')">+ Position</button>
  <div id="mr-footer">${dokFooter(pos)}</div>
  <div><label class="form-label">Notiz</label>
    <textarea id="mr-notiz" rows="2">${S.firma?.rechnung_notiz||''}</textarea></div>
  <input type="hidden" id="mr-aufid" value="${auftragId||''}">
  <button class="btn" style="margin-top:.3rem" onclick="saveRechnung()">Speichern</button>
</div>`;
}

export function mViewRe(reId) {
  const d = S.rechnungen.find(x => x.id === reId);
  if (!d) return '<div class="empty">Nicht gefunden</div>';
  const kunde = kBy(d.kunde_id);
  const pos = d.positionen || [];
  const { netto, ust, brutto } = calcPos(pos);
  const ku = S.firma?.kleinunternehmer;
  return `
<div class="modal-header"><span class="modal-title">Rechnung ${d.nummer||''}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="padding:.1rem 0">
  <div style="font-family:'DM Serif Display',serif;font-size:1.1rem;margin-bottom:.3rem">${d.titel||'—'}</div>
  <div style="font-size:.72rem;color:var(--text2);margin-bottom:.7rem">
    ${kunde?.name||'—'} · ${fmtDate(d.erstellt_am)}
    ${d.faellig_am ? ` · Fällig ${fmtDate(d.faellig_am)}` : ''}
  </div>

  ${pos.length > 0 ? `
  <div class="sec-label">Positionen</div>
  ${pos.map(p => `
  <div class="tbl-row">
    <span style="flex:1">${p.bezeichnung||'—'}</span>
    <span style="color:var(--text2);font-size:.72rem">${p.menge}×${fmtEuro(p.einzelpreis)}</span>
    <span style="color:var(--gold2);font-weight:600">${fmtEuro((p.menge||0)*(p.einzelpreis||0))}</span>
  </div>`).join('')}
  <div style="margin-top:.5rem;padding:.6rem .7rem;background:var(--s1);border:1px solid var(--border2);border-radius:8px;font-size:.78rem">
    <div style="display:flex;justify-content:space-between;color:var(--text2)"><span>Netto</span><span>${fmtEuro(netto)}</span></div>
    ${!ku ? `<div style="display:flex;justify-content:space-between;color:var(--text2)"><span>USt. ${S.firma?.ust_satz||20}%</span><span>${fmtEuro(ust)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:600;color:var(--gold3);margin-top:.25rem"><span>Brutto</span><span>${fmtEuro(brutto)}</span></div>
  </div>` : ''}

  ${d.notiz ? `<div class="sec-label" style="margin-top:.7rem">Notiz</div>
  <div style="font-size:.78rem;color:var(--text2)">${d.notiz}</div>` : ''}

  <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.85rem">
    ${['entwurf','gesendet','bezahlt','storniert'].map(s => `
    <button class="btn-sm" onclick="changeDocStatus('re','${d.id}','${s}')"
            style="${d.status===s?'background:var(--gold);color:#0a0a0c;border-color:var(--gold);font-weight:600':''}">
      ${{entwurf:'Entwurf',gesendet:'Gesendet',bezahlt:'Bezahlt',storniert:'Storniert'}[s]}
    </button>`).join('')}
  </div>
  <div style="display:flex;gap:.4rem;margin-top:.6rem">
    <button class="btn" style="font-size:.78rem" onclick="openPDF('re','${d.id}')">PDF</button>
    <button class="btn-danger" style="font-size:.75rem" onclick="delRechnung('${d.id}')">Löschen</button>
  </div>
</div>`;
}

export function mNeuInventar(invId) {
  const i = invId ? S.inventar.find(x => x.id === invId) : null;
  const title = i ? 'Artikel bearbeiten' : 'Neuer Artikel';
  return `
<div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div><label class="form-label">Name *</label>
    <input id="mi-name" value="${i?.name||''}" placeholder="Artikelname"></div>
  <div><label class="form-label">Kategorie</label>
    <input id="mi-kat" value="${i?.kategorie||''}" placeholder="z.B. Schrauben"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Bestand</label>
      <input type="number" id="mi-bestand" value="${i?.bestand??''}" placeholder="0"></div>
    <div><label class="form-label">Einheit</label>
      <input id="mi-einheit" value="${i?.einheit||'Stk'}" placeholder="Stk"></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Mindestbestand</label>
      <input type="number" id="mi-min" value="${i?.mindestbestand??''}" placeholder="0"></div>
    <div><label class="form-label">Einkaufspreis (€)</label>
      <input type="number" id="mi-preis" value="${i?.einkaufspreis??''}" placeholder="0"></div>
  </div>
  <div><label class="form-label">Lieferant</label>
    <input id="mi-lief" value="${i?.lieferant||''}" placeholder="Lieferantenname"></div>
  <input type="hidden" id="mi-id" value="${i?.id||''}">
  <button class="btn" style="margin-top:.3rem" onclick="saveInventar()">Speichern</button>
  ${i?.id ? `<button class="btn-danger" onclick="delInventar('${i.id}')">Löschen</button>` : ''}
</div>`;
}

export function mNeuTyp(typId) {
  const t = typId ? S.typen.find(x => x.id === typId) : null;
  const colors = ['#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
  return `
<div class="modal-header"><span class="modal-title">${t ? 'Typ bearbeiten' : 'Neuer Typ'}</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div><label class="form-label">Name *</label>
    <input id="mt-name" value="${t?.name||''}" placeholder="z.B. Fenster"></div>
  <div>
    <label class="form-label">Farbe</label>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.3rem">
      ${colors.map(c => `
      <div onclick="document.getElementById('mt-farbe').value='${c}';document.querySelectorAll('.color-dot').forEach(d=>d.style.outline='none');this.querySelector('.color-dot').style.outline='2px solid #fff'"
           style="cursor:pointer">
        <div class="color-dot" style="width:24px;height:24px;border-radius:50%;background:${c};${(t?.farbe||colors[0])===c?'outline:2px solid #fff;outline-offset:2px':''}"></div>
      </div>`).join('')}
    </div>
    <input type="hidden" id="mt-farbe" value="${t?.farbe||colors[0]}">
  </div>
  <input type="hidden" id="mt-id" value="${t?.id||''}">
  <button class="btn" style="margin-top:.3rem" onclick="saveTyp()">Speichern</button>
  ${t?.id ? `<button class="btn-danger" onclick="delTyp('${t.id}')">Löschen</button>` : ''}
</div>`;
}

export function mEinladen() {
  return `
<div class="modal-header"><span class="modal-title">Nutzer einladen</span><button class="modal-close" onclick="oClose()">✕</button></div>
<div style="display:grid;gap:.55rem;padding:.1rem 0">
  <div><label class="form-label">E-Mail *</label>
    <input type="email" id="ei-email" placeholder="kollege@..."></div>
  <div><label class="form-label">Rolle</label>
    <select id="ei-rolle">
      <option value="mitarbeiter">Mitarbeiter</option>
      <option value="leserecht">Leserecht</option>
      <option value="admin">Admin</option>
    </select></div>
  <button class="btn" style="margin-top:.3rem" onclick="einladen()">Einladen</button>
  <div style="font-size:.7rem;color:var(--text3)">Der Nutzer erhält eine E-Mail mit einem Einladungslink.</div>
</div>`;
}
