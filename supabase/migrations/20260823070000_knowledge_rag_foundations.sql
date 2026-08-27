-- Migration: Production Multi-Tenant RAG, Hybrid Search & Knowledge Foundations
-- Supports vector embeddings (pgvector if enabled) + tsvector full-text keyword search

BEGIN;

-- 1. Try enabling pgvector extension (if installed/permitted on the PostgreSQL server)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector extension not installed or not supported on this PostgreSQL instance. Proceeding with tsvector hybrid search.';
END $$;

-- 2. Knowledge Documents (High-level policies, FAQ articles, product catalogs, guides)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agent_configs(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('policy', 'faq', 'product_spec', 'sizing_guide', 'care_instructions', 'warranty', 'shipping_rules', 'general')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  source_id TEXT, -- e.g. product_id, knowledge_gap_id, or manual doc slug
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unq_shop_doc_source UNIQUE (shop_id, doc_type, source_id)
);

CREATE INDEX IF NOT EXISTS knowledge_docs_shop_type_idx ON public.knowledge_documents (shop_id, doc_type, is_active);
CREATE INDEX IF NOT EXISTS knowledge_docs_agent_idx ON public.knowledge_documents (agent_id) WHERE agent_id IS NOT NULL;

-- 3. Knowledge Chunks (Granular semantic chunks with full-text search & vector embeddings)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agent_configs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-Text GIN Index for rapid keyword & SKU search
CREATE INDEX IF NOT EXISTS knowledge_chunks_tsv_idx ON public.knowledge_chunks USING GIN (tsv_content);
CREATE INDEX IF NOT EXISTS knowledge_chunks_shop_doc_idx ON public.knowledge_chunks (shop_id, document_id, chunk_index);

-- Conditionally add vector embedding column and index if pgvector is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'knowledge_chunks' AND column_name = 'embedding'
    ) THEN
      ALTER TABLE public.knowledge_chunks ADD COLUMN embedding vector(1536);
    END IF;
    
    -- Create vector index for cosine distance if not exists
    EXECUTE 'CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_cosine_idx ON public.knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Vector indexing skipped or already exists: %', SQLERRM;
END $$;

-- 4. Enable Row Level Security (RLS) and Security Scoping
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.knowledge_documents FROM anon, authenticated;
REVOKE ALL ON TABLE public.knowledge_chunks FROM anon, authenticated;

-- Policies for authenticated dashboard users managing their own shop's knowledge
DROP POLICY IF EXISTS knowledge_docs_shop_owner ON public.knowledge_documents;
CREATE POLICY knowledge_docs_shop_owner ON public.knowledge_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = knowledge_documents.shop_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = knowledge_documents.shop_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.status = 'active'
        AND sm.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS knowledge_chunks_shop_owner ON public.knowledge_chunks;
CREATE POLICY knowledge_chunks_shop_owner ON public.knowledge_chunks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = knowledge_chunks.shop_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = knowledge_chunks.shop_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.status = 'active'
        AND sm.role IN ('owner', 'admin', 'manager')
    )
  );

COMMIT;
