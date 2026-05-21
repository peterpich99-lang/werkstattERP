import { S } from '../auth.js';

export default function vOnboarding() {
  if (S.waitingApproval) return renderWaiting();
  const step = S.onboardingStep || 'choose';
  if (step === 'setup') return renderSetup();
  if (step === 'join')  return renderJoin();
  return renderChoose();
}

function renderChoose() {
  return `
<div style="display:flex;flex-direction:column;align-items:center;padding:1.5rem 0 1rem;text-align:center">
  <div class="auth-logo" style="margin:0 auto 1rem">W</div>
  <div style="font-family:'DM Serif Display',serif;font-size:1.5rem;margin-bottom:.3rem">Willkommen!</div>
  <div style="font-size:.78rem;color:var(--text2);margin-bottom:1.8rem">Du bist angemeldet. Wie möchtest du fortfahren?</div>
</div>

<div style="display:grid;gap:.7rem">
  <button onclick="S.onboardingStep='setup';appRender()"
          style="background:var(--gold);color:#0a0a0c;border:none;border-radius:12px;padding:1rem 1.2rem;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:.3rem">
    <span style="font-size:.95rem;font-weight:700">Eigene Firma einrichten</span>
    <span style="font-size:.72rem;font-weight:400;opacity:.75">Du bist Inhaber oder selbstständig</span>
  </button>

  <button onclick="S.onboardingStep='join';appRender()"
          style="background:var(--s2);color:var(--text1);border:1px solid var(--border2);border-radius:12px;padding:1rem 1.2rem;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:.3rem">
    <span style="font-size:.95rem;font-weight:600">Bestehender Firma beitreten</span>
    <span style="font-size:.72rem;font-weight:400;color:var(--text3)">Du hast einen Einladungscode von deinem Admin</span>
  </button>
</div>`;
}

function renderSetup() {
  return `
<div style="margin-bottom:1rem">
  <button class="btn-sm" onclick="S.onboardingStep='choose';appRender()"
          style="font-size:.72rem;color:var(--text2);border-color:var(--border);margin-bottom:.7rem">← Zurück</button>
  <div style="font-family:'DM Serif Display',serif;font-size:1.25rem;margin-bottom:.2rem">Firma einrichten</div>
  <div style="font-size:.72rem;color:var(--text3)">Diese Daten erscheinen auf deinen PDFs</div>
</div>

<div style="display:grid;gap:.55rem">
  <div><label class="form-label">Firmenname *</label>
    <input id="ob-firma" placeholder="z.B. Tischlerei Muster" autocomplete="organization"></div>
  <div><label class="form-label">Adresse</label>
    <input id="ob-adresse" placeholder="Musterstraße 1, 1010 Wien" autocomplete="street-address"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
    <div><label class="form-label">Telefon</label>
      <input id="ob-tel" type="tel" placeholder="+43 ..." autocomplete="tel"></div>
    <div><label class="form-label">E-Mail</label>
      <input id="ob-email" type="email" placeholder="office@..." autocomplete="email"></div>
  </div>
  <div><label class="form-label">IBAN</label>
    <input id="ob-iban" placeholder="AT..." autocomplete="off"></div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-top:1px solid var(--border)">
    <div>
      <div style="font-size:.82rem;font-weight:600">Kleinunternehmer</div>
      <div style="font-size:.65rem;color:var(--text3)">Keine USt. auf Rechnungen (§6 UStG)</div>
    </div>
    <input type="checkbox" id="ob-ku" checked style="width:1.1rem;height:1.1rem;accent-color:var(--gold)">
  </div>
  <button class="btn" style="margin-top:.3rem" onclick="setupFirma()">Weiter →</button>
  <div id="ob-err" style="color:var(--red2);font-size:.75rem;text-align:center;min-height:1.2em"></div>
</div>`;
}

function renderJoin() {
  return `
<div style="margin-bottom:1rem">
  <button class="btn-sm" onclick="S.onboardingStep='choose';appRender()"
          style="font-size:.72rem;color:var(--text2);border-color:var(--border);margin-bottom:.7rem">← Zurück</button>
  <div style="font-family:'DM Serif Display',serif;font-size:1.25rem;margin-bottom:.2rem">Firma beitreten</div>
  <div style="font-size:.72rem;color:var(--text3)">Frag deinen Admin nach dem Einladungscode</div>
</div>

<div style="display:grid;gap:.55rem">
  <div><label class="form-label">Einladungscode</label>
    <input id="ob-code" placeholder="Code eingeben…"
           style="font-family:monospace;letter-spacing:.05em" autocomplete="off"
           onkeydown="if(event.key==='Enter')joinFirma()"></div>
  <button class="btn" style="margin-top:.3rem" onclick="joinFirma()">Beitreten</button>
  <div id="ob-err" style="color:var(--red2);font-size:.75rem;text-align:center;min-height:1.2em"></div>
</div>`;
}

function renderWaiting() {
  return `
<div style="display:flex;flex-direction:column;align-items:center;padding:2rem 0;text-align:center">
  <div style="width:56px;height:56px;border-radius:50%;background:var(--s2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1rem">
    ●
  </div>
  <div style="font-family:'DM Serif Display',serif;font-size:1.3rem;margin-bottom:.5rem">Warte auf Freigabe</div>
  <div style="font-size:.78rem;color:var(--text2);margin-bottom:1.5rem;max-width:260px;line-height:1.6">
    Dein Account wurde der Firma hinzugefügt.<br>Ein Admin muss dich noch freigeben.
  </div>
  <button class="btn" onclick="checkApproval()">Aktualisieren</button>
  <button class="btn-ghost" style="margin-top:.6rem" onclick="doLogout()">Abmelden</button>
  <div id="ob-err" style="color:var(--red2);font-size:.75rem;margin-top:.5rem;min-height:1.2em"></div>
</div>`;
}
