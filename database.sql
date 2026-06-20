-- Create Generations table to store AI results
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    topic TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Leads table to store captured contact information
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email TEXT NOT NULL,
    source TEXT, -- e.g. the topic or lead magnet type
    data JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable insert for all users" ON public.generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON public.generations FOR SELECT USING (true);

CREATE POLICY "Enable select for all users" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to update their own leads" ON public.leads FOR UPDATE TO authenticated USING ((data->>'user_id') = (auth.uid())::text) WITH CHECK ((data->>'user_id') = (auth.uid())::text);
CREATE POLICY "Allow authenticated users to delete their own leads" ON public.leads FOR DELETE TO authenticated USING ((data->>'user_id') = (auth.uid())::text);

-- Create Blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT,
    image TEXT,
    date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all users" ON public.blogs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON public.blogs FOR SELECT USING (true);
 
-- Create Templates table (Sync with UI)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'msg',
    category TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Trends table (Sync with UI)
CREATE TABLE IF NOT EXISTS public.trends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    keyword TEXT NOT NULL,
    volume TEXT,
    growth TEXT,
    difficulty TEXT DEFAULT 'Easy',
    rank INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Navigation table (Sync with UI)
CREATE TABLE IF NOT EXISTS public.navigation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Ads table (Sync with UI)
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    label TEXT NOT NULL,
    "isEnabled" BOOLEAN DEFAULT true,
    code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    adsense_pub_id TEXT,
    adsense_code TEXT,
    google_analytics_id TEXT,
    site_name TEXT,
    google_search_console_id TEXT,
    bing_webmaster_id TEXT,
    yandex_webmaster_id TEXT,
    groq_api_key TEXT,
    gemini_api_key TEXT,
    tinyurl_api_token TEXT,
    supabase_url TEXT,
    supabase_key TEXT,
    supabase_service_role_key TEXT
);

-- Seed with one row if empty
INSERT INTO public.settings (site_name) 
SELECT 'My Toolkit' WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- Enable RLS for all new tables
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Creating global select/insert policies
CREATE POLICY "Enable all for all templates" ON public.templates FOR ALL USING (true);
CREATE POLICY "Enable all for all trends" ON public.trends FOR ALL USING (true);
CREATE POLICY "Enable all for all navigation" ON public.navigation FOR ALL USING (true);
CREATE POLICY "Enable all for all ads" ON public.ads FOR ALL USING (true);
-- Create Visitors Analytics table
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id TEXT UNIQUE NOT NULL,
    current_path TEXT,
    tools_used JSONB DEFAULT '[]'::jsonb,
    time_spent_seconds INTEGER DEFAULT 0,
    ip_address TEXT,
    city TEXT,
    country TEXT,
    os TEXT,
    browser TEXT,
    device TEXT DEFAULT 'Desktop',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for visitors
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all visitors" ON public.visitors FOR ALL USING (true);

-- Create Agent Configurations for secure social media connection
CREATE TABLE IF NOT EXISTS public.agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Link to a future Auth system
    platform TEXT NOT NULL, -- 'telegram', 'whatsapp', 'messenger'
    external_id TEXT, -- Page ID, Bot ID, etc.
    is_active BOOLEAN DEFAULT false,
    encrypted_token TEXT, -- API Keys/Tokens encrypted
    agent_behavior JSONB DEFAULT '{ "tone": "Professional", "auto_reply": true }'::jsonb,
    knowledge TEXT DEFAULT '',
    product_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation Memory (Chat History)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agent_configs(id) ON DELETE CASCADE,
    user_external_id TEXT NOT NULL, -- Platform specific user ID (Chat ID, Sender ID, Phone)
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup of recent messages
CREATE INDEX IF NOT EXISTS idx_chat_history_lookup ON public.chat_history (agent_id, user_external_id, created_at DESC);

-- Enable RLS for agent configs
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
-- Note: In production, this should restricted to owner only (auth.uid())
CREATE POLICY "Enable all for all agent_configs" ON public.agent_configs FOR ALL USING (true);

-- Create Token Usage Table
CREATE TABLE IF NOT EXISTS public.token_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id TEXT,
    ip_address TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    model TEXT,
    feature TEXT
);

-- Enable RLS for token usage
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for token_usage" ON public.token_usage FOR ALL USING (true);

-- Daily summary view
CREATE OR REPLACE VIEW public.token_usage_by_day AS
SELECT 
    (created_at AT TIME ZONE 'UTC')::date AS usage_date,
    COUNT(*) AS request_count,
    SUM(prompt_tokens)::integer AS total_prompt_tokens,
    SUM(completion_tokens)::integer AS total_completion_tokens,
    SUM(total_tokens)::integer AS total_tokens
FROM public.token_usage
GROUP BY 1
ORDER BY 1 DESC;

-- Feature usage summary view
CREATE OR REPLACE VIEW public.token_usage_by_feature AS
SELECT 
    feature,
    COUNT(*) AS request_count,
    SUM(total_tokens)::integer AS total_tokens
FROM public.token_usage
GROUP BY 1
ORDER BY total_tokens DESC;

-- Session/Visitor summary view
CREATE OR REPLACE VIEW public.token_usage_by_session AS
SELECT 
    tu.session_id,
    COALESCE(v.ip_address, tu.ip_address, 'Unknown') AS ip_address,
    COALESCE(v.city, 'Unknown') AS city,
    COALESCE(v.country, 'Unknown') AS country,
    COUNT(*) AS request_count,
    SUM(total_tokens)::integer AS total_tokens,
    MAX(tu.created_at) AS last_active_at
FROM public.token_usage tu
LEFT JOIN public.visitors v ON tu.session_id = v.session_id
GROUP BY 1, 2, 3, 4
ORDER BY total_tokens DESC;

-- Monthly summary view for last 1 year
CREATE OR REPLACE VIEW public.token_usage_by_month AS
SELECT 
    date_trunc('month', created_at)::date AS usage_month,
    COUNT(*) AS request_count,
    SUM(prompt_tokens)::integer AS total_prompt_tokens,
    SUM(completion_tokens)::integer AS total_completion_tokens,
    SUM(total_tokens)::integer AS total_tokens
FROM public.token_usage
WHERE created_at >= now() - INTERVAL '1 year'
GROUP BY 1
ORDER BY 1 DESC;

-- Weekly summary view for last 1 year
CREATE OR REPLACE VIEW public.token_usage_by_week AS
SELECT 
    date_trunc('week', created_at)::date AS usage_week,
    COUNT(*) AS request_count,
    SUM(prompt_tokens)::integer AS total_prompt_tokens,
    SUM(completion_tokens)::integer AS total_completion_tokens,
    SUM(total_tokens)::integer AS total_tokens
FROM public.token_usage
WHERE created_at >= now() - INTERVAL '1 year'
GROUP BY 1
ORDER BY 1 DESC;


