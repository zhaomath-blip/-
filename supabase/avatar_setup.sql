-- ============================================================
-- 星北方旅游客运管理平台 - 个性化头像数据库脚本
-- 作用：
--   1) 给 profiles 表加 avatar_url 字段（存头像地址或 emoji）
--   2) 创建 avatars 存储桶（存放用户上传的头像图片）
--   3) 配置存储桶访问策略（所有人可读，本人可写）
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) profiles 表新增 avatar_url 字段
--    说明：可以存两种值
--      - 预设头像：直接存 emoji，例如 "🚌"
--      - 上传头像：存公开 URL，例如 "https://xxx.supabase.co/storage/v1/object/public/avatars/xxx.png"
-- ------------------------------------------------------------
alter table profiles
  add column if not exists avatar_url text;

-- ------------------------------------------------------------
-- 2) 创建 avatars 存储桶（公开可读）
--    public = true 表示任何人可以通过 URL 访问图片
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- ------------------------------------------------------------
-- 3) 存储桶访问策略
-- ------------------------------------------------------------

-- 3.1 所有人可读（头像要能在页面上显示）
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- 3.2 登录用户可上传（只能传到自己 id 命名的文件夹下）
drop policy if exists "avatars auth upload" on storage.objects;
create policy "avatars auth upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3.3 登录用户可覆盖自己的头像
drop policy if exists "avatars auth update" on storage.objects;
create policy "avatars auth update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3.4 登录用户可删除自己的头像
drop policy if exists "avatars auth delete" on storage.objects;
create policy "avatars auth delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- 4) 确认结果（可选）
-- ------------------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_name = 'profiles' and column_name = 'avatar_url';

select id, name, public from storage.buckets where id = 'avatars';
