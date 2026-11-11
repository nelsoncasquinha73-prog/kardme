-- Additive only: no backfill, no changes to public titles or existing records.
ALTER TABLE public.lead_magnets
  ADD COLUMN IF NOT EXISTS internal_name text NULL;
