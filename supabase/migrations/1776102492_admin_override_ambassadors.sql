-- Admin override para embaixadores (criar/ativar sem pagamento) para admin@kardme.com

-- 1) Colunas necessárias
ALTER TABLE ambassadors
ADD COLUMN IF NOT EXISTS is_admin_override BOOLEAN DEFAULT false;

ALTER TABLE ambassadors
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- 2) Ativar já os embaixadores existentes desse user
UPDATE ambassadors
SET subscription_status = 'active',
    is_admin_override = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@kardme.com');

-- 3) Trigger: sempre que esse user criar um embaixador, fica logo ativo e com override
CREATE OR REPLACE FUNCTION public.set_ambassador_admin_override()
RETURNS trigger
LANGUAGE plpgsql
AS 39356
DECLARE
  v_admin_user_id uuid;
BEGIN
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'admin@kardme.com'
  LIMIT 1;

  IF NEW.user_id = v_admin_user_id THEN
    NEW.is_admin_override := true;
    NEW.subscription_status := 'active';
  END IF;

  RETURN NEW;
END;
39356;

DROP TRIGGER IF EXISTS trg_set_ambassador_admin_override ON public.ambassadors;

CREATE TRIGGER trg_set_ambassador_admin_override
BEFORE INSERT ON public.ambassadors
FOR EACH ROW
EXECUTE FUNCTION public.set_ambassador_admin_override();
