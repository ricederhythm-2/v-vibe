-- ================================================================
-- favorites テーブルに RLS を追加
-- テーブルはダッシュボードで直接作成済みのためポリシーのみ設定する
-- ================================================================

ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "自分のお気に入りのみ操作可" ON public.favorites;
CREATE POLICY "自分のお気に入りのみ操作可"
  ON public.favorites FOR ALL USING (auth.uid() = user_id);
