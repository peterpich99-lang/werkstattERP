import { S } from './auth.js';
import { fmtDate, fmtEuro } from './helpers.js';

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13.5px;
  color: #1a1a1a;
  background: #fff;
  line-height: 1.5;
}

.page {
  max-width: 794px;
  margin: 0 auto;
  padding: 0;
}

/* ── Header Bar ── */
.header {
  background: #1a1a1a;
  color: #fff;
  padding: 2.2rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.firma-name {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -.3px;
  margin-bottom: .2rem;
}
.firma-details {
  font-size: .8rem;
  color: rgba(255,255,255,.6);
  line-height: 1.7;
}
.doc-info {
  text-align: right;
}
.doc-type {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255,255,255,.5);
  margin-bottom: .3rem;
}
.doc-nummer {
  font-size: 1.6rem;
  font-weight: 300;
  letter-spacing: -1px;
  color: #fff;
  line-height: 1;
  margin-bottom: .5rem;
}
.doc-meta {
  font-size: .78rem;
  color: rgba(255,255,255,.6);
  line-height: 1.8;
}
.doc-meta .faellig {
  color: #ff9a9a;
  font-weight: 600;
}

/* ── Body ── */
.body {
  padding: 2rem 2.5rem;
}

/* ── Empfänger ── */
.empfaenger-block {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e8e8e8;
}
.empfaenger-label {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: .4rem;
}
.empfaenger-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: .15rem;
}
.empfaenger-details {
  font-size: .82rem;
  color: #555;
  line-height: 1.6;
}
.doc-titel-block {
  text-align: right;
}
.doc-titel {
  font-size: .92rem;
  font-weight: 600;
  color: #1a1a1a;
  max-width: 220px;
}

/* ── Tabelle ── */
.pos-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;
}
.pos-table thead tr {
  border-bottom: 2px solid #1a1a1a;
}
.pos-table thead th {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #999;
  padding: .5rem .4rem;
}
.pos-table thead th:first-child { padding-left: 0; text-align: left; }
.pos-table thead th:not(:first-child) { text-align: right; }

.pos-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}
.pos-table tbody tr:last-child { border-bottom: none; }
.pos-table tbody td {
  padding: .75rem .4rem;
  font-size: .88rem;
}
.pos-table tbody td:first-child { padding-left: 0; }
.pos-table tbody td:not(:first-child) { text-align: right; white-space: nowrap; }
.pos-bez { color: #1a1a1a; font-weight: 500; }
.pos-menge { color: #666; }
.pos-ep { color: #666; }
.pos-sum { font-weight: 600; color: #1a1a1a; }

/* ── Summen ── */
.summen-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 2px solid #1a1a1a;
}
.summen {
  width: 260px;
}
.summen-row {
  display: flex;
  justify-content: space-between;
  padding: .3rem 0;
  font-size: .88rem;
  color: #555;
}
.summen-row.brutto {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a1a;
  border-top: 1px solid #e0e0e0;
  margin-top: .4rem;
  padding-top: .6rem;
}
.ku-hinweis {
  font-size: .72rem;
  color: #999;
  margin-top: .6rem;
  font-style: italic;
}

/* ── Footer ── */
.footer {
  margin: 2.5rem 2.5rem 0;
  padding: 1.2rem 0;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.footer-section {
  font-size: .78rem;
  color: #888;
  line-height: 1.8;
}
.footer-label {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #bbb;
  margin-bottom: .2rem;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 100%; }
  @page { margin: 0; }
}
`;

function buildHTML(typ, doc, kunde) {
  const f      = S.firma || {};
  const isRe   = typ === 're';
  const ku     = f.kleinunternehmer;
  const pos    = doc.positionen || [];
  const netto  = pos.reduce((s, p) => s + (p.menge||0)*(p.einzelpreis||0), 0);
  const ust    = ku ? 0 : netto * (f.ust_satz || 20) / 100;
  const brutto = netto + ust;

  const firmaLines = [f.adresse, f.telefon, f.email].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${isRe ? 'Rechnung' : 'Angebot'} ${doc.nummer || ''}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="firma-name">${f.name || 'Meine Werkstatt'}</div>
      <div class="firma-details">${firmaLines.join(' · ') || ''}</div>
    </div>
    <div class="doc-info">
      <div class="doc-type">${isRe ? 'Rechnung' : 'Angebot'}</div>
      <div class="doc-nummer">${doc.nummer || '—'}</div>
      <div class="doc-meta">
        <div>${fmtDate(doc.erstellt_am)}</div>
        ${isRe && doc.faellig_am ? `<div class="faellig">Fällig ${fmtDate(doc.faellig_am)}</div>` : ''}
        ${!isRe && doc.gueltig_bis ? `<div>Gültig bis ${fmtDate(doc.gueltig_bis)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="body">

    <div class="empfaenger-block">
      <div>
        <div class="empfaenger-label">An</div>
        ${kunde ? `
        <div class="empfaenger-name">${kunde.name}</div>
        <div class="empfaenger-details">
          ${[kunde.adresse, kunde.email, kunde.telefon].filter(Boolean).join('<br>')}
        </div>` : '<div class="empfaenger-details">—</div>'}
      </div>
      ${doc.titel ? `<div class="doc-titel-block"><div class="doc-titel">${doc.titel}</div></div>` : ''}
    </div>

    <table class="pos-table">
      <thead>
        <tr>
          <th>Beschreibung</th>
          <th>Menge</th>
          <th>Einzelpreis</th>
          <th>Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${pos.map(p => `
        <tr>
          <td class="pos-bez">${p.bezeichnung || '—'}</td>
          <td class="pos-menge">${p.menge || 1}</td>
          <td class="pos-ep">${fmtEuro(p.einzelpreis)}</td>
          <td class="pos-sum">${fmtEuro((p.menge||0)*(p.einzelpreis||0))}</td>
        </tr>`).join('')}
        ${pos.length === 0 ? '<tr><td colspan="4" style="color:#bbb;padding:.75rem 0">Keine Positionen</td></tr>' : ''}
      </tbody>
    </table>

    <div class="summen-wrap">
      <div class="summen">
        <div class="summen-row"><span>Nettobetrag</span><span>${fmtEuro(netto)}</span></div>
        ${!ku ? `<div class="summen-row"><span>USt. ${f.ust_satz || 20} %</span><span>${fmtEuro(ust)}</span></div>` : ''}
        <div class="summen-row brutto"><span>Gesamtbetrag</span><span>${fmtEuro(brutto)}</span></div>
        ${ku ? '<div class="ku-hinweis">Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet.</div>' : ''}
      </div>
    </div>

  </div>

  ${(f.iban || doc.notiz || f.uid_nummer) ? `
  <div class="footer">
    ${f.iban ? `<div class="footer-section"><div class="footer-label">Bankverbindung</div><div>${f.iban}</div></div>` : ''}
    ${f.uid_nummer ? `<div class="footer-section"><div class="footer-label">UID</div><div>${f.uid_nummer}</div></div>` : ''}
    ${doc.notiz ? `<div class="footer-section" style="text-align:right"><div>${doc.notiz}</div></div>` : ''}
  </div>` : ''}

</div>
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
  const win   = window.open(url, '_blank');
  if (!win) location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
