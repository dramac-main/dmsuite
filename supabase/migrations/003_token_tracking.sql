-- ── Token tracking for credit transactions ──
-- Tracks actual AI token usage + real USD cost per transaction
-- Enables margin analytics and token-aligned pricing

ALTER TABLE public.credit_transactions 
  ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS api_cost_usd numeric(10,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_value_usd numeric(10,6) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_type_created 
  ON public.credit_transactions(type, created_at DESC);
