CREATE TABLE public.product_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key TEXT NOT NULL,
  region TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_key, region)
);

ALTER TABLE public.product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached products"
ON public.product_cache FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can insert cached products"
ON public.product_cache FOR INSERT
TO service_role
WITH CHECK (true);