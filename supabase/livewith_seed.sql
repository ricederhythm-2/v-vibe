-- LiveWith 事務所サンプルデータ
-- 1. migration (20260305000000_add_agencies.sql) を先に実行してください
-- 2. このファイルを Supabase SQL Editor で実行してください

DO $$
DECLARE
  a_id uuid;
BEGIN
  INSERT INTO public.agencies (slug, name, description, twitter_handle)
  VALUES (
    'livewith',
    'LiveWith',
    'Vライバー・VTuberを中心に多彩な才能が集まるライバー事務所。歌・ゲーム・癒し系まで個性豊かな声で、あなたの毎日に彩りを。',
    'livewith_official'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description
  RETURNING id INTO a_id;

  -- 既存サンプルライバーを LiveWith に紐付け
  UPDATE public.vliver_profiles
  SET agency_id = a_id
  WHERE handle IN ('akane_v', 'yuina_star', 'kotona_v', 'ramu_sea');
END $$;
