import { S, isDemoMode, load } from './auth.js?v=10';
import { sbq, DB, isLocalMode } from './db.js?v=10';
import { calcPos, nextNummer } from './helpers.js?v=10';

import vDash      from './views/dashboard.js?v=10';
import vAuftraege from './views/auftraege.js?v=10';
import vDetail    from './views/detail.js?v=10';
import vDokumente from './views/dokumente.js?v=10';
import vKunden    from './views/kunden.js?v=10';
import vInventar  from './views/inventar.js?v=10';
import vStats     from './views/stats.js?v=10';
import vNutzer    from './views/nutzer.js?v=10';
import vSettings  from './views/settings.js?v=10';
import {
  mNeuAuftrag, mNeuKunde, mNeuAng, mViewAng,
  mNeuRe, mViewRe, mNeuInventar, mNeuTyp, mEinladen,
  mNeuZeit, mNeuMaterial
} from './views/modals.js?v=10';
import { openPDF } from './pdf.js?v=10';

// ── Nav ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dash',      icon: '⌂',  label: 'Home' },
  { id: 'auftraege', icon: '⚙',  label: 'Aufträge' },
  { id: 'dokumente', icon: '📄', label: 'Dokumente' },
  { id: 'kunden',    icon: '👤', label: 'Kunden' },
  { id: 'mehr',      icon: '⋯',  label: 'Mehr' },
];
const MORE_TABS = ['inventar','stats','nutzer','settings'];

function renderNav() {
  const nav = document.getElementById('app-nav');
  if (!nav) return;
  nav.innerHTML = TABS.map(t => `
    <button class="nav-btn${S.tab === t.id || (t.id==='mehr' && MORE_TABS.includes(S.tab)) ? ' on' : ''}"
            onclick="navTap('${t.id}')">
      <span class="nav-icon">${t.icon}</span>
      <span class="nav-label">${t.label}</span>
    </button>`).join('');
}

// ── Timer ─────────────────────────────────────────────────────────────────────
let _tick = null;

function startTick() {
  if (_tick) return;
  _tick = setInterval(() => {
    if (!S.timer) { stopTick(); return; }
    const el = document.querySelector('[data-live]');
    if (el) {
      const ms = Date.now() - S.timer.startEpoch;
      el.textContent = fmtMs(ms);
    }
    const pill = document.getElementById('t-val');
    if (pill) pill.textContent = fmtMs(Date.now() - S.timer.startEpoch);
  }, 1000);
}

function stopTick() {
  clearInterval(_tick);
  _tick = null;
}

function fmtMs(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  return `${pad(h)}:${pad(m%60)}:${pad(s%60)}`;
}
function pad(n) { return String(n).padStart(2,'0'); }

function updateTimerPill() {
  const pill = document.getElementById('t-pill');
  if (!pill) return;
  if (S.timer) {
    pill.style.display = 'flex';
    const val = document.getElementById('t-val');
    if (val) val.textContent = fmtMs(Date.now() - S.timer.startEpoch);
    startTick();
  } else {
    pill.style.display = 'none';
    stopTick();
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
async function render() {
  const el = document.getElementById('app-content');
  if (!el) return;

  renderNav();
  updateTimerPill();

  let html = '';
  try {
    if (S.aktId && S.tab === 'auftraege') {
      html = await vDetail();
    } else {
      switch (S.tab) {
        case 'dash':      html = vDash();      break;
        case 'auftraege': html = vAuftraege(); break;
        case 'dokumente': html = vDokumente(); break;
        case 'kunden':    html = vKunden();    break;
        case 'inventar':  html = vInventar();  break;
        case 'stats':     html = vStats();     break;
        case 'nutzer':    html = vNutzer();    break;
        case 'settings':  html = vSettings();  break;
        default:          html = vDash();
      }
    }
  } catch (e) {
    console.error('render error', e);
    html = `<div class="empty" style="color:var(--red2)">Fehler beim Laden</div>`;
  }

  el.innerHTML = html;
}

// ── Modal system ──────────────────────────────────────────────────────────────
function openM(type, id) {
  const ov = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!ov || !box) return;

  let html = '';
  switch (type) {
    case 'neuAuftrag':  html = mNeuAuftrag();     break;
    case 'editAuftrag': html = mNeuAuftrag(id);   break;
    case 'neuKunde':    html = mNeuKunde();        break;
    case 'editKunde':   html = mNeuKunde(id);      break;
    case 'neuAng':      html = mNeuAng(id);        break;
    case 'viewAng':     html = mViewAng(id);       break;
    case 'neuRe':       html = mNeuRe(id);         break;
    case 'viewRe':      html = mViewRe(id);        break;
    case 'neuInventar': html = mNeuInventar();     break;
    case 'editInventar':html = mNeuInventar(id);   break;
    case 'neuTyp':      html = mNeuTyp();          break;
    case 'editTyp':     html = mNeuTyp(id);        break;
    case 'einladen':    html = mEinladen();        break;
    case 'neuZeit':     html = mNeuZeit(id);       break;
    case 'neuMaterial': html = mNeuMaterial(id);   break;
    default: return;
  }

  box.innerHTML = html;
  ov.classList.add('open');
  setTimeout(() => box.querySelector('input,textarea,select')?.focus(), 50);
}

function oClose() {
  document.getElementById('modal-overlay')?.classList.remove('open');
  window._mPos = null;
}

// ── Window globals ────────────────────────────────────────────────────────────
window.appRender = render;
window.openM     = openM;
window.oClose    = oClose;
window.openPDF   = openPDF;
window.S         = S;
window.setDoktab  = (t) => { S.doktab  = t; render(); };
window.setFilter  = (f) => { S.filter  = f; render(); };
window.setInvFilter = (f) => { S.invFilter = f; render(); };

window.setTab = (tab) => {
  S.tab = tab;
  S.aktId = null;
  const more = document.getElementById('more-panel');
  if (more) more.classList.remove('open');
  render();
};

window.openA = (id) => {
  S.aktId = id;
  S.tab = 'auftraege';
  render();
};

window.navTap = (tab) => {
  if (tab === 'mehr') {
    document.getElementById('more-panel')?.classList.toggle('open');
    return;
  }
  S.tab = tab;
  S.aktId = null;
  render();
};

window.openMore = () => document.getElementById('more-panel')?.classList.add('open');
window.closeMore = () => document.getElementById('more-panel')?.classList.remove('open');

window.goTimer = () => {
  if (S.timer?.auftragId) window.openA(S.timer.auftragId);
};

// ── Timer actions ─────────────────────────────────────────────────────────────
window.startTimerAction = async (auftragId) => {
  if (S.timer) await stopTimerAction(S.timer.auftragId);
  S.timer = { auftragId, startEpoch: Date.now() };
  updateTimerPill();
  render();
};

window.stopTimerAction = async (auftragId) => {
  if (!S.timer) return;
  const dauer = Date.now() - S.timer.startEpoch;
  S.timer = null;
  stopTick();
  updateTimerPill();

  try {
    if (isDemoMode) {
      // demo: just re-render
    } else {
      const entry = { auftrag_id: auftragId, dauer_ms: dauer, start_zeit: new Date().toISOString(), typ: 'global' };
      if (isLocalMode) {
        const id = 'z' + Date.now();
        DB.insert('zeiteintraege', { id, ...entry });
      } else {
        await sbq('zeiteintraege').insert(entry);
      }
    }
  } catch (e) { console.warn('timer save error', e); }
  render();
};

// ── Status changes ────────────────────────────────────────────────────────────
window.changeStatus = async (id, status) => {
  const a = S.auftraege.find(x => x.id === id);
  if (!a) return;
  a.status = status;
  try {
    if (!isDemoMode) await sbq('auftraege').update({ status }).eq('id', id);
  } catch (e) { console.warn('status update error', e); }
  render();
};

window.changeDocStatus = async (typ, id, status) => {
  const arr = typ === 'ang' ? S.angebote : S.rechnungen;
  const d = arr.find(x => x.id === id);
  if (!d) return;
  d.status = status;
  const table = typ === 'ang' ? 'angebote' : 'rechnungen';
  try {
    if (!isDemoMode) await sbq(table).update({ status }).eq('id', id);
  } catch (e) { console.warn('doc status error', e); }
  oClose();
  render();
};

// ── Auftrag CRUD ──────────────────────────────────────────────────────────────
window.saveAuftrag = async () => {
  const titel = document.getElementById('m-titel')?.value?.trim();
  if (!titel) return alert('Bitte Titel eingeben');

  const id = document.getElementById('m-id')?.value;
  const data = {
    titel,
    kunde_id:      document.getElementById('m-kunde')?.value || null,
    auftragstyp_id:document.getElementById('m-typ')?.value || null,
    prioritaet:    document.getElementById('m-prio')?.value || 'normal',
    faellig_am:    document.getElementById('m-faellig')?.value || null,
    stundensatz:   parseFloat(document.getElementById('m-stunde')?.value) || null,
    notizen:       document.getElementById('m-notizen')?.value || null,
    status: id ? undefined : 'offen',
    erstellt_am: id ? undefined : new Date().toISOString(),
  };
  if (!id) delete data.status; // will be set below
  if (!id) data.status = 'offen';
  if (!id) data.erstellt_am = new Date().toISOString();

  try {
    if (isDemoMode) {
      if (id) {
        const i = S.auftraege.findIndex(x => x.id === id);
        if (i >= 0) Object.assign(S.auftraege[i], data);
      } else {
        S.auftraege.unshift({ id: 'a' + Date.now(), ...data });
      }
    } else if (isLocalMode) {
      if (id) {
        DB.update('auftraege', id, data);
        const i = S.auftraege.findIndex(x => x.id === id);
        if (i >= 0) Object.assign(S.auftraege[i], data);
      } else {
        const newId = 'a' + Date.now();
        DB.insert('auftraege', { id: newId, ...data });
        S.auftraege.unshift({ id: newId, ...data });
      }
    } else {
      if (id) {
        await sbq('auftraege').update(data).eq('id', id);
        const i = S.auftraege.findIndex(x => x.id === id);
        if (i >= 0) Object.assign(S.auftraege[i], data);
      } else {
        const firma_id = S.firma?.id;
        const res = await sbq('auftraege').insert({ ...data, firma_id }).select().single();
        if (res.data) S.auftraege.unshift(res.data);
      }
    }
  } catch (e) { console.warn('saveAuftrag error', e); }

  oClose();
  render();
};

window.delAuftrag = async (id) => {
  if (!confirm('Auftrag löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('auftraege', id);
      else await sbq('auftraege').delete().eq('id', id);
    }
  } catch (e) { console.warn('delAuftrag error', e); }
  S.auftraege = S.auftraege.filter(x => x.id !== id);
  S.aktId = null;
  oClose();
  render();
};

// ── Kunde CRUD ────────────────────────────────────────────────────────────────
window.saveKunde = async () => {
  const name = document.getElementById('mk-name')?.value?.trim();
  if (!name) return alert('Bitte Name eingeben');

  const id = document.getElementById('mk-id')?.value;
  const data = {
    name,
    email:   document.getElementById('mk-email')?.value?.trim() || null,
    telefon: document.getElementById('mk-tel')?.value?.trim() || null,
    adresse: document.getElementById('mk-adresse')?.value?.trim() || null,
    notiz:   document.getElementById('mk-notiz')?.value?.trim() || null,
  };

  try {
    if (isDemoMode) {
      if (id) { const i = S.kunden.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.kunden[i], data); }
      else S.kunden.unshift({ id: 'k'+Date.now(), ...data });
    } else if (isLocalMode) {
      if (id) { DB.update('kunden', id, data); const i=S.kunden.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.kunden[i],data); }
      else { const nid='k'+Date.now(); DB.insert('kunden',{id:nid,...data}); S.kunden.unshift({id:nid,...data}); }
    } else {
      if (id) { await sbq('kunden').update(data).eq('id',id); const i=S.kunden.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.kunden[i],data); }
      else { const firma_id=S.firma?.id; const r=await sbq('kunden').insert({...data,firma_id}).select().single(); if(r.data) S.kunden.unshift(r.data); }
    }
  } catch(e) { console.warn('saveKunde error',e); }

  oClose(); render();
};

window.delKunde = async (id) => {
  if (!confirm('Kunde löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('kunden', id);
      else await sbq('kunden').delete().eq('id', id);
    }
  } catch(e) { console.warn('delKunde error',e); }
  S.kunden = S.kunden.filter(x=>x.id!==id);
  oClose(); render();
};

// ── Positionen (modal helpers) ────────────────────────────────────────────────
window.updPos = (i, field, val) => {
  if (!window._mPos) return;
  window._mPos[i][field] = val;
  const prefix = document.getElementById('ma-pos-wrap') ? 'ma' : 'mr';
  const footer = document.getElementById(`${prefix}-footer`);
  if (footer) footer.innerHTML = dokFooter(window._mPos);
};

window.addPos = (typ) => {
  if (!window._mPos) window._mPos = [];
  window._mPos.push({ bezeichnung: '', menge: 1, einzelpreis: 0 });
  const prefix = typ === 'ang' ? 'ma' : 'mr';
  const wrap = document.getElementById(`${prefix}-pos-wrap`);
  if (wrap) wrap.innerHTML = posRows(window._mPos);
  const footer = document.getElementById(`${prefix}-footer`);
  if (footer) footer.innerHTML = dokFooter(window._mPos);
};

window.delPos = (i) => {
  if (!window._mPos) return;
  window._mPos.splice(i, 1);
  const prefix = document.getElementById('ma-pos-wrap') ? 'ma' : 'mr';
  const wrap = document.getElementById(`${prefix}-pos-wrap`);
  if (wrap) wrap.innerHTML = posRows(window._mPos);
  const footer = document.getElementById(`${prefix}-footer`);
  if (footer) footer.innerHTML = dokFooter(window._mPos);
};

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
    <div style="display:flex;justify-content:space-between;color:var(--text2)"><span>Netto</span><span>€ ${(netto||0).toFixed(2).replace('.',',')}</span></div>
    ${!ku ? `<div style="display:flex;justify-content:space-between;color:var(--text2)"><span>USt. ${S.firma?.ust_satz||20}%</span><span>€ ${(ust||0).toFixed(2).replace('.',',')}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:600;color:var(--gold3);margin-top:.25rem"><span>Brutto</span><span>€ ${(brutto||0).toFixed(2).replace('.',',')}</span></div>
  </div>`;
}

// ── Angebot CRUD ──────────────────────────────────────────────────────────────
window.saveAngebot = async () => {
  const titel = document.getElementById('ma-titel')?.value?.trim();
  if (!titel) return alert('Bitte Titel eingeben');

  const pos = window._mPos || [];
  const { netto, ust, brutto } = calcPos(pos);
  const data = {
    nummer:     document.getElementById('ma-nr')?.value || nextNummer('angebot'),
    titel,
    kunde_id:   document.getElementById('ma-kunde')?.value || null,
    auftrag_id: document.getElementById('ma-aufid')?.value || null,
    gueltig_bis:document.getElementById('ma-gueltig')?.value || null,
    notiz:      document.getElementById('ma-notiz')?.value || null,
    positionen: pos,
    netto, ust, brutto,
    status: 'entwurf',
    erstellt_am: new Date().toISOString(),
  };

  try {
    if (isDemoMode) {
      S.angebote.unshift({ id: 'ang'+Date.now(), ...data });
    } else if (isLocalMode) {
      const id = 'ang'+Date.now();
      DB.insert('angebote', { id, ...data });
      S.angebote.unshift({ id, ...data });
    } else {
      const firma_id = S.firma?.id;
      const r = await sbq('angebote').insert({ ...data, firma_id }).select().single();
      if (r.data) S.angebote.unshift(r.data);
    }
  } catch(e) { console.warn('saveAngebot error', e); }

  oClose(); render();
};

window.delAngebot = async (id) => {
  if (!confirm('Angebot löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('angebote', id);
      else await sbq('angebote').delete().eq('id', id);
    }
  } catch(e) { console.warn(e); }
  S.angebote = S.angebote.filter(x=>x.id!==id);
  oClose(); render();
};

window.angToRe = (angId) => {
  const d = S.angebote.find(x=>x.id===angId);
  if (!d) return;
  oClose();
  S.tab = 'dokumente';
  window._angTemplate = d;
  openM('neuRe', d.auftrag_id);
};

// ── Rechnung CRUD ─────────────────────────────────────────────────────────────
window.saveRechnung = async () => {
  const titel = document.getElementById('mr-titel')?.value?.trim();
  if (!titel) return alert('Bitte Titel eingeben');

  const pos = window._mPos || [];
  const { netto, ust, brutto } = calcPos(pos);
  const data = {
    nummer:     document.getElementById('mr-nr')?.value || nextNummer('rechnung'),
    titel,
    kunde_id:   document.getElementById('mr-kunde')?.value || null,
    auftrag_id: document.getElementById('mr-aufid')?.value || null,
    faellig_am: document.getElementById('mr-faellig')?.value || null,
    notiz:      document.getElementById('mr-notiz')?.value || null,
    positionen: pos,
    netto, ust, brutto,
    status: 'entwurf',
    erstellt_am: new Date().toISOString(),
  };

  try {
    if (isDemoMode) {
      S.rechnungen.unshift({ id: 're'+Date.now(), ...data });
    } else if (isLocalMode) {
      const id = 're'+Date.now();
      DB.insert('rechnungen', { id, ...data });
      S.rechnungen.unshift({ id, ...data });
    } else {
      const firma_id = S.firma?.id;
      const r = await sbq('rechnungen').insert({ ...data, firma_id }).select().single();
      if (r.data) S.rechnungen.unshift(r.data);
    }
  } catch(e) { console.warn('saveRechnung error', e); }

  oClose(); render();
};

window.delRechnung = async (id) => {
  if (!confirm('Rechnung löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('rechnungen', id);
      else await sbq('rechnungen').delete().eq('id', id);
    }
  } catch(e) { console.warn(e); }
  S.rechnungen = S.rechnungen.filter(x=>x.id!==id);
  oClose(); render();
};

// ── Inventar CRUD ─────────────────────────────────────────────────────────────
window.saveInventar = async () => {
  const name = document.getElementById('mi-name')?.value?.trim();
  if (!name) return alert('Bitte Name eingeben');

  const id = document.getElementById('mi-id')?.value;
  const data = {
    name,
    kategorie:     document.getElementById('mi-kat')?.value?.trim() || null,
    bestand:       parseFloat(document.getElementById('mi-bestand')?.value) || 0,
    einheit:       document.getElementById('mi-einheit')?.value?.trim() || 'Stk',
    mindestbestand:parseFloat(document.getElementById('mi-min')?.value) || 0,
    einkaufspreis: parseFloat(document.getElementById('mi-preis')?.value) || 0,
    lieferant:     document.getElementById('mi-lief')?.value?.trim() || null,
  };

  try {
    if (isDemoMode) {
      if (id) { const i=S.inventar.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.inventar[i],data); }
      else S.inventar.unshift({ id:'i'+Date.now(), ...data });
    } else if (isLocalMode) {
      if (id) { DB.update('inventar',id,data); const i=S.inventar.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.inventar[i],data); }
      else { const nid='i'+Date.now(); DB.insert('inventar',{id:nid,...data}); S.inventar.unshift({id:nid,...data}); }
    } else {
      if (id) { await sbq('inventar').update(data).eq('id',id); const i=S.inventar.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.inventar[i],data); }
      else { const firma_id=S.firma?.id; const r=await sbq('inventar').insert({...data,firma_id}).select().single(); if(r.data) S.inventar.unshift(r.data); }
    }
  } catch(e) { console.warn('saveInventar error',e); }

  oClose(); render();
};

window.delInventar = async (id) => {
  if (!confirm('Artikel löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('inventar', id);
      else await sbq('inventar').delete().eq('id', id);
    }
  } catch(e) { console.warn(e); }
  S.inventar = S.inventar.filter(x=>x.id!==id);
  oClose(); render();
};

// ── Typ CRUD ──────────────────────────────────────────────────────────────────
window.saveTyp = async () => {
  const name = document.getElementById('mt-name')?.value?.trim();
  if (!name) return alert('Bitte Name eingeben');

  const id = document.getElementById('mt-id')?.value;
  const data = {
    name,
    farbe: document.getElementById('mt-farbe')?.value || '#f59e0b',
  };

  try {
    if (isDemoMode) {
      if (id) { const i=S.typen.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.typen[i],data); }
      else S.typen.push({ id:'t'+Date.now(), ...data });
    } else if (isLocalMode) {
      if (id) { DB.update('auftragstypen',id,data); const i=S.typen.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.typen[i],data); }
      else { const nid='t'+Date.now(); DB.insert('auftragstypen',{id:nid,...data}); S.typen.push({id:nid,...data}); }
    } else {
      if (id) { await sbq('auftragstypen').update(data).eq('id',id); const i=S.typen.findIndex(x=>x.id===id); if(i>=0) Object.assign(S.typen[i],data); }
      else { const firma_id=S.firma?.id; const r=await sbq('auftragstypen').insert({...data,firma_id}).select().single(); if(r.data) S.typen.push(r.data); }
    }
  } catch(e) { console.warn('saveTyp error',e); }

  oClose(); render();
};

window.delTyp = async (id) => {
  if (!confirm('Typ löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('auftragstypen', id);
      else await sbq('auftragstypen').delete().eq('id', id);
    }
  } catch(e) { console.warn(e); }
  S.typen = S.typen.filter(x=>x.id!==id);
  oClose(); render();
};

// ── Profil / Firma speichern ──────────────────────────────────────────────────
window.saveProfil = async () => {
  const data = {
    name:        document.getElementById('set-name')?.value?.trim(),
    stundensatz: parseFloat(document.getElementById('set-stunde')?.value) || null,
  };
  try {
    if (!isDemoMode) {
      if (isLocalMode) {
        if (S.profil?.id) DB.update('profile', S.profil.id, data);
      } else {
        await sbq('profile').update(data).eq('id', S.profil?.id);
      }
    }
    if (S.profil) Object.assign(S.profil, data);
  } catch(e) { console.warn(e); }
  alert('Profil gespeichert');
  render();
};

window.saveFirma = async () => {
  const data = {
    name:           document.getElementById('set-firma')?.value?.trim(),
    adresse:        document.getElementById('set-adresse')?.value?.trim() || null,
    telefon:        document.getElementById('set-tel')?.value?.trim() || null,
    email:          document.getElementById('set-femail')?.value?.trim() || null,
    uid_nummer:     document.getElementById('set-uid')?.value?.trim() || null,
    iban:           document.getElementById('set-iban')?.value?.trim() || null,
    kleinunternehmer: document.getElementById('set-ku')?.checked || false,
    ust_satz:       parseFloat(document.getElementById('set-ust')?.value) || 20,
    rechnung_notiz: document.getElementById('set-notiz')?.value?.trim() || null,
  };
  try {
    if (!isDemoMode) {
      if (isLocalMode) {
        if (S.firma?.id) DB.update('firmen', S.firma.id, data);
      } else {
        await sbq('firmen').update(data).eq('id', S.firma?.id);
      }
    }
    if (S.firma) Object.assign(S.firma, data);
    else S.firma = data;
  } catch(e) { console.warn(e); }
  alert('Firma gespeichert');
  render();
};

// ── Zeiteinträge CRUD ─────────────────────────────────────────────────────────
window.saveZeit = async () => {
  const std      = parseFloat(document.getElementById('mz-std')?.value) || 0;
  const min      = parseFloat(document.getElementById('mz-min')?.value) || 0;
  const auftragId= document.getElementById('mz-aufid')?.value;
  const datum    = document.getElementById('mz-datum')?.value;
  const dauer_ms = Math.round((std * 60 + min) * 60000);
  if (dauer_ms <= 0) return alert('Bitte Zeit eingeben');
  const entry = {
    auftrag_id: auftragId,
    dauer_ms,
    start_zeit: datum ? new Date(datum + 'T08:00:00').toISOString() : new Date().toISOString(),
    typ: 'manuell',
  };
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.insert('zeiteintraege', { id: 'z'+Date.now(), ...entry });
      else await sbq('zeiteintraege').insert(entry);
    }
  } catch(e) { console.warn('saveZeit error', e); }
  oClose(); render();
};

// ── Auftrag-Material CRUD ─────────────────────────────────────────────────────
window.saveMaterial = async () => {
  const name = document.getElementById('mm-name')?.value?.trim();
  if (!name) return alert('Bitte Bezeichnung eingeben');
  const auftragId = document.getElementById('mm-aufid')?.value;
  const data = {
    auftrag_id:   auftragId,
    name,
    menge:        parseFloat(document.getElementById('mm-menge')?.value) || 1,
    einheit:      document.getElementById('mm-einheit')?.value?.trim() || 'Stk',
    preis:        parseFloat(document.getElementById('mm-preis')?.value) || 0,
    status:       document.getElementById('mm-status')?.value || 'vorhanden',
    inventar_id:  document.getElementById('mm-inv')?.value || null,
  };
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.insert('auftrag_material', { id: 'm'+Date.now(), ...data });
      else await sbq('auftrag_material').insert(data);
    }
  } catch(e) { console.warn('saveMaterial error', e); }
  oClose(); render();
};

window.matInvChange = () => {
  const sel = document.getElementById('mm-inv');
  const opt = sel?.selectedOptions[0];
  if (!opt?.value) return;
  document.getElementById('mm-name').value    = opt.text;
  document.getElementById('mm-preis').value   = opt.dataset.preis || '';
  document.getElementById('mm-einheit').value = opt.dataset.einheit || 'Stk';
};

window.delZeit = async (id, auftragId) => {
  if (!confirm('Zeiteintrag löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('zeiteintraege', id);
      else await sbq('zeiteintraege').delete().eq('id', id);
    }
  } catch(e) { console.warn('delZeit error', e); }
  render();
};

window.delMaterial = async (id) => {
  if (!confirm('Material löschen?')) return;
  try {
    if (!isDemoMode) {
      if (isLocalMode) DB.delete('auftrag_material', id);
      else await sbq('auftrag_material').delete().eq('id', id);
    }
  } catch(e) { console.warn('delMaterial error', e); }
  render();
};

// ── Nutzer togglen ────────────────────────────────────────────────────────────
window.toggleNutzer = async (id, freigegeben) => {
  try {
    if (!isDemoMode && !isLocalMode) {
      await sbq('profile').update({ freigegeben }).eq('id', id);
    }
    const n = S.nutzer.find(x=>x.id===id);
    if (n) n.freigegeben = freigegeben;
  } catch(e) { console.warn(e); }
  render();
};

window.einladen = async () => {
  const email = document.getElementById('ei-email')?.value?.trim();
  if (!email) return alert('Bitte E-Mail eingeben');
  if (isDemoMode || isLocalMode) {
    alert('Einladungen nur im Online-Modus verfügbar');
    return;
  }
  try {
    alert(`Einladung an ${email} gesendet (Funktion in Kürze verfügbar)`);
  } catch(e) { console.warn(e); }
  oClose();
};

// ── Init ──────────────────────────────────────────────────────────────────────
// Event delegation — handles all data-action clicks (avoids iOS onclick issues)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const v = el.dataset.val;
  if (a === 'doktab')    { S.doktab   = v; render(); }
  if (a === 'filter')    { S.filter   = v; render(); }
  if (a === 'invfilter') { S.invFilter = v; render(); }
});

// Modal overlay click-outside to close
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') oClose();
});

// More panel click-outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('more-panel');
  if (panel?.classList.contains('open') && !panel.contains(e.target)) {
    panel.classList.remove('open');
  }
});

// If user is already logged in (auth.js ran before app.js loaded)
if (S.user || isDemoMode) render();
