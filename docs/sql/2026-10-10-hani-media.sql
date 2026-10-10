-- HANI 표지·포스터 B단계: 소유자 전용 이중 보관. 원본 inline과 hani_state는 유지합니다.
begin;
create table if not exists public.hani_media (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id text not null check (media_id ~ '^media:sha256:[0-9a-f]{64}$'),
  mime text not null,
  bytes integer not null check (bytes > 0 and bytes <= 600000),
  data text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, media_id)
);
alter table public.hani_media enable row level security;
revoke all on public.hani_media from anon, authenticated;
grant select, insert on public.hani_media to authenticated;
drop policy if exists hani_media_select_own on public.hani_media;
create policy hani_media_select_own on public.hani_media
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists hani_media_insert_own on public.hani_media;
create policy hani_media_insert_own on public.hani_media
  for insert to authenticated with check (auth.uid() = user_id);
-- UPDATE/DELETE 권한·정책 없음. 중복 이미지는 INSERT 결과 및 본문 재읽기로 확인합니다.
commit;
