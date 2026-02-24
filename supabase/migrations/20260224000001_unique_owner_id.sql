-- vliver_profiles.owner_id にユニーク制約を追加（1ユーザー1プロフィール）
-- 重複がある場合は最新1件を残して古いものを削除する
DELETE FROM public.vliver_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (owner_id) id
  FROM public.vliver_profiles
  ORDER BY owner_id, created_at DESC
);

ALTER TABLE public.vliver_profiles
  ADD CONSTRAINT vliver_profiles_owner_id_unique UNIQUE (owner_id);
