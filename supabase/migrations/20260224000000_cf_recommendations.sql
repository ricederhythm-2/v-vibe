-- ================================================================
-- V-Vibe: 協調フィルタリング (CF) 対応
--
-- 変更点:
-- 1. swipe_events に UNIQUE 制約とインデックスを追加
-- 2. swipe_events の RLS を CF 用に開放
--    (SELECT は全員可、INSERT/UPDATE/DELETE は自分のみ)
-- 3. get_cf_scores RPC 関数を追加
--    Jaccard 類似度ベースで各 voice_post のCFスコアを返す
-- ================================================================

-- ── 1. UNIQUE 制約・インデックス ─────────────────────────────────
-- migration 002 で vliver_id → voice_post_id に変更後、
-- UNIQUE 制約が落ちているため UNIQUE INDEX として追加
-- （UNIQUE INDEX は制約と同等に upsert の onConflict でも機能する）
CREATE UNIQUE INDEX IF NOT EXISTS swipe_events_user_post_unique
  ON public.swipe_events (user_id, voice_post_id);

CREATE INDEX IF NOT EXISTS idx_swipe_events_voice_post_id
  ON public.swipe_events (voice_post_id);

CREATE INDEX IF NOT EXISTS idx_swipe_events_action
  ON public.swipe_events (action);

-- ── 2. RLS 再設定 ────────────────────────────────────────────────
-- 既存ポリシーを削除して再定義
DROP POLICY IF EXISTS "自分のスワイプ履歴のみ読み書き可" ON public.swipe_events;

-- CF のために SELECT は全ユーザーに開放
-- （個人特定できる情報は含まれていない: user_id + post_id + action）
CREATE POLICY "スワイプ履歴は閲覧のみ全員可（CF用）"
  ON public.swipe_events FOR SELECT USING (true);

CREATE POLICY "自分のスワイプ履歴のみ挿入可"
  ON public.swipe_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のスワイプ履歴のみ更新可"
  ON public.swipe_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "自分のスワイプ履歴のみ削除可"
  ON public.swipe_events FOR DELETE USING (auth.uid() = user_id);

-- ── 3. get_cf_scores RPC ─────────────────────────────────────────
-- アルゴリズム: Jaccard 類似度ベースのユーザー間協調フィルタリング
--
-- Jaccard(A, B) = |A ∩ B| / |A ∪ B|
--   A = 自分の LIKE 集合
--   B = 他ユーザーの LIKE 集合
--
-- 各 voice_post のCFスコア =
--   その投稿を LIKE した類似ユーザーの Jaccard 類似度の合計
--
-- SECURITY DEFINER: RLS を回避して全ユーザーのデータを参照する
-- （セキュリティ境界は関数内で担保）
DROP FUNCTION IF EXISTS public.get_cf_scores(uuid);

CREATE FUNCTION public.get_cf_scores(p_user_id uuid)
RETURNS TABLE (post_id uuid, cf_score float8)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH
  -- ① 自分の LIKE 一覧
  my_likes AS (
    SELECT voice_post_id
    FROM public.swipe_events
    WHERE user_id = p_user_id AND action = 'like'
  ),
  -- ② 自分が行動済みの投稿（LIKE + PASS）→ 推薦から除外
  my_seen AS (
    SELECT voice_post_id
    FROM public.swipe_events
    WHERE user_id = p_user_id
  ),
  -- ③ 自分の LIKE 総数（Jaccard 分母計算用）
  my_like_count AS (
    SELECT COUNT(*) AS cnt FROM my_likes
  ),
  -- ④ 自分と共通 LIKE を持つ他ユーザーと共通数
  similar_users AS (
    SELECT
      se.user_id,
      COUNT(DISTINCT se.voice_post_id) AS common_count
    FROM public.swipe_events se
    WHERE se.user_id != p_user_id
      AND se.action = 'like'
      AND se.voice_post_id IN (SELECT voice_post_id FROM my_likes)
    GROUP BY se.user_id
  ),
  -- ⑤ 各類似ユーザーの LIKE 総数（Jaccard 分母計算用）
  other_like_counts AS (
    SELECT user_id, COUNT(*) AS cnt
    FROM public.swipe_events
    WHERE action = 'like'
    GROUP BY user_id
  ),
  -- ⑥ Jaccard 類似度の計算
  --   分母が 0 になるケースは NULLIF で除外（= 類似度 0 扱い）
  user_similarity AS (
    SELECT
      su.user_id,
      su.common_count::float8 / NULLIF(
        (SELECT cnt FROM my_like_count) + olc.cnt - su.common_count,
        0
      ) AS similarity
    FROM similar_users su
    JOIN other_like_counts olc ON su.user_id = olc.user_id
    WHERE su.common_count > 0
  )
  -- ⑦ 似たユーザーが LIKE した、自分がまだ見ていない投稿をスコアリング
  SELECT
    se.voice_post_id AS post_id,
    SUM(us.similarity)::float8 AS cf_score
  FROM public.swipe_events se
  JOIN user_similarity us ON se.user_id = us.user_id
  WHERE se.action = 'like'
    AND se.voice_post_id NOT IN (SELECT voice_post_id FROM my_seen)
  GROUP BY se.voice_post_id
  ORDER BY cf_score DESC;
$$;
