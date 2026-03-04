-- agencies テーブル
CREATE TABLE IF NOT EXISTS public.agencies (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text        NOT NULL UNIQUE,
  name           text        NOT NULL,
  description    text        NOT NULL DEFAULT '',
  website_url    text,
  twitter_handle text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read agencies" ON public.agencies FOR SELECT USING (true);

-- vliver_profiles に agency_id を追加
ALTER TABLE public.vliver_profiles
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;
