ALTER TABLE public.vliver_profiles
  ADD COLUMN IF NOT EXISTS platform_links jsonb NOT NULL DEFAULT '{}';
