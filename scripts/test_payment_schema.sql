\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
    test_user UUID := gen_random_uuid();
    test_gateway UUID := gen_random_uuid();
    test_order_one UUID := gen_random_uuid();
    test_order_two UUID := gen_random_uuid();
    test_attempt_one UUID := gen_random_uuid();
    test_attempt_two UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.users (id, email, password_hash)
    VALUES (test_user, 'payment-schema-test@example.invalid', 'not-a-real-password');

    INSERT INTO public.payment_gateways (
        id, user_id, provider, merchant_name, merchant_number, environment, is_active
    ) VALUES (
        test_gateway, test_user, 'bkash', 'Schema Test', '01700000000', 'sandbox', true
    );

    INSERT INTO public.leads (id, email, source, data) VALUES
      (test_order_one, 'payment-order-one@example.invalid', 'schema_test', jsonb_build_object('user_id', test_user, 'total', 100)),
      (test_order_two, 'payment-order-two@example.invalid', 'schema_test', jsonb_build_object('user_id', test_user, 'total', 100));

    INSERT INTO public.payment_attempts (
        id, order_id, user_id, gateway_id, provider, amount, currency,
        idempotency_key, provider_payment_id, status
    ) VALUES
      (test_attempt_one, test_order_one, test_user, test_gateway, 'bkash', 100, 'BDT', 'schema-test-attempt-one', 'PAY-ONE', 'completed'),
      (test_attempt_two, test_order_two, test_user, test_gateway, 'bkash', 100, 'BDT', 'schema-test-attempt-two', 'PAY-TWO', 'completed');

    INSERT INTO public.payment_transactions (
        attempt_id, order_id, user_id, gateway_id, provider,
        provider_payment_id, provider_transaction_id, amount, currency
    ) VALUES (
        test_attempt_one, test_order_one, test_user, test_gateway, 'bkash',
        'PAY-ONE', 'DUPLICATE-TRX-GUARD', 100, 'BDT'
    );

    BEGIN
        INSERT INTO public.payment_transactions (
            attempt_id, order_id, user_id, gateway_id, provider,
            provider_payment_id, provider_transaction_id, amount, currency
        ) VALUES (
            test_attempt_two, test_order_two, test_user, test_gateway, 'bkash',
            'PAY-TWO', 'DUPLICATE-TRX-GUARD', 100, 'BDT'
        );
        RAISE EXCEPTION 'duplicate provider transaction ID was accepted';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.payment_attempts (
            order_id, user_id, gateway_id, provider, amount, currency, idempotency_key
        ) VALUES (
            test_order_two, test_user, test_gateway, 'bkash', -1, 'BDT', 'schema-test-invalid-amount'
        );
        RAISE EXCEPTION 'negative payment amount was accepted';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;
END
$$;

ROLLBACK;
