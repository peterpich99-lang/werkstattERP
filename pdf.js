import { S } from './auth.js';
import { fmtDate, fmtEuro } from './helpers.js';

function firma() { return S.firma || {}; }

function head(typ, doc) {
  const f = firma();
  const isRe = typ === 're';
  return `
  <div class="doc-header">
    <div class="firma-block">
      <div class="firma-name">${f.name || 'Meine Werkstatt'}</div>
      ${f.adresse ? `<div>${f.adresse}</div>` : ''}
      ${f.telefon ? `<div>Tel: ${f.telefon}</div>` : ''}
      ${f.email   ? `<div>${f.email}</div>`         : ''}
      ${f.uid_nummer ? `<div>UID: ${f.uid_nummer}</div>` : ''}
    </div>
    <div class="doc-type-block">
      <div class="doc-type">${isRe ? 'RECHNUNG' : 'ANGEBOT'}</div>
      <div class="doc-nr">${doc.nummer || '—'}</div>
      <div class="doc-date">Datum: ${fmtDate(doc.erstellt_am)}</div>
      ${isRe && doc.faellig_am ? `<div class="doc-faellig">Fällig: ${fmtDate(doc.faellig_am)}</div>` : ''}
      ${!isRe && doc.gueltig_bis ? `<div>Gültig bis: ${fmtDate(doc.gueltig_bis)}</div>` : ''}
    </div>
  </div>`;
}

function kundeBlock(kunde) {
  if (!kunde) return '';
  return `
  <div class="kunde-block">
    <div class="kunde-label">Rechnungsempfänger</div>
    <div class="kunde-name">${kunde.name}</div>
    ${kunde.adresse ? `<div>${kunde.adresse}</div>` : ''}
    ${kunde.email   ? `<div>${kunde.email}</div>`   : ''}
    ${kunde.telefon ? `<div>${kunde.telefon}</div>` : ''}
  </div>`;
}

function posTable(pos, ust_satz, kleinunternehmer) {
  const rows = (pos || []).map(p => {
    const gesamt = (p.menge || 0) * (p.einzelpreis || 0);
    return `
    <tr>
      <td class="pos-bez">${p.bezeichnung || '—'}</td>
      <td class="pos-num">${p.menge}</td>
      <td class="pos-num">${fmtEuro(p.einzelpreis)}</td>
      <td class="pos-num">${fmtEuro(gesamt)}</td>
    </tr>`;
  }).join('');

  const netto  = (pos || []).reduce((s, p) => s + (p.menge||0)*(p.einzelpreis||0), 0);
  const ust    = kleinunternehmer ? 0 : netto * (ust_satz || 20) / 100;
  const brutto = netto + ust;

  return `
  <table class="pos-table">
    <thead>
      <tr>
        <th class="pos-bez">Beschreibung</th>
        <th class="pos-num">Menge</th>
        <th class="pos-num">Einzelpreis</th>
        <th class="pos-num">Gesamt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Netto</span><span>${fmtEuro(netto)}</span></div>
    ${!kleinunternehmer ? `<div class="total-row"><span>USt. ${ust_satz || 20}%</span><span>${fmtEuro(ust)}</span></div>` : ''}
    <div class="total-row total-brutto"><span>Gesamtbetrag</span><span>${fmtEuro(brutto)}</span></div>
    ${kleinunternehmer ? '<div class="ku-hinweis">Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet.</div>' : ''}
  </div>`;
}

function footer(doc) {
  const f = firma();
  const parts = [];
  if (f.iban) parts.push(`IBAN: ${f.iban}`);
  if (doc.notiz) parts.push(doc.notiz);
  if (!parts.length && !f.iban) return '';
  return `
  <div class="doc-footer">
    ${f.iban ? `<div>Bankverbindung: ${f.iban}</div>` : ''}
    ${doc.notiz ? `<div style="margin-top:.5rem">${doc.notiz}</div>` : ''}
  </div>`;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #fff;
    padding: 2cm;
    max-width: 21cm;
    margin: 0 auto;
  }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #1a1a1a;
  }
  .firma-name { font-size: 1.1rem; font-weight: 700; margin-bottom: .35rem; }
  .firma-block { color: #333; line-height: 1.6; }
  .doc-type-block { text-align: right; }
  .doc-type { font-size: 1.5rem; font-weight: 800; letter-spacing: 2px; color: #1a1a1a; }
  .doc-nr { font-size: .95rem; color: #555; margin-top: .2rem; }
  .doc-date { color: #555; margin-top: .2rem; }
  .doc-faellig { color: #c0392b; font-weight: 600; margin-top: .2rem; }

  .kunde-block {
    margin-bottom: 2rem;
    padding: 1rem 1.2rem;
    background: #f7f7f7;
    border-left: 3px solid #1a1a1a;
    border-radius: 2px;
  }
  .kunde-label { font-size: .7rem; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: .3rem; }
  .kunde-name { font-weight: 700; font-size: 1rem; margin-bottom: .2rem; }
  .kunde-block div { line-height: 1.5; color: #333; }

  .doc-titel {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1.2rem;
    color: #1a1a1a;
  }

  .pos-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .pos-table thead th {
    background: #1a1a1a;
    color: #fff;
    padding: .5rem .7rem;
    font-size: .75rem;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .pos-table tbody tr { border-bottom: 1px solid #eee; }
  .pos-table tbody tr:last-child { border-bottom: none; }
  .pos-table td { padding: .55rem .7rem; vertical-align: top; }
  .pos-bez { text-align: left; }
  .pos-num { text-align: right; white-space: nowrap; }

  .totals {
    margin-left: auto;
    width: 280px;
    border-top: 2px solid #1a1a1a;
    padding-top: .6rem;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: .25rem 0;
    color: #333;
  }
  .total-brutto {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1a1a1a;
    border-top: 1px solid #ccc;
    margin-top: .3rem;
    padding-top: .4rem;
  }
  .ku-hinweis {
    font-size: .72rem;
    color: #666;
    margin-top: .6rem;
    font-style: italic;
  }

  .doc-footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
    color: #666;
    font-size: .8rem;
    line-height: 1.6;
  }

  @media print {
    body { padding: 0; }
    @page { margin: 1.5cm; }
  }
`;

function buildHTML(typ, doc, kunde) {
  const f = firma();
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>${typ === 're' ? 'Rechnung' : 'Angebot'} ${doc.nummer || ''}</title>
<style>${CSS}</style>
</head>
<body>
${head(typ, doc)}
${kundeBlock(kunde)}
<div class="doc-titel">${doc.titel || ''}</div>
${posTable(doc.positionen, f.ust_satz, f.kleinunternehmer)}
${footer(doc)}
</body>
</html>`;
}

export function openPDF(typ, docId) {
  const arr  = typ === 're' ? S.rechnungen : S.angebote;
  const doc  = arr.find(x => x.id === docId);
  if (!doc) return;

  const kunde = S.kunden.find(k => k.id === doc.kunde_id);
  const html  = buildHTML(typ, doc, kunde);
  const blob  = new Blob([html], { type: 'text/html' });
  const url   = URL.createObjectURL(blob);

  // iOS: in neuem Tab öffnen → Share → "Als PDF sichern"
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup geblockt → direkt navigieren
    location.href = url;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
