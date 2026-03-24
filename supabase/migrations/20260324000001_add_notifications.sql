-- ================================================================
-- notifications テーブル + お気に入り追加時の自動通知トリガー
-- ================================================================

-- ── 1. テーブル ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  post_id    uuid        REFERENCES public.voice_posts(id) ON DELETE CASCADE,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.notifications         IS 'Vライバーへの通知';
COMMENT ON COLUMN public.notifications.type    IS 'favorite_added など';
COMMENT ON COLUMN public.notifications.user_id IS '通知を受け取るユーザー（Vライバーの owner_id）';

-- ── 2. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の通知のみ閲覧・更新可"
  ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ── 3. インデックス ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ── 4. トリガー関数 ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- お気に入りされた投稿のオーナーを取得
  SELECT owner_id INTO v_owner_id
  FROM public.voice_posts
  WHERE id = NEW.post_id;

  -- 投稿が存在しない、または自分自身へのお気に入りは通知しない
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, post_id)
  VALUES (v_owner_id, 'favorite_added', NEW.post_id);

  RETURN NEW;
END;
$$;

-- ── 5. トリガー ───────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_favorite_inserted ON public.favorites;
CREATE TRIGGER on_favorite_inserted
  AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite();
