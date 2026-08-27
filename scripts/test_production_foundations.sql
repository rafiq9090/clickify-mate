\set ON_ERROR_STOP on

DO $$
DECLARE missing_tables text[];
DECLARE permissive_count integer;
DECLARE exposed_count integer;
BEGIN
  SELECT array_agg(expected.name)
    INTO missing_tables
  FROM unnest(ARRAY[
    'shops','shop_members','auth_login_attempts','auth_password_reset_tokens','customers','products',
    'product_variants','inventory_movements','orders','order_items','shipments','payment_refunds',
    'conversations','conversation_notes','integration_connections','merchant_subscriptions','audit_logs'
  ]) AS expected(name)
  WHERE to_regclass('public.' || expected.name) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing production tables: %', missing_tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'session_version'
  ) THEN
    RAISE EXCEPTION 'users.session_version is missing';
  END IF;

  SELECT count(*) INTO permissive_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY(ARRAY[
      'users','generations','leads','blogs','templates','trends','navigation','ads','settings',
      'visitors','agent_configs','chat_history','token_usage','user_api_keys','webhook_events','knowledge_gaps'
    ])
    AND (qual = 'true' OR with_check = 'true');

  IF permissive_count > 0 THEN
    RAISE EXCEPTION 'Found % permissive production RLS policies', permissive_count;
  END IF;

  SELECT count(*) INTO exposed_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND table_name = ANY(ARRAY[
      'users','leads','agent_configs','user_api_keys','payment_gateways','payment_attempts',
      'payment_transactions','auth_password_reset_tokens','orders','order_items','audit_logs'
    ]);

  IF exposed_count > 0 THEN
    RAISE EXCEPTION 'Found % direct browser grants on private tables', exposed_count;
  END IF;
END $$;

SELECT 'production foundation schema checks passed' AS result;
