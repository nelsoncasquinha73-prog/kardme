-- Inserir plano Founder (se não existir)
INSERT INTO plans (id, name, slug, price_monthly_eur, price_yearly_eur, features, is_active, created_at)
VALUES (
  'founder-plan',
  'Founder',
  'founder',
  0,
  0,
  jsonb_build_object(
    'ambassadors', -1,
    'cards', -1,
    'crm_pro', true,
    'email_marketing', true,
    'analytics', true,
    'lead_magnets', true,
    'nfc_cards', true
  ),
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  features = jsonb_build_object(
    'ambassadors', -1,
    'cards', -1,
    'crm_pro', true,
    'email_marketing', true,
    'analytics', true,
    'lead_magnets', true,
    'nfc_cards', true
  );

-- Atribuir plano Founder ao teu utilizador (substitui o email)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{plan}',
  '"founder"'::jsonb
)
WHERE email = 'nelson@kardme.com';

-- Criar/atualizar subscription
INSERT INTO user_subscriptions (user_id, plan_id, status, started_at)
SELECT id, 'founder-plan', 'active', now()
FROM auth.users
WHERE email = 'admin@kardme.com'
ON CONFLICT (user_id) DO UPDATE SET
  plan_id = 'founder-plan',
  status = 'active';
