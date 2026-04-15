-- Adicionar campos de licença/subscrição aos embaixadores

ALTER TABLE ambassadors
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activated_by TEXT DEFAULT 'stripe', -- 'stripe' ou 'admin'
ADD COLUMN IF NOT EXISTS admin_grant_reason TEXT;

-- Preencher embaixadores existentes com admin_override
UPDATE ambassadors
SET 
  activated_at = COALESCE(activated_at, now()),
  current_period_end = COALESCE(current_period_end, now() + INTERVAL '1 year'),
  activated_by = CASE WHEN is_admin_override THEN 'admin' ELSE 'stripe' END
WHERE is_admin_override = true AND activated_at IS NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ambassadors_subscription_status ON ambassadors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_ambassadors_current_period_end ON ambassadors(current_period_end);
