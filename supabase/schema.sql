-- ================================================================
-- V-Vibe Phase 1 初期スキーマ
-- gen_random_uuid() を使用（Supabase 組み込み）
-- ================================================================

-- ================================================================
-- profiles テーブル
-- ================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  twitter_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'ユーザーのプロフィール情報';

-- 新規ユーザー登録時に自動で profiles 行を作成するトリガー
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- vlivers テーブル
-- ================================================================
create table if not exists public.vlivers (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  catch_copy   text not null default '',
  description  text not null default '',
  tags         text[] not null default '{}',
  color        text not null default '#a855f7',
  image_path   text,
  voice_path   text,
  is_boosted   boolean not null default false,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.vlivers is 'Vライバーのカードデータ';
comment on column public.vlivers.image_path is 'Storage バケット vlivers-images 内のオブジェクトキー';
comment on column public.vlivers.voice_path is 'Storage バケット vlivers-voices 内のオブジェクトキー';
comment on column public.vlivers.is_boosted is '有料ブーストによる優先表示フラグ（Phase 3 以降）';

-- ================================================================
-- swipe_events テーブル
-- ================================================================
create table if not exists public.swipe_events (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  vliver_id  uuid not null references public.vlivers(id) on delete cascade,
  action     text not null check (action in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (user_id, vliver_id)
);

comment on table public.swipe_events is 'スワイプ（LIKE/PASS）履歴。レコメンドと分析に使用。';

-- ================================================================
-- RLS
-- ================================================================

-- profiles
alter table public.profiles enable row level security;

create policy "誰でもプロフィールを閲覧可"
  on public.profiles for select using (true);

create policy "自分のプロフィールのみ更新可"
  on public.profiles for update using (auth.uid() = id);

-- vlivers
alter table public.vlivers enable row level security;

create policy "公開済みVライバーは誰でも閲覧可"
  on public.vlivers for select
  using (is_published = true);

create policy "ログイン済みユーザーは自分のVライバーを全操作可"
  on public.vlivers for all
  using (auth.uid() = owner_id);

-- swipe_events
alter table public.swipe_events enable row level security;

create policy "自分のスワイプ履歴のみ読み書き可"
  on public.swipe_events for all
  using (auth.uid() = user_id);

-- ================================================================
-- Storage バケット
-- ================================================================
insert into storage.buckets (id, name, public)
values ('vlivers-images', 'vlivers-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vlivers-voices', 'vlivers-voices', true)
on conflict (id) do nothing;

-- 画像バケットポリシー
create policy "画像は誰でも閲覧可"
  on storage.objects for select
  using (bucket_id = 'vlivers-images');

create policy "ログイン済みユーザーは画像をアップロード可"
  on storage.objects for insert
  with check (
    bucket_id = 'vlivers-images'
    and auth.uid() is not null
  );

create policy "自分がアップロードした画像のみ削除可"
  on storage.objects for delete
  using (
    bucket_id = 'vlivers-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 音声バケットポリシー
create policy "音声は誰でも閲覧可"
  on storage.objects for select
  using (bucket_id = 'vlivers-voices');

create policy "ログイン済みユーザーは音声をアップロード可"
  on storage.objects for insert
  with check (
    bucket_id = 'vlivers-voices'
    and auth.uid() is not null
  );

create policy "自分がアップロードした音声のみ削除可"
  on storage.objects for delete
  using (
    bucket_id = 'vlivers-voices'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- インデックス
-- ================================================================
create index if not exists idx_vlivers_owner_id     on public.vlivers(owner_id);
create index if not exists idx_vlivers_is_published on public.vlivers(is_published);
create index if not exists idx_vlivers_is_boosted   on public.vlivers(is_boosted);
create index if not exists idx_swipe_events_user_id on public.swipe_events(user_id);
