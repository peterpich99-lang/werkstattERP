import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://itstjivahmmiuwxqabnq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kNLXqjqguJhAq4Q4IL8ogQ_3jyiN54F';

// iOS-safe storage wrapper
export const safeStorage = {
  getItem(k)    { try { return localStorage.getItem(k)    } catch { return sessionStorage.getItem(k)    } },
  setItem(k, v) { try { localStorage.setItem(k, v)        } catch { sessionStorage.setItem(k, v)        } },
  removeItem(k) { try { localStorage.removeItem(k)        } catch { sessionStorage.removeItem(k)        } },
};

export const SB = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'werkstatt_v2',
    storage: safeStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
  },
});

// Live binding — detectMode() flips this
export let isLocalMode = false;

export async function detectMode() {
  // Use navigator.onLine — instant and reliable in PWA standalone mode.
  // Never set isLocalMode=true if the device is online, even if Supabase is slow.
  isLocalMode = !navigator.onLine;
  if (isLocalMode) console.log('[WP] Offline – lokaler Speicher aktiv');
}

// Keep isLocalMode in sync if connection drops/returns mid-session
window.addEventListener('online',  () => { isLocalMode = false; });
window.addEventListener('offline', () => { isLocalMode = true;  });

// ── Local DB (localStorage) ───────────────────────────────────────────
export const DB = {
  _get(t)    { try { return JSON.parse(localStorage.getItem('wp_' + t) || '[]') } catch { return [] } },
  _set(t, d) { try { localStorage.setItem('wp_' + t, JSON.stringify(d)) } catch {} },

  insert(t, rows) {
    const data = this._get(t);
    const arr = Array.isArray(rows) ? rows : [rows];
    arr.forEach(r => {
      if (!r.id) r.id = crypto.randomUUID();
      if (!r.erstellt_am) r.erstellt_am = new Date().toISOString();
      data.push(r);
    });
    this._set(t, data);
    return { data: arr, error: null };
  },

  update(t, id, updates) {
    const data = this._get(t).map(r => r.id === id ? { ...r, ...updates } : r);
    this._set(t, data);
    return { data: null, error: null };
  },

  delete(t, id) {
    this._set(t, this._get(t).filter(r => r.id !== id));
    return { data: null, error: null };
  },

  upsert(t, row) {
    const data = this._get(t);
    const i = data.findIndex(r => r.id === row.id || (row.profil_id && r.profil_id === row.profil_id));
    if (i >= 0) data[i] = { ...data[i], ...row }; else data.push(row);
    this._set(t, data);
    return { data: row, error: null };
  },
};

// ── Smart query wrapper ───────────────────────────────────────────────
// Returns a local chainable builder when offline, or SB.from() when online.
export function sbq(table) {
  if (!isLocalMode) return SB.from(table);

  return {
    select() {
      return {
        eq(col, val) {
          const rows = DB._get(table).filter(r => r[col] === val);
          return {
            single()      { return Promise.resolve({ data: rows[0] ?? null, error: null }) },
            order()       { return Promise.resolve({ data: rows, error: null }) },
            then(fn)      { return Promise.resolve({ data: rows, error: null }).then(fn) },
            gte(c2, v2)   {
              const d2 = rows.filter(r => r[c2] >= v2);
              return {
                order()  { return Promise.resolve({ data: d2, error: null }) },
                then(fn) { return Promise.resolve({ data: d2, error: null }).then(fn) },
              };
            },
          };
        },
        order(col, opts) {
          const asc = opts?.ascending !== false;
          const data = DB._get(table).sort((a, b) =>
            asc ? String(a[col] ?? '').localeCompare(String(b[col] ?? ''))
                : String(b[col] ?? '').localeCompare(String(a[col] ?? ''))
          );
          return Promise.resolve({ data, error: null });
        },
        gte(col, val) {
          const data = DB._get(table).filter(r => r[col] >= val);
          return { order() { return Promise.resolve({ data, error: null }) } };
        },
        single() { return Promise.resolve({ data: DB._get(table)[0] ?? null, error: null }) },
        then(fn) { return Promise.resolve({ data: DB._get(table), error: null }).then(fn) },
      };
    },

    insert(rows) {
      const result = DB.insert(table, rows);
      return {
        select() { return { single() { return Promise.resolve({ data: result.data[0], error: null }) } } },
        then(fn) { return Promise.resolve(result).then(fn) },
      };
    },

    update(updates) {
      return {
        eq(col, val) {
          const data = DB._get(table).map(r => r[col] === val ? { ...r, ...updates } : r);
          DB._set(table, data);
          return Promise.resolve({ data: null, error: null });
        },
      };
    },

    delete() {
      return {
        eq(col, val) {
          DB._set(table, DB._get(table).filter(r => r[col] !== val));
          return Promise.resolve({ data: null, error: null });
        },
        in(col, vals) {
          DB._set(table, DB._get(table).filter(r => !vals.includes(r[col])));
          return Promise.resolve({ data: null, error: null });
        },
      };
    },

    upsert(row) {
      DB.upsert(table, Array.isArray(row) ? row[0] : row);
      return Promise.resolve({ data: null, error: null });
    },
  };
}

// ── Local Auth (offline mirror of Supabase auth API) ──────────────────
export const localAuth = {
  _users()        { try { return JSON.parse(localStorage.getItem('wp_users') || '[]') } catch { return [] } },
  _saveUsers(u)   { localStorage.setItem('wp_users', JSON.stringify(u)) },
  _session()      { try { return JSON.parse(localStorage.getItem('wp_session') || 'null') } catch { return null } },
  _saveSession(s) { localStorage.setItem('wp_session', JSON.stringify(s)) },

  async getSession() {
    return { data: { session: this._session() } };
  },

  async signInWithPassword({ email, password }) {
    const user = this._users().find(u => u.email === email && u.password === password);
    if (!user) return { data: null, error: { message: 'Invalid login credentials' } };
    const session = { user: { id: user.id, email: user.email } };
    this._saveSession(session);
    return { data: { user: session.user }, error: null };
  },

  async signUp({ email, password, options }) {
    const users = this._users();
    if (users.find(u => u.email === email)) return { data: null, error: { message: 'User already registered' } };
    const id = crypto.randomUUID();
    const name = options?.data?.name || email;
    users.push({ id, email, password, name });
    this._saveUsers(users);
    // Auto-create profile; first user gets admin + freigegeben
    const profiles = DB._get('profile');
    const isFirst = profiles.length === 0;
    profiles.push({ id, name, rolle: isFirst ? 'admin' : 'mitarbeiter', freigegeben: isFirst, stundensatz: 0, erstellt_am: new Date().toISOString() });
    DB._set('profile', profiles);
    const session = { user: { id, email } };
    this._saveSession(session);
    return { data: { user: { id, email } }, error: null };
  },

  async signOut() {
    localStorage.removeItem('wp_session');
  },

  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } };
  },
};
