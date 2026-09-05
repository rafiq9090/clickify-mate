# Hosted bKash, Nagad, and Stripe payments

## Production requirements

Set these on the Nuxt server (never in public runtime config):

```env
PAYMENT_PUBLIC_BASE_URL=https://pay.example.com
PAYMENT_SERVER_IPV4=203.0.113.10
AGENT_ENCRYPTION_KEY=<64-character-hex-key>
PAYMENT_CREDENTIALS_KEY=<different-64-character-hex-key>
DATABASE_URL=<postgres-connection-string>
JWT_SECRET=<strong-random-secret>
```

`PAYMENT_PUBLIC_BASE_URL` must be an HTTPS origin reachable by payment providers. Register or whitelist the generated callback/webhook paths and the server IPv4 where required.

## Merchant setup

Each shop owner opens **Dashboard → Payment Gateways** and configures their own account.

- bKash: merchant number, API username/password, app key and app secret.
- Nagad: merchant ID, merchant account number, merchant private key and Nagad public key.
- Stripe: Stripe account ID, secret API key, and webhook signing secret. Test mode requires `sk_test_`; live mode requires `sk_live_`.
- SSLCOMMERZ: store ID and store password (API key). Test mode supports `testbox`/`qwerty`.
- Start in `sandbox`, run a full checkout, and switch to `production` only after the provider approves the callback URL and server IP.

For Stripe, register `https://<PAYMENT_PUBLIC_BASE_URL>/api/payments/webhook/stripe` in Stripe Workbench and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Credentials are AES-256-GCM encrypted with the dedicated `PAYMENT_CREDENTIALS_KEY`; do not reuse the agent-token key. Payment tables are inaccessible to the `anon` and `authenticated` database roles.

## Runtime flow

1. The agent calls `create_order` with `paymentProvider=bkash`, `paymentProvider=nagad`, `paymentProvider=stripe`, or `paymentProvider=sslcommerz`.
2. The order is stored as `pending_payment`; stock is not deducted and courier is not called.
3. The server creates a `payment_attempt` and provider checkout session.
4. The agent sends the returned `checkoutUrl` to the customer.
5. bKash/Nagad/SSLCOMMERZ redirect to the attempt-specific callback; Stripe sends a signed webhook and redirects the customer to the public result page.
6. The server treats callbacks/webhooks only as triggers and queries the payment through the merchant API.
7. Amount, currency, provider payment ID, completed status and unique transaction ID must all match.
8. A database transaction inserts the immutable payment transaction and marks the order paid/confirmed.
9. Inventory is claimed idempotently; courier work is queued only after inventory succeeds.
10. The reconciliation runner queries pending payments every minute and retries paid-order fulfillment.

## Server routes

```text
POST /api/payments/checkout
GET  /api/payments/callback/bkash/:token
GET  /api/payments/callback/nagad/:token
GET  /api/payments/callback/sslcommerz/:token
POST /api/payments/callback/bkash/:token
POST /api/payments/callback/nagad/:token
POST /api/payments/callback/sslcommerz/:token
POST /api/payments/webhook/stripe
GET  /api/payments/status/:token
GET  /payment/result?token=:token
```

The checkout endpoint requires a dashboard session and verifies order ownership. Callback/status tokens are random UUIDs. The result page exposes only provider, invoice, amount, currency and payment state.

## Database migration

Apply migrations in timestamp order:

```text
supabase/migrations/20260820000000_add_payment_gateways.sql
supabase/migrations/20260820082635_add_hosted_payment_flow.sql
supabase/migrations/20260824000000_add_stripe_gateway.sql
```

For a fresh Docker database, `docker-compose.yml` installs the base schema and hosted-payment migration automatically. Existing databases must apply both migration files explicitly.

## Sandbox acceptance test

1. Configure one shop owner and active sandbox gateway.
2. Create an order through an agent with the selected payment provider.
3. Confirm the order remains `pending_payment` before checkout.
4. Open the returned provider URL and complete the sandbox payment.
5. Confirm exactly one `payment_transactions` row exists.
6. Confirm `payment_attempts.status = completed`.
7. Confirm the lead JSON has `payment_status=paid`, `status=confirmed`, and the provider transaction ID.
8. Repeat the callback and confirm no second transaction, stock deduction, or courier order is created.
9. Test cancel, failure, timeout, wrong amount and disabled-gateway cases.

Typed transaction IDs and screenshots never confirm an order. They are retained only as manual-review evidence.
