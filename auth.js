import { SB, DB, sbq, localAuth, isLocalMode, detectMode } from './db.js';

// ── Demo Data ─────────────────────────────────────────────────────────
const DEMO = {
  user:   { id: 'demo', email: 'demo@werkstatt.at' },
  profil: { id: 'demo', name: 'Demo User', rolle: 'admin', stundensatz: 45, freigegeben: true },
  firma:  {
    name: 'Tischlerei Mustermann', inhaber: 'Hans Mustermann',
    adresse: 'Hauptstraße 12, 8600 Bruck an der Mur',
    telefon: '03862 12345', email: 'office@tischlerei-mustermann.at',
    iban: 'AT12 3456 7890 1234 5678',
    kleinunternehmer: true, ust_satz: 20,
  },
  typen: [
    { id: 't1', name: 'Fensterrestaurierung', farbe: '#b8832a', vordefiniert: true },
    { id: 't2', name: 'Schneidebrett',        farbe: '#4a7c59', vordefiniert: true },
    { id: 't3', name: 'Reparatur',            farbe: '#2d6a9f', vordefiniert: true },
  ],
  kunden: [
    { id: 'k1', name: 'Familie Huber',      telefon: '0664 123456', email: 'huber@example.at',      adresse: 'Bergstraße 5',  plz_ort: '8600 Bruck an der Mur' },
    { id: 'k2', name: 'Gasthaus Alpenblick', telefon: '03862 9876', email: 'info@alpenblick.at',    adresse: 'Seestraße 22',  plz_ort: '8630 Mariazell'         },
    { id: 'k3', name: 'Familie Maier',       telefon: '0699 456789', email: 'maier@example.at',     adresse: 'Kirchgasse 3',  plz_ort: '8600 Bruck an der Mur' },
  ],
  auftraege: [
    { id: 'a1', titel: 'Kastenfenster EG – Familie Huber', auftragstyp_id: 't1', kunde_id: 'k1', status: 'in_arbeit',     prioritaet: 'hoch',    stundensatz: 45, notizen: '4 Flügel, Baujahr ~1920.',      erstellt_am: d(-5),  faellig_am: d(+10) },
    { id: 'a2', titel: 'Schneidebrett Set 3-teilig',       auftragstyp_id: 't2', kunde_id: 'k2', status: 'offen',         prioritaet: 'normal',  stundensatz: 45, notizen: 'Walnuss/Eiche/Kirsche, Gravur.', erstellt_am: d(-2)              },
    { id: 'a3', titel: 'Fensterrestaurierung Gasthaus',    auftragstyp_id: 't1', kunde_id: 'k2', status: 'abgeschlossen', prioritaet: 'normal',  stundensatz: 45, notizen: '',                               erstellt_am: d(-30)             },
    { id: 'a4', titel: 'Türreparatur',                     auftragstyp_id: 't3', kunde_id: 'k3', status: 'offen',         prioritaet: 'dringend',stundensatz: 45, notizen: '',                               erstellt_am: d(-1),  faellig_am: d(+2)  },
  ],
  inventar: [
    { id: 'i1', name: 'PU-Leim Würth',      kategorie: 'Leim',        einheit: 'Stk', bestand: 2,   mindestbestand: 3, einkaufspreis: 12.5, lieferant: 'Würth'        },
    { id: 'i2', name: 'Leinöl food grade',  kategorie: 'Öl',          einheit: 'L',   bestand: 1.5, mindestbestand: 2, einkaufspreis: 8.9,  lieferant: 'OBI'          },
    { id: 'i3', name: 'Fensterkit weiß',    kategorie: 'Kitt',        einheit: 'Stk', bestand: 4,   mindestbestand: 2, einkaufspreis: 6.5,  lieferant: 'Bauhaus'      },
    { id: 'i4', name: 'Grundierung Caparol',kategorie: 'Grundierung', einheit: 'L',   bestand: 3,   mindestbestand: 1, einkaufspreis: 15.9, lieferant: 'Farben Müller'},
  ],
  angebote: [
    { id: 'ang1', nummer: 'AN-2025-0001', kunde_id: 'k1', titel: 'Kastenfenster EG', status: 'angenommen',
      positionen: [{ bezeichnung: 'Arbeitszeit', menge: 12, einheit: 'Std', einzelpreis: 45 }, { bezeichnung: 'Material', menge: 1, einheit: 'pauschal', einzelpreis: 85 }],
      netto: 625, ust_betrag: 0, brutto: 625, gueltig_bis: '2025-07-01', erstellt_am: d(-10) },
    { id: 'ang2', nummer: 'AN-2025-0002', kunde_id: 'k2', titel: 'Schneidebrett Set', status: 'entwurf',
      positionen: [{ bezeichnung: 'Schneidebrett Walnuss 40×30', menge: 1, einheit: 'Stk', einzelpreis: 89 }, { bezeichnung: 'Schneidebrett Eiche 35×25', menge: 1, einheit: 'Stk', einzelpreis: 69 }],
      netto: 158, ust_betrag: 0, brutto: 158, gueltig_bis: '2025-07-15', erstellt_am: d(-1) },
  ],
  rechnungen: [
    { id: 're1', nummer: 'RE-2025-0001', kunde_id: 'k2', titel: 'Fensterrestaurierung Gasthaus', status: 'bezahlt',
      positionen: [{ bezeichnung: 'Arbeitszeit', menge: 16, einheit: 'Std', einzelpreis: 45 }, { bezeichnung: 'Material pauschal', menge: 1, einheit: 'pauschal', einzelpreis: 120 }],
      netto: 840, ust_betrag: 0, brutto: 840, faellig_am: '2025-05-01', erstellt_am: d(-25) },
    { id: 're2', nummer: 'RE-2025-0002', kunde_id: 'k1', titel: 'Kastenfenster EG – Familie Huber', status: 'gesendet',
      positionen: [{ bezeichnung: 'Arbeitszeit Restaurierung', menge: 12, einheit: 'Std', einzelpreis: 45 }, { bezeichnung: 'Material', menge: 1, einheit: 'pauschal', einzelpreis: 85 }],
      netto: 625, ust_betrag: 0, brutto: 625, faellig_am: d(+14), erstellt_am: d(-3) },
  ],
  nutzer: [{ id: 'demo', name: 'Demo User', rolle: 'admin', freigegeben: true, stundensatz: 45 }],
};

function d(offset) {
  const t = new Date(Date.now() + offset * 86400000);
  return offset < 0 ? t.toISOString() : t.toISOString().split('T')[0];
}

// ── Global State ──────────────────────────────────────────────────────
export let isDemoMode = false;

export const S = {
  tab: 'dash',
  user: null, profil: null, firma: {},
  typen: [], kunden: [], auftraege: [], inventar: [], angebote: [], rechnungen: [], nutzer: [],
  aktId: null, timer: null, tick: null, modal: null, filter: 'alle', doktab: 'angebote',
};

// ── UI ────────────────────────────────────────────────────────────────
export function showAuth() {
  if (isLocalMode) _initLocalDefaults();
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

export function hideAuth() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function _initLocalDefaults() {
  if (!DB._get('auftragstypen').length) {
    DB.insert('auftragstypen', [
      { id: 't-fen',  name: 'Fensterrestaurierung', farbe: '#b8832a', vordefiniert: true },
      { id: 't-schn', name: 'Schneidebrett',        farbe: '#4a7c59', vordefiniert: true },
      { id: 't-rep',  name: 'Reparatur',            farbe: '#2d6a9f', vordefiniert: true },
      { id: 't-son',  name: 'Sonstiges',            farbe: '#666666', vordefiniert: true },
    ]);
  }
  if (!DB._get('firma').length) {
    DB._set('firma', [{ id: 1, firmenname: '', kleinunternehmer: true, ust_satz: 20, zahlungsziel_tage: 14, angebot_gueltig_tage: 30 }]);
  }
  if (!DB._get('nummernkreis').length) {
    const yr = new Date().getFullYear();
    DB._set('nummernkreis', [{ typ: 'rechnung', jahr: yr, zaehler: 0 }, { typ: 'angebot', jahr: yr, zaehler: 0 }]);
  }
}

// ── Demo Mode ─────────────────────────────────────────────────────────
export function startDemo() {
  isDemoMode = true;
  S.user = DEMO.user;
  S.profil = DEMO.profil;
  S.firma = DEMO.firma;
  S.typen = DEMO.typen;
  S.kunden = DEMO.kunden;
  S.auftraege = DEMO.auftraege;
  S.inventar = DEMO.inventar;
  S.angebote = DEMO.angebote;
  S.rechnungen = DEMO.rechnungen;
  S.nutzer = DEMO.nutzer;
  document.getElementById('hdr-user').textContent = 'Demo';
  document.getElementById('hdr-sub').textContent = DEMO.firma.name;
  hideAuth();
  render();
}

// ── Data Loader ───────────────────────────────────────────────────────
export async function load() {
  if (isDemoMode) return;
  const [a, b, c, d, e, f, g] = await Promise.all([
    sbq('auftragstypen').select('*').order('name'),
    sbq('kunden').select('*').order('name'),
    sbq('auftraege').select('*').order('erstellt_am', { ascending: false }),
    sbq('inventar').select('*').order('name'),
    sbq('angebote').select('*').order('erstellt_am', { ascending: false }),
    sbq('rechnungen').select('*').order('erstellt_am', { ascending: false }),
    sbq('profile').select('*'),
  ]);
  S.typen      = a.data || [];
  S.kunden     = b.data || [];
  S.auftraege  = c.data || [];
  S.inventar   = d.data || [];
  S.angebote   = e.data || [];
  S.rechnungen = f.data || [];
  S.nutzer     = g.data || [];
}

// ── Boot (after successful login) ─────────────────────────────────────
export async function boot(user) {
  if (S.user?.id === user?.id && S.profil?.id) return;
  S.user = user;

  try {
    // Profil holen
    const { data: profil } = await sbq('profile').select('*').eq('id', user.id).single();
    S.profil = profil || {};

    if (profil && profil.freigegeben === false) {
      showAuth();
      document.getElementById('a-err').textContent = 'Dein Account wartet auf Freigabe durch den Admin.';
      if (!isLocalMode) await SB.auth.signOut();
      return;
    }

    // Firma holen (via firma_id aus Profil)
    let firma = {};
    if (profil?.firma_id) {
      if (isLocalMode) {
        firma = DB._get('firmen').find(f => f.id === profil.firma_id) || {};
      } else {
        const { data } = await SB.from('firmen').select('*').eq('id', profil.firma_id).single();
        firma = data || {};
      }
    }
    S.firma = firma;

    document.getElementById('hdr-user').textContent = (profil?.name || user.email).split(' ')[0];
    document.getElementById('hdr-sub').textContent  = S.firma.name || 'Werkstatt Pro';
  } catch (err) {
    S.profil = {};
    S.firma  = {};
    document.getElementById('hdr-user').textContent = user.email.split('@')[0];
    document.getElementById('hdr-sub').textContent  = 'Werkstatt Pro';
  }

  hideAuth();
  try { await load(); } catch (err) { console.warn('[WP] load error', err); }
  render();
}

// ── Render (placeholder until app.js is loaded) ───────────────────────
export function render() {
  if (typeof window.appRender === 'function') {
    window.appRender();
    return;
  }
  _renderPlaceholder();
}

function _renderPlaceholder() {
  const content = document.getElementById('app-content');
  if (!content) return;

  const offen = S.auftraege.filter(a => a.status === 'offen' || a.status === 'in_arbeit').length;
  const name  = S.profil?.name || S.user?.email?.split('@')[0] || '';
  const mode  = isDemoMode ? 'Demo-Modus' : isLocalMode ? 'Offline-Modus' : 'Online';

  content.innerHTML = `
    <div style="text-align:center;padding:2.5rem 1rem 1.5rem">
      <div class="auth-logo" style="margin:0 auto 1rem">W</div>
      <div style="font-family:'DM Serif Display',serif;font-size:1.5rem;margin-bottom:.3rem">Willkommen, ${name}!</div>
      <div style="font-size:.75rem;color:var(--text3);margin-bottom:1.5rem">${S.firma.name || 'Werkstatt Pro'} · ${mode}</div>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-val">${offen}</div><div class="kpi-lbl"><span class="kpi-dot" style="background:var(--amber2)"></span>Offene Aufträge</div></div>
      <div class="kpi"><div class="kpi-val">${S.kunden.length}</div><div class="kpi-lbl"><span class="kpi-dot" style="background:var(--blue2)"></span>Kunden</div></div>
      <div class="kpi"><div class="kpi-val">${S.angebote.length}</div><div class="kpi-lbl"><span class="kpi-dot" style="background:var(--gold2)"></span>Angebote</div></div>
      <div class="kpi"><div class="kpi-val">${S.rechnungen.length}</div><div class="kpi-lbl"><span class="kpi-dot" style="background:var(--green2)"></span>Rechnungen</div></div>
    </div>`;

  const nav = document.getElementById('app-nav');
  if (nav) nav.innerHTML = '';
}

// ── Window-exposed auth functions ─────────────────────────────────────
window.startDemo = startDemo;

window.authTab = (tab) => {
  document.querySelectorAll('.auth-tab').forEach((btn, i) =>
    btn.classList.toggle('on', i === (tab === 'login' ? 0 : 1))
  );
  document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-reg').style.display   = tab === 'reg'   ? 'block' : 'none';
  ['a-err', 'r-err', 'r-ok'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
};

window.doLogin = async () => {
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('a-err');
  const email = document.getElementById('a-mail')?.value?.trim();
  const pw    = document.getElementById('a-pw')?.value;

  if (!email || !pw) { errEl.textContent = 'Bitte E-Mail und Passwort eingeben.'; return; }

  btn.textContent = 'Anmelden…';
  btn.disabled    = true;
  errEl.textContent = '';

  try {
    if (isLocalMode) {
      errEl.textContent = 'Offline-Modus aktiv – Supabase nicht erreichbar.';
      btn.textContent = 'Anmelden'; btn.disabled = false; return;
    }
    if (!SB?.auth) {
      errEl.textContent = 'Supabase nicht geladen. Bitte Seite neu laden.';
      btn.textContent = 'Anmelden'; btn.disabled = false; return;
    }
    // iOS PWA WebKit bug: fetch after touch events can fail immediately.
    // Small delay lets the touch handling complete before the network call.
    await new Promise(r => setTimeout(r, 150));

    let data, error;
    try {
      ({ data, error } = await SB.auth.signInWithPassword({ email, password: pw }));
    } catch (e) {
      error = { message: e?.message || String(e) };
    }

    // supabase-js returns network errors as error.message, not as thrown exceptions.
    // "Load failed" = WebKit fetch failure → try a direct fetch as fallback.
    if (error && /load failed|failed to fetch|networkerror|fetch/i.test(error.message)) {
      try {
        const r = await fetch(
          'https://mjiqfpdthrqznrdxcwzt.supabase.co/auth/v1/token?grant_type=password',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaXFmcGR0aHJxem5yZHhjd3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkwNDEsImV4cCI6MjA5NDkzNTA0MX0.9zg22fKAEvBovrouLKrXgvg6Hku71UNuPV7hhzfPDOo',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaXFmcGR0aHJxem5yZHhjd3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkwNDEsImV4cCI6MjA5NDkzNTA0MX0.9zg22fKAEvBovrouLKrXgvg6Hku71UNuPV7hhzfPDOo',
            },
            body: JSON.stringify({ email, password: pw }),
          }
        );
        const json = await r.json().catch(() => ({}));
        if (r.ok) {
          await SB.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
          data = { user: json.user };
          error = null;
        } else {
          error = { message: json.error_description || json.msg || `Server Fehler ${r.status}` };
        }
      } catch (e2) {
        error = { message: 'Supabase nicht erreichbar. Bitte Supabase Dashboard prüfen – Projekt möglicherweise pausiert.' };
      }
    }

    if (error) {
      errEl.textContent = error.message.toLowerCase().includes('invalid')
        ? 'Falsche E-Mail oder falsches Passwort.'
        : error.message;
    } else if (data?.user) {
      await boot(data.user);
    }
  } catch (e) {
    errEl.textContent = 'Fehler: ' + (e?.message || String(e));
  } finally {
    btn.textContent = 'Anmelden';
    btn.disabled    = false;
  }
};

window.doReg = async () => {
  const errEl = document.getElementById('r-err');
  const okEl  = document.getElementById('r-ok');
  errEl.textContent = '';
  okEl.textContent  = '';

  const name  = document.getElementById('r-name')?.value?.trim();
  const email = document.getElementById('r-mail')?.value?.trim();
  const pw    = document.getElementById('r-pw')?.value;

  if (!email || !pw) { errEl.textContent = 'Bitte E-Mail und Passwort eingeben.'; return; }
  if (pw.length < 6) { errEl.textContent = 'Passwort muss mindestens 6 Zeichen haben.'; return; }

  const auth = isLocalMode ? localAuth : SB.auth;
  const { data, error } = await auth.signUp({ email, password: pw, options: { data: { name } } });

  if (error) {
    errEl.textContent = error.message === 'User already registered'
      ? 'Diese E-Mail ist bereits registriert.'
      : error.message;
  } else if (isLocalMode && data?.user) {
    await boot(data.user);
  } else {
    okEl.textContent = 'Bestätigungsmail gesendet! Bitte E-Mail prüfen.';
  }
};

window.doLogout = async () => {
  if (isDemoMode) {
    isDemoMode = false;
    Object.assign(S, { user: null, profil: null, firma: {}, typen: [], kunden: [], auftraege: [], inventar: [], angebote: [], rechnungen: [], nutzer: [] });
    showAuth();
    return;
  }
  if (isLocalMode) {
    await localAuth.signOut();
    S.user = null; S.profil = null;
    showAuth();
    return;
  }
  await SB.auth.signOut();
};

window.closeMore = () => document.getElementById('more-panel')?.classList.remove('open');

// ── Init ──────────────────────────────────────────────────────────────
await detectMode();

if (!isLocalMode) {
  SB.auth.onAuthStateChange((_, session) => {
    if (session?.user) boot(session.user);
    else if (!session) { S.user = null; showAuth(); }
  });
}

try {
  const auth = isLocalMode ? localAuth : SB.auth;
  const { data: { session } } = await auth.getSession();
  if (session?.user) await boot(session.user);
  else showAuth();
} catch (err) {
  console.error('[WP] auth init error:', err);
  showAuth();
}
