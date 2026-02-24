-- ================================================================
-- V-Vibe: vlivers を vliver_profiles + voice_posts に分割
-- ================================================================

-- ── 1. vliver_profiles（プロフィール、1人1レコード想定）──────
CREATE TABLE public.vliver_profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  handle      text        NOT NULL DEFAULT '',
  image_path  text,
  color       text        NOT NULL DEFAULT '#a855f7',
  tags        text[]      NOT NULL DEFAULT '{}',
  description text        NOT NULL DEFAULT '',
  followers   text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. voice_posts（ボイス投稿、何度でも可能）────────────────
-- 1行 = スワイプ画面の1枚のカード
CREATE TABLE public.voice_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vliver_id    uuid        NOT NULL REFERENCES public.vliver_profiles(id) ON DELETE CASCADE,
  owner_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catch_copy   text        NOT NULL DEFAULT '',
  voice_path   text,
  is_boosted   boolean     NOT NULL DEFAULT false,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 3. vlivers → vliver_profiles に移行（UUID を引き継ぐ）────
INSERT INTO public.vliver_profiles
  (id, owner_id, name, handle, image_path, color, tags, description, followers, created_at)
SELECT id, owner_id, name, handle, image_path, color, tags, description, followers, created_at
FROM public.vlivers;

-- ── 4. vlivers → voice_posts に移行（vliver_id = vlivers.id）─
INSERT INTO public.voice_posts
  (vliver_id, owner_id, catch_copy, voice_path, is_boosted, is_published, created_at)
SELECT id, owner_id, catch_copy, voice_path, is_boosted, is_published, created_at
FROM public.vlivers;

-- ── 5. swipe_events の FK を voice_posts に更新 ───────────────
TRUNCATE public.swipe_events;
ALTER TABLE public.swipe_events DROP CONSTRAINT IF EXISTS swipe_events_vliver_id_fkey;
ALTER TABLE public.swipe_events DROP COLUMN IF EXISTS vliver_id;
ALTER TABLE public.swipe_events
  ADD COLUMN voice_post_id uuid NOT NULL
    REFERENCES public.voice_posts(id) ON DELETE CASCADE;

-- ── 6. vlivers テーブルを削除 ────────────────────────────────
DROP TABLE public.vlivers;

-- ── 7. RLS ───────────────────────────────────────────────────
ALTER TABLE public.vliver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィール全体閲覧可"
  ON public.vliver_profiles FOR SELECT USING (true);

CREATE POLICY "自分のプロフィールのみ操作可"
  ON public.vliver_profiles FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE public.voice_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公開済みボイスは誰でも閲覧可"
  ON public.voice_posts FOR SELECT USING (is_published = true);

CREATE POLICY "自分のボイス投稿のみ操作可"
  ON public.voice_posts FOR ALL USING (auth.uid() = owner_id);

-- ── 8. インデックス ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vliver_profiles_owner_id  ON public.vliver_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_voice_posts_vliver_id     ON public.voice_posts(vliver_id);
CREATE INDEX IF NOT EXISTS idx_voice_posts_is_published  ON public.voice_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_voice_posts_is_boosted    ON public.voice_posts(is_boosted);
