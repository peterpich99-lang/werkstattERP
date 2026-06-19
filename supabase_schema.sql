-- ═══════════════════════════════════════════════════════════
-- Werkstatt Pro – Supabase Schema
-- In den Supabase SQL-Editor kopieren und ausführen
-- ═══════════════════════════════════════════════════════════

-- ── Tabellen ──────────────────────────────────────────────

create table if not exists public.firmen (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  adresse     text,
  telefon     text,
  email       text,
  uid_nummer  text,
  iban        text,
  kleinunternehmer boolean default true,
  ust_satz    numeric default 20,
  rechnung_notiz text,
  erstellt_am timestamptz default now()
);

create table if not exists public.profile (
  id          uuid primary key references auth.users(id) on delete cascade,
  firma_id    uuid references public.firmen(id),
  name        text,
  rolle       text default 'admin',
  stundensatz numeric default 0,
  freigegeben boolean default true,
  erstellt_am timestamptz default now()
);

create table if not exists public.auftragstypen (
  id          uuid primary key default gen_random_uuid(),
  firma_id    uuid references public.firmen(id) on delete cascade,
  name        text not null,
  farbe       text default '#888888',
  vordefiniert boolean default false
);

create table if not exists public.kunden (
  id          uuid primary key default gen_random_uuid(),
  firma_id    uuid references public.firmen(id) on delete cascade,
  name        text not null,
  email       text,
  telefon     text,
  adresse     text,
  notiz       text,
  erstellt_am timestamptz default now()
);

create table if not exists public.auftraege (
  id              uuid primary key default gen_random_uuid(),
  firma_id        uuid references public.firmen(id) on delete cascade,
  kunde_id        uuid references public.kunden(id) on delete set null,
  auftragstyp_id  uuid references public.auftragstypen(id) on delete set null,
  titel           text not null,
  status          text default 'offen',
  prioritaet      text default 'normal',
  stundensatz     numeric default 0,
  notizen         text,
  faellig_am      date,
  erstellt_am     timestamptz default now()
);

create table if not exists public.zeiteintraege (
  id          uuid primary key default gen_random_uuid(),
  auftrag_id  uuid references public.auftraege(id) on delete cascade,
  profil_id   uuid references public.profile(id) on delete set null,
  dauer_ms    bigint default 0,
  start_zeit  timestamptz default now(),
  typ         text default 'global'
);

create table if not exists public.auftrag_material (
  id          uuid primary key default gen_random_uuid(),
  auftrag_id  uuid references public.auftraege(id) on delete cascade,
  name        text not null,
  menge       numeric default 1,
  einheit     text default 'Stk',
  preis       numeric default 0,
  status      text default 'vorhanden'
);

create table if not exists public.inventar (
  id              uuid primary key default gen_random_uuid(),
  firma_id        uuid references public.firmen(id) on delete cascade,
  name            text not null,
  kategorie       text,
  einheit         text default 'Stk',
  bestand         numeric default 0,
  mindestbestand  numeric default 0,
  einkaufspreis   numeric default 0,
  lieferant       text,
  erstellt_am     timestamptz default now()
);

create table if not exists public.angebote (
  id          uuid primary key default gen_random_uuid(),
  firma_id    uuid references public.firmen(id) on delete cascade,
  kunde_id    uuid references public.kunden(id) on delete set null,
  auftrag_id  uuid references public.auftraege(id) on delete set null,
  nummer      text,
  titel       text not null,
  status      text default 'entwurf',
  positionen  jsonb default '[]',
  netto       numeric default 0,
  ust         numeric default 0,
  brutto      numeric default 0,
  gueltig_bis date,
  notiz       text,
  erstellt_am timestamptz default now()
);

create table if not exists public.rechnungen (
  id          uuid primary key default gen_random_uuid(),
  firma_id    uuid references public.firmen(id) on delete cascade,
  kunde_id    uuid references public.kunden(id) on delete set null,
  auftrag_id  uuid references public.auftraege(id) on delete set null,
  nummer      text,
  titel       text not null,
  status      text default 'entwurf',
  positionen  jsonb default '[]',
  netto       numeric default 0,
  ust         numeric default 0,
  brutto      numeric default 0,
  faellig_am  date,
  notiz       text,
  erstellt_am timestamptz default now()
);

-- ── Helper-Funktion: firma_id des eingeloggten Users ──────

create or replace function public.meine_firma_id()
returns uuid
language sql
stable
security definer
as $$
  select firma_id from public.profile where id = auth.uid()
$$;

-- ── Row Level Security ─────────────────────────────────────

alter table public.firmen           enable row level security;
alter table public.profile          enable row level security;
alter table public.auftragstypen    enable row level security;
alter table public.kunden           enable row level security;
alter table public.auftraege        enable row level security;
alter table public.zeiteintraege    enable row level security;
alter table public.auftrag_material enable row level security;
alter table public.inventar         enable row level security;
alter table public.angebote         enable row level security;
alter table public.rechnungen       enable row level security;

-- firmen
create policy "own firma" on public.firmen for all
  using (id = meine_firma_id()) with check (id = meine_firma_id());

-- profile
create policy "own firma profiles" on public.profile for all
  using (firma_id = meine_firma_id() or id = auth.uid())
  with check (firma_id = meine_firma_id() or id = auth.uid());

-- alle anderen Tabellen: nur eigene firma_id
create policy "own firma" on public.auftragstypen for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

create policy "own firma" on public.kunden for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

create policy "own firma" on public.auftraege for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

create policy "own firma" on public.inventar for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

create policy "own firma" on public.angebote for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

create policy "own firma" on public.rechnungen for all
  using (firma_id = meine_firma_id()) with check (firma_id = meine_firma_id());

-- zeiteintraege und auftrag_material: via auftrag
create policy "via auftrag" on public.zeiteintraege for all
  using (auftrag_id in (select id from public.auftraege where firma_id = meine_firma_id()))
  with check (auftrag_id in (select id from public.auftraege where firma_id = meine_firma_id()));

create policy "via auftrag" on public.auftrag_material for all
  using (auftrag_id in (select id from public.auftraege where firma_id = meine_firma_id()))
  with check (auftrag_id in (select id from public.auftraege where firma_id = meine_firma_id()));

-- ── Trigger: Auto-Setup bei Registrierung ─────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  fid uuid;
begin
  -- Neue Firma anlegen
  insert into public.firmen (name)
  values (coalesce(new.raw_user_meta_data->>'firma', 'Meine Werkstatt'))
  returning id into fid;

  -- Profil anlegen
  insert into public.profile (id, firma_id, name, rolle, freigegeben)
  values (
    new.id,
    fid,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'admin',
    true
  );

  -- Standard-Auftragstypen
  insert into public.auftragstypen (firma_id, name, farbe, vordefiniert) values
    (fid, 'Fensterrestaurierung', '#b8832a', true),
    (fid, 'Schneidebrett',        '#4a7c59', true),
    (fid, 'Reparatur',            '#2d6a9f', true),
    (fid, 'Sonstiges',            '#666666', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
