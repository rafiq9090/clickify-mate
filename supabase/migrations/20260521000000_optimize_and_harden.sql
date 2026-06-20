-- Migrate: Optimize and Harden Database Schema for Production and High Scaling

-- 1. Create covering index on generations.user_id for optimized joins and lookups
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations (user_id);

-- 2. Drop insecure loose public insert RLS policies (handled securely server-side)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.generations;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.blogs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.analytics;

-- 3. Drop redundant / insecure permissive policies on agent_configs
DROP POLICY IF EXISTS "Users can view their own agents" ON public.agent_configs;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agent_configs;
DROP POLICY IF EXISTS "Allow admin update" ON public.agent_configs;
DROP POLICY IF EXISTS "Allow admin delete" ON public.agent_configs;

-- 4. Hardened/Optimized RLS Policies using cached (SELECT auth.uid()) & (SELECT auth.role())

-- Optimize agent_configs RLS policies
DROP POLICY IF EXISTS "Allow users to manage their own configs" ON public.agent_configs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.agent_configs;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.agent_configs;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.agent_configs;

CREATE POLICY "Allow authenticated insert" ON public.agent_configs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Allow authenticated update" ON public.agent_configs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Allow authenticated delete" ON public.agent_configs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Optimize chat_history RLS policies
DROP POLICY IF EXISTS "Users can view their own chat history" ON public.chat_history;
CREATE POLICY "Users can view their own chat history" ON public.chat_history
  FOR SELECT USING (((SELECT auth.uid())::text) = user_external_id);

DROP POLICY IF EXISTS "Users can insert their own chat history" ON public.chat_history;
CREATE POLICY "Users can insert their own chat history" ON public.chat_history
  FOR INSERT WITH CHECK (((SELECT auth.uid())::text) = user_external_id);

-- Optimize generations RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.generations;
CREATE POLICY "Enable insert for authenticated users only" ON public.generations
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

