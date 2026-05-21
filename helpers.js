import { S } from './auth.js';

export const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtEuro = n => `€ ${(n || 0).toFixed(2).replace('.', ',')}`;

export const kBy = id => S.kunden.find(k => k.id === id);
export const tBy = id => S.typen.find(t => t.id === id);
export const aBy = id => S.auftraege.find(a => a.id === id);

export const sbadge = s => {
  const m = {
    offen: 'b-amb Offen', in_arbeit: 'b-gold In Arbeit', abgeschlossen: 'b-grn Fertig',
    storniert: 'b-red Storniert', entwurf: 'b-gray Entwurf', versendet: 'b-blu Versendet',
    angenommen: 'b-grn Angenommen', abgelehnt: 'b-red Abgelehnt',
    gesendet: 'b-blu Gesendet', bezahlt: 'b-grn Bezahlt',
  };
  const [cls, ...r] = (m[s] || 'b-gray —').split(' ');
  return `<span class="badge ${cls}">${r.join(' ')}</span>`;
};

export const tbadge = tid => {
  const t = tBy(tid);
  if (!t) return '';
  return `<span class="badge" style="background:${t.farbe}22;color:${t.farbe};border:1px solid ${t.farbe}44">${t.name}</span>`;
};

export const prioBadge = p => {
  const m = { niedrig: 'b-gray Niedrig', normal: '', hoch: 'b-amb Hoch', dringend: 'b-red Dringend' };
  const v = m[p || 'normal'];
  if (!v) return '';
  const [cls, ...r] = v.split(' ');
  return `<span class="badge ${cls}">${r.join(' ')}</span>`;
};

export const calcPos = pos => {
  const netto = (pos || []).reduce((s, p) => s + (p.menge || 0) * (p.einzelpreis || 0), 0);
  const ust = S.firma?.kleinunternehmer ? 0 : netto * (S.firma?.ust_satz || 20) / 100;
  return { netto, ust, brutto: netto + ust };
};

export const nextNummer = typ => {
  const yr = new Date().getFullYear();
  const docs = typ === 'rechnung' ? S.rechnungen : S.angebote;
  const prefix = typ === 'rechnung' ? 'RE' : 'AN';
  const nums = docs.map(d => parseInt((d.nummer || '').split('-').pop() || '0'));
  const next = (Math.max(0, ...nums) + 1).toString().padStart(4, '0');
  return `${prefix}-${yr}-${next}`;
};

export const fmt = ms => {
  if (!ms || ms < 0) return '00:00:00';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
};

export const fmtH = ms => `${((ms || 0) / 3600000).toFixed(1)} Std`;

function pad(n) { return String(n).padStart(2, '0'); }
