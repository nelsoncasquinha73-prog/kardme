-- Kardme Teams: equipas e pedidos individuais

CREATE TABLE IF NOT EXISTS public.card_order_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  default_language text NOT NULL DEFAULT 'en',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_order_team_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.card_order_teams(id),
  language text NOT NULL DEFAULT 'en',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_order_team_requests_team
ON public.card_order_team_requests(team_id);

CREATE INDEX IF NOT EXISTS idx_card_order_team_requests_created
ON public.card_order_team_requests(created_at DESC);

ALTER TABLE public.card_order_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_order_team_requests ENABLE ROW LEVEL SECURITY;

-- Sem políticas públicas: acesso apenas por serviços autorizados.
-- As APIs deverão verificar permissões e validar os dados.

INSERT INTO public.card_order_teams
  (slug, name, default_language)
VALUES
  ('orygn-italia', 'ORYGN Italia', 'it')
ON CONFLICT (slug) DO NOTHING;
