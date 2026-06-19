import { S } from '../auth.js';

export default function vSettings() {
  const f = S.firma || {};
  const p = S.profil || {};

  return `
<div class="sec-head">
  <h2>Einstellungen</h2>
</div>

<div class="sec-label">Mein Profil</div>
<div class="card" style="padding:.85rem">
  <div style="display:grid;gap:.55rem">
    <div>
      <label class="form-label">Name</label>
      <input id="set-name" value="${p.name || ''}" placeholder="Dein Name">
    </div>
    <div>
      <label class="form-label">E-Mail</label>
      <input id="set-email" value="${S.user?.email || ''}" disabled style="opacity:.5">
    </div>
    <div>
      <label class="form-label">Stundensatz (€)</label>
      <input id="set-stunde" type="number" value="${p.stundensatz || ''}" placeholder="80">
    </div>
    <button class="btn" onclick="saveProfil()">Profil speichern</button>
  </div>
</div>

<div class="sec-label" style="margin-top:.85rem">Firma</div>
<div class="card" style="padding:.85rem">
  <div style="display:grid;gap:.55rem">
    <div>
      <label class="form-label">Firmenname</label>
      <input id="set-firma" value="${f.name || ''}" placeholder="Werkstatt GmbH">
    </div>
    <div>
      <label class="form-label">Adresse</label>
      <input id="set-adresse" value="${f.adresse || ''}" placeholder="Musterstraße 1, 1010 Wien">
    </div>
    <div>
      <label class="form-label">Telefon</label>
      <input id="set-tel" value="${f.telefon || ''}" placeholder="+43 ...">
    </div>
    <div>
      <label class="form-label">E-Mail</label>
      <input id="set-femail" value="${f.email || ''}" placeholder="office@...">
    </div>
    <div>
      <label class="form-label">UID-Nummer</label>
      <input id="set-uid" value="${f.uid_nummer || ''}" placeholder="ATU...">
    </div>
    <div>
      <label class="form-label">IBAN</label>
      <input id="set-iban" value="${f.iban || ''}" placeholder="AT...">
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-top:1px solid var(--border)">
      <div>
        <div style="font-size:.82rem;font-weight:600">Kleinunternehmer</div>
        <div style="font-size:.68rem;color:var(--text3)">Keine USt. auf Rechnungen</div>
      </div>
      <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer">
        <input type="checkbox" id="set-ku" ${f.kleinunternehmer ? 'checked' : ''}
               style="width:1.1rem;height:1.1rem;accent-color:var(--gold)">
      </label>
    </div>
    <div>
      <label class="form-label">USt-Satz (%)</label>
      <input id="set-ust" type="number" value="${f.ust_satz ?? 20}" placeholder="20">
    </div>
    <div>
      <label class="form-label">Notiz auf Rechnung</label>
      <textarea id="set-notiz" rows="2" style="resize:vertical">${f.rechnung_notiz || ''}</textarea>
    </div>
    <button class="btn" onclick="saveFirma()">Firma speichern</button>
  </div>
</div>

${S.profil?.rolle === 'admin' ? `
<div class="sec-label" style="margin-top:.85rem">Team-Einladung</div>
<div class="card" style="padding:.85rem">
  <div style="font-size:.75rem;color:var(--text2);margin-bottom:.6rem;line-height:1.5">
    Teile diesen Code mit Mitarbeitern, damit sie der Firma beitreten können.
  </div>
  <div style="background:var(--s1);border:1px solid var(--border2);border-radius:8px;padding:.55rem .7rem;font-family:monospace;font-size:.75rem;word-break:break-all;color:var(--gold3);margin-bottom:.5rem">
    ${f.invite_code || '—'}
  </div>
  <div style="display:flex;gap:.4rem">
    <button class="btn-ghost" style="flex:1;font-size:.75rem" onclick="copyInviteCode()">Kopieren</button>
    <button class="btn-ghost" style="flex:1;font-size:.75rem" onclick="regenerateInviteCode()">Neu generieren</button>
  </div>
</div>` : ''}

<div class="sec-label" style="margin-top:.85rem">Auftragstypen</div>
<div class="card" style="padding:.85rem">
  ${S.typen.map(t => `
  <div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;border-bottom:1px solid var(--border)">
    <div style="width:12px;height:12px;border-radius:50%;background:${t.farbe};flex-shrink:0"></div>
    <span style="flex:1;font-size:.82rem">${t.name}</span>
    <button class="btn-sm" onclick="openM('editTyp','${t.id}')">Edit</button>
  </div>`).join('')}
  <button class="btn-ghost" style="margin-top:.6rem;font-size:.75rem;width:100%" onclick="openM('neuTyp')">+ Typ hinzufügen</button>
</div>

<div style="margin-top:1.2rem;padding-bottom:.5rem">
  <button class="btn-danger" style="width:100%" onclick="doLogout()">Abmelden</button>
</div>
`;
}
