-- ============================================================
-- 星北方旅游客运管理平台 - profiles 表「个性化昵称」策略
-- 作用：允许登录用户读取自己的资料、修改自己的昵称（full_name）
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) 允许登录用户读取所有 profiles
--    （管理页「完成情况」需要按 id 匹配司机姓名，所以需要能读全部）
-- ------------------------------------------------------------
drop policy if exists "allow read profiles" on profiles;
create policy "allow read profiles"
  on profiles
  for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- 2) 允许登录用户修改「自己」的 profile
--    关键：using 限制只能改到自己那一行，with check 防止把 id 改走
-- ------------------------------------------------------------
drop policy if exists "allow update own profile" on profiles;
create policy "allow update own profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 3) 允许新注册用户插入自己的 profile（若没有触发器自动建行）
-- ------------------------------------------------------------
drop policy if exists "allow insert own profile" on profiles;
create policy "allow insert own profile"
  on profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 4) 查看当前 profiles 的策略（可选，用来确认是否生效）
-- ------------------------------------------------------------
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where tablename = 'profiles'
order by policyname;
