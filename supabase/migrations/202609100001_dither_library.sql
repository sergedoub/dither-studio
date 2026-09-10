begin;
create table if not exists public.dither_projects (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 240),
 source_path text not null,
 output_path text not null,
 settings jsonb not null,
 palette jsonb not null,
 width integer not null check(width > 0),
 height integer not null check(height > 0),
 created_at timestamptz not null default now(),
 check(source_path = owner_id::text || '/' || id::text || '/source.png'),
 check(output_path = owner_id::text || '/' || id::text || '/output.png')
);
create index if not exists dither_projects_owner_created_idx on public.dither_projects(owner_id,created_at desc);
alter table public.dither_projects enable row level security;
revoke all on public.dither_projects from anon;
grant select,insert,delete on public.dither_projects to authenticated;
create policy "dither_select_own" on public.dither_projects for select to authenticated using ((select auth.uid())=owner_id);
create policy "dither_insert_own" on public.dither_projects for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "dither_delete_own" on public.dither_projects for delete to authenticated using ((select auth.uid())=owner_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dither-images','dither-images',false,20971520,array['image/png'])
on conflict(id) do nothing;
create policy "dither_images_read_own" on storage.objects for select to authenticated using(bucket_id='dither-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "dither_images_insert_own" on storage.objects for insert to authenticated with check(bucket_id='dither-images' and (storage.foldername(name))[1]=(select auth.uid())::text and array_length(storage.foldername(name),1)=2 and storage.filename(name) in ('source.png','output.png'));
create policy "dither_images_delete_own" on storage.objects for delete to authenticated using(bucket_id='dither-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
