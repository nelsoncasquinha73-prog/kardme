-- Kardme Teams: complemento da migracao inicial 202610280001_card_order_teams.sql
-- Gerado a partir de definicoes exportadas do Supabase em 28/10/2026.
-- Para aplicar apenas em bases que ja tenham a migracao inicial e public.card_orders.
-- NAO executar no Supabase de producao atual: os objetos ja existem.
-- Rever grants de funcoes e permissoes antes de aplicar a uma nova base.

ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'pendente'::text NOT NULL;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS email_error text;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS encrypted_access_token text;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS resend_email_id text;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS email_attempts integer DEFAULT 0 NOT NULL;
ALTER TABLE public.card_order_team_requests ADD COLUMN IF NOT EXISTS email_last_attempt_at timestamptz;

CREATE TABLE IF NOT EXISTS public.card_order_access_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  team_request_id uuid,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_access_tokens_pkey' AND conrelid = 'public.card_order_access_tokens'::regclass) THEN ALTER TABLE public.card_order_access_tokens ADD CONSTRAINT card_order_access_tokens_pkey PRIMARY KEY (id); END IF; END $ddl$;
ALTER TABLE public.card_order_access_tokens ENABLE ROW LEVEL SECURITY;

DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_access_tokens_order_id_fkey' AND conrelid = 'public.card_order_access_tokens'::regclass) THEN ALTER TABLE public.card_order_access_tokens ADD CONSTRAINT card_order_access_tokens_order_id_fkey FOREIGN KEY (order_id) REFERENCES card_orders(id) ON DELETE CASCADE; END IF; END $ddl$;
DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_access_tokens_team_request_id_fkey' AND conrelid = 'public.card_order_access_tokens'::regclass) THEN ALTER TABLE public.card_order_access_tokens ADD CONSTRAINT card_order_access_tokens_team_request_id_fkey FOREIGN KEY (team_request_id) REFERENCES card_order_team_requests(id) ON DELETE SET NULL; END IF; END $ddl$;
DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_access_tokens_token_hash_key' AND conrelid = 'public.card_order_access_tokens'::regclass) THEN ALTER TABLE public.card_order_access_tokens ADD CONSTRAINT card_order_access_tokens_token_hash_key UNIQUE (token_hash); END IF; END $ddl$;
DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_team_requests_order_id_fkey' AND conrelid = 'public.card_order_team_requests'::regclass) THEN ALTER TABLE public.card_order_team_requests ADD CONSTRAINT card_order_team_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES card_orders(id); END IF; END $ddl$;
DO $ddl$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_order_team_requests_team_id_fkey' AND conrelid = 'public.card_order_team_requests'::regclass) THEN ALTER TABLE public.card_order_team_requests ADD CONSTRAINT card_order_team_requests_team_id_fkey FOREIGN KEY (team_id) REFERENCES card_order_teams(id); END IF; END $ddl$;

CREATE INDEX IF NOT EXISTS idx_card_order_access_order ON public.card_order_access_tokens USING btree (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_order_tokens_unique_team_request ON public.card_order_access_tokens USING btree (team_request_id) WHERE (team_request_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_card_order_team_requests_created ON public.card_order_team_requests USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_order_team_requests_idempotency ON public.card_order_team_requests USING btree (team_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_card_order_team_requests_team ON public.card_order_team_requests USING btree (team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_requests_idempotency ON public.card_order_team_requests USING btree (team_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_requests_unique_order ON public.card_order_team_requests USING btree (order_id) WHERE (order_id IS NOT NULL);

-- RPCs: definicoes exportadas, sem alteracoes funcionais.

CREATE OR REPLACE FUNCTION public.claim_team_order_email(p_request_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_claimed uuid;
BEGIN
  UPDATE public.card_order_team_requests
  SET
    email_status = 'a_enviar',
    email_error = NULL
  WHERE id = p_request_id
    AND email_status = 'pendente'
  RETURNING id INTO v_claimed;

  RETURN v_claimed IS NOT NULL;
END;
$function$

CREATE OR REPLACE FUNCTION public.create_team_card_order(p_team_id uuid, p_language text, p_name text, p_email text, p_phone text, p_idempotency_key uuid, p_order_slug text, p_token_hash text, p_expires_at timestamp with time zone, p_encrypted_token text)
 RETURNS TABLE(request_id uuid, order_id uuid, order_slug text, created boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_request_id uuid;
  v_order_id uuid;
  v_slug text;
  v_existing record;
BEGIN
  IF p_idempotency_key IS NULL
     OR p_team_id IS NULL
     OR p_order_slug IS NULL
     OR p_token_hash !~ '^[a-f0-9]{64}$'
     OR p_expires_at IS NULL
     OR p_expires_at <= now()
     OR p_encrypted_token IS NULL
     OR length(p_encrypted_token) = 0 THEN
    RAISE EXCEPTION 'Invalid request parameters';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_team_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  SELECT r.id, r.order_id, o.slug,
         r.name, r.email, r.phone, r.language
  INTO v_existing
  FROM public.card_order_team_requests r
  LEFT JOIN public.card_orders o ON o.id = r.order_id
  WHERE r.team_id = p_team_id
    AND r.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.name IS DISTINCT FROM p_name
       OR v_existing.email IS DISTINCT FROM p_email
       OR v_existing.phone IS DISTINCT FROM p_phone
       OR v_existing.language IS DISTINCT FROM p_language
    THEN
      RAISE EXCEPTION 'Idempotency key reused with different data'
        USING ERRCODE = '23505';
    END IF;

    RETURN QUERY SELECT
      v_existing.id,
      v_existing.order_id,
      v_existing.slug,
      false;
    RETURN;
  END IF;

  INSERT INTO public.card_orders (
    slug, nome, email, telefone, status
  )
  VALUES (
    p_order_slug, p_name, p_email, p_phone, 'rascunho'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.card_order_team_requests (
    team_id, language, name, email, phone,
    order_id, idempotency_key,
    encrypted_access_token, email_status
  )
  VALUES (
    p_team_id, p_language, p_name, p_email, p_phone,
    v_order_id, p_idempotency_key,
    p_encrypted_token, 'pendente'
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.card_order_access_tokens (
    order_id, team_request_id, token_hash, expires_at
  )
  VALUES (
    v_order_id, v_request_id, p_token_hash, p_expires_at
  );

  RETURN QUERY SELECT
    v_request_id, v_order_id, p_order_slug, true;
END;
$function$

-- IMPORTANTE: confirmar EXECUTE grants das RPCs no ambiente de destino.
-- A API usa service_role. Nao conceder EXECUTE a anon/authenticated sem revisao.
