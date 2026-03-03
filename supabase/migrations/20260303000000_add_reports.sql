CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT        NOT NULL CHECK (target_type IN ('profile', 'voice')),
  target_id   UUID        NOT NULL,
  reason      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ログイン済みユーザーのみ通報できる
CREATE POLICY "Authenticated users can insert reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- 管理者（service_role）のみ閲覧できる
CREATE POLICY "Service role can read reports"
  ON public.reports FOR SELECT TO service_role
  USING (true);
