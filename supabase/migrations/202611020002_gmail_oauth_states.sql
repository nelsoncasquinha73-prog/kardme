CREATE TABLE IF NOT EXISTS public.gmail_oauth_states (
  state_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gmail_oauth_states_expires_idx
  ON public.gmail_oauth_states (expires_at);

ALTER TABLE public.gmail_oauth_states ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.gmail_oauth_states
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_gmail_oauth_state(
  p_state_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  DELETE FROM public.gmail_oauth_states
  WHERE state_hash = p_state_hash
    AND expires_at > now()
  RETURNING user_id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_gmail_oauth_state(text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_gmail_oauth_state(text)
  TO service_role;
