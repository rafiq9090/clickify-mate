-- Add Stripe Checkout to the tenant-owned hosted payment architecture.
-- Existing encrypted credential and private payment-table controls remain unchanged.

ALTER TABLE public.payment_gateways
  DROP CONSTRAINT IF EXISTS payment_gateways_provider_check;
ALTER TABLE public.payment_gateways
  ADD CONSTRAINT payment_gateways_provider_check CHECK (provider IN ('bkash', 'nagad', 'stripe'));

ALTER TABLE public.payment_gateway_audit_logs
  DROP CONSTRAINT IF EXISTS payment_gateway_audit_logs_provider_check;
ALTER TABLE public.payment_gateway_audit_logs
  ADD CONSTRAINT payment_gateway_audit_logs_provider_check CHECK (provider IN ('bkash', 'nagad', 'stripe'));

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS payment_attempts_provider_check;
ALTER TABLE public.payment_attempts
  ADD CONSTRAINT payment_attempts_provider_check CHECK (provider IN ('bkash', 'nagad', 'stripe'));

ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_provider_check CHECK (provider IN ('bkash', 'nagad', 'stripe'));

ALTER TABLE public.payment_webhook_events
  DROP CONSTRAINT IF EXISTS payment_webhook_events_provider_check;
ALTER TABLE public.payment_webhook_events
  ADD CONSTRAINT payment_webhook_events_provider_check CHECK (provider IN ('bkash', 'nagad', 'stripe'));

COMMENT ON TABLE public.payment_gateways IS
  'Per-shop bKash, Nagad, and Stripe merchant settings. API credentials must remain application-encrypted.';
