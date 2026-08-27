-- Hosted checkout payment state for tenant-owned bKash and Nagad gateways.
-- All access is server-side; browser roles must not read provider identifiers,
-- callback tokens, raw responses, or webhook payloads directly.

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK (provider IN ('bkash', 'nagad')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'BDT' CHECK (currency ~ '^[A-Z]{3}$'),
    status TEXT NOT NULL DEFAULT 'created' CHECK (
        status IN ('created', 'pending', 'completed', 'failed', 'cancelled', 'expired')
    ),
    idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 200),
    callback_token UUID NOT NULL DEFAULT gen_random_uuid(),
    provider_payment_id TEXT,
    provider_transaction_id TEXT,
    checkout_url TEXT,
    provider_status TEXT,
    provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    failure_code TEXT,
    failure_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT payment_attempts_gateway_idempotency_key UNIQUE (gateway_id, idempotency_key),
    CONSTRAINT payment_attempts_callback_token_key UNIQUE (callback_token)
);

CREATE INDEX IF NOT EXISTS payment_attempts_order_created_idx
    ON public.payment_attempts (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_attempts_user_status_idx
    ON public.payment_attempts (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_attempts_gateway_provider_payment_idx
    ON public.payment_attempts (gateway_id, provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_transaction_key
    ON public.payment_attempts (provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_attempts FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL UNIQUE REFERENCES public.payment_attempts(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK (provider IN ('bkash', 'nagad')),
    provider_payment_id TEXT NOT NULL,
    provider_transaction_id TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (
        status IN ('completed', 'partially_refunded', 'refunded')
    ),
    provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_provider_transaction_key
    ON public.payment_transactions (provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS payment_transactions_user_created_idx
    ON public.payment_transactions (user_id, created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_transactions FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('bkash', 'nagad')),
    gateway_id UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
    attempt_id UUID REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
    external_event_id TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL CHECK (char_length(payload_sha256) = 64),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'received' CHECK (
        status IN ('received', 'processing', 'processed', 'ignored', 'failed')
    ),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT payment_webhook_events_provider_event_key UNIQUE (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_attempt_received_idx
    ON public.payment_webhook_events (attempt_id, received_at DESC);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_webhook_events FROM anon, authenticated;

COMMENT ON TABLE public.payment_attempts IS
    'One idempotent hosted-checkout attempt for an order. Provider callbacks are only triggers; completion requires a provider API query.';
COMMENT ON TABLE public.payment_transactions IS
    'Immutable successful provider transactions used for reconciliation and duplicate transaction prevention.';
COMMENT ON TABLE public.payment_webhook_events IS
    'Deduplicated callback/webhook audit events. Payloads are private server data.';
