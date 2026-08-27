-- Tenant-owned merchant gateway configuration for bKash and Nagad.
-- Sensitive provider credentials are encrypted by the application before storage.

CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('bkash', 'nagad')),
    merchant_name TEXT NOT NULL CHECK (char_length(merchant_name) BETWEEN 1 AND 120),
    merchant_number TEXT NOT NULL CHECK (char_length(merchant_number) BETWEEN 6 AND 40),
    environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    callback_url TEXT,
    credentials_encrypted TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT payment_gateways_user_provider_key UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS payment_gateways_user_active_idx
    ON public.payment_gateways (user_id, is_active);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- This app uses dedicated authenticated server routes with parameterized owner filters.
-- Do not expose encrypted gateway rows through the public Data API.
REVOKE ALL ON TABLE public.payment_gateways FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.payment_gateway_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gateway_id UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('bkash', 'nagad')),
    action TEXT NOT NULL CHECK (action IN ('configured', 'updated', 'deactivated', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_gateway_audit_user_created_idx
    ON public.payment_gateway_audit_logs (user_id, created_at DESC);

ALTER TABLE public.payment_gateway_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_gateway_audit_logs FROM anon, authenticated;

COMMENT ON TABLE public.payment_gateways IS
    'Per-shop bKash and Nagad merchant settings. API credentials must remain application-encrypted.';
COMMENT ON COLUMN public.payment_gateways.credentials_encrypted IS
    'AES-256-GCM encrypted JSON. Never return this column to a browser client.';
