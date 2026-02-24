-- vlivers テーブルに handle と followers カラムを追加
alter table public.vlivers
  add column if not exists handle    text not null default '',
  add column if not exists followers text not null default '';
