-- ═══════════════════════════════════════════════════════════
-- Werkstatt Pro – Sprint 1 Migrations
-- Supabase SQL Editor: New query → paste → Run
-- ═══════════════════════════════════════════════════════════

-- ── Neue Spalten ──────────────────────────────────────────

-- Einladungscode pro Firma
ALTER TABLE public.firmen
  ADD COLUMN IF NOT EXISTS invite_code text;
UPDATE public.firmen
  SET invite_code = gen_random_uuid()::text
  WHERE invite_code IS NULL;

-- E-Mail im Profil (für Nutzer-Anzeige)
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS email text;

-- Letzter Login
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Mitarbeiter-Zuweisung in Aufträgen
ALTER TABLE public.auftraege
  ADD COLUMN IF NOT EXISTS zugewiesen_an uuid
  REFERENCES public.profile(id) ON DELETE SET NULL;

-- ── Trigger aktualisieren (mit E-Mail) ────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fid      uuid;
  user_uid uuid;
BEGIN
  user_uid := (row_to_json(NEW)->>'id')::uuid;

  INSERT INTO public.firmen (name)
  VALUES (coalesce(NEW.raw_user_meta_data->>'firma', 'Meine Werkstatt'))
  RETURNING id INTO fid;

  INSERT INTO public.profile (id, firma_id, name, rolle, freigegeben, email)
  VALUES (
    user_uid,
    fid,
    coalesce(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'admin',
    true,
    NEW.email
  );

  INSERT INTO public.auftragstypen (firma_id, name, farbe, vordefiniert) VALUES
    (fid, 'Fensterrestaurierung', '#b8832a', true),
    (fid, 'Schneidebrett',        '#4a7c59', true),
    (fid, 'Reparatur',            '#2d6a9f', true),
    (fid, 'Sonstiges',            '#666666', true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Firma beitreten (Security Definer Funktion) ───────────

CREATE OR REPLACE FUNCTION public.join_firma(code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_id uuid;
  old_id    uuid;
  caller_id uuid;
BEGIN
  caller_id := auth.uid();

  SELECT id INTO target_id FROM public.firmen WHERE invite_code = code;
  IF target_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Ungültiger Einladungscode');
  END IF;

  SELECT firma_id INTO old_id FROM public.profile WHERE id = caller_id;

  IF target_id = old_id THEN
    RETURN jsonb_build_object('error', 'Du bist bereits Mitglied dieser Firma');
  END IF;

  UPDATE public.profile
    SET firma_id = target_id, freigegeben = false
    WHERE id = caller_id;

  IF old_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profile WHERE firma_id = old_id AND id != caller_id
    ) THEN
      DELETE FROM public.firmen WHERE id = old_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── Einladungscode neu generieren ─────────────────────────

CREATE OR REPLACE FUNCTION public.regenerate_invite_code()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code text;
  fid      uuid;
BEGIN
  SELECT firma_id INTO fid FROM public.profile WHERE id = auth.uid();
  new_code := gen_random_uuid()::text;
  UPDATE public.firmen SET invite_code = new_code WHERE id = fid;
  RETURN new_code;
END;
$$;
