-- Registo de declarações aceites na importação CSV
CREATE TABLE IF NOT EXISTS public.crm_csv_import_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL,
  declaration_version text NOT NULL,
  declaration_text text NOT NULL,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN (
      'processing',
      'completed',
      'completed_with_errors',
      'interrupted'
    )),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  imported_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crm_csv_import_declarations_user
  ON public.crm_csv_import_declarations(user_id, accepted_at DESC);

ALTER TABLE public.crm_csv_import_declarations
  ENABLE ROW LEVEL SECURITY;

-- Sem políticas de acesso direto:
-- leitura e escrita apenas através do servidor autorizado.
