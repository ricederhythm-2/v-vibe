-- vliver_profiles に X（Twitter）ハンドルカラムを追加
ALTER TABLE public.vliver_profiles
  ADD COLUMN IF NOT EXISTS twitter_handle text NOT NULL DEFAULT '';
