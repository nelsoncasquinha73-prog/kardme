CREATE TABLE IF NOT EXISTS public.email_test_sends (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_test_sends_user_created_idx
  ON public.email_test_sends (user_id, created_at DESC);

ALTER TABLE public.email_test_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_test_sends
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON SEQUENCE public.email_test_sends_id_seq
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_email_test_send(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 20261102)
  );

  SELECT count(*) INTO v_count
  FROM public.email_test_sends
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 hour';

  IF v_count >= 10 THEN
    RETURN false;
  END IF;

  INSERT INTO public.email_test_sends (user_id)
  VALUES (p_user_id);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_email_test_send(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_email_test_send(uuid)
  TO service_role;
