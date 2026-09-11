-- ============================================================
-- 新北方旅游客运管理平台 - RLS 策略配置
-- 作用：允许前端（anon key）读取数据
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- ------------------------------------------------------------
-- 说明：
-- Supabase 默认开启 RLS（行级安全），但没有策略 = 谁都读不到。
-- 下面给三张表各加一条「允许所有人读取」的策略。
-- 这是开发阶段最简单的做法，上线前应该收紧。
-- ------------------------------------------------------------

-- ---------- vehicles 表：允许读取 ----------
drop policy if exists "allow read vehicles" on vehicles;
create policy "allow read vehicles"
  on vehicles
  for select
  to anon, authenticated
  using (true);

-- ---------- drivers 表：允许读取 ----------
drop policy if exists "allow read drivers" on drivers;
create policy "allow read drivers"
  on drivers
  for select
  to anon, authenticated
  using (true);

-- ---------- schedules 表：允许读取 ----------
drop policy if exists "allow read schedules" on schedules;
create policy "allow read schedules"
  on schedules
  for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- 可选：开发阶段允许前端写入（增删改）
-- 如果暂时不需要在页面上新增/修改数据，可以不执行下面这段。
-- ------------------------------------------------------------

-- drop policy if exists "allow write vehicles" on vehicles;
-- create policy "allow write vehicles"
--   on vehicles for all to anon, authenticated
--   using (true) with check (true);

-- drop policy if exists "allow write drivers" on drivers;
-- create policy "allow write drivers"
--   on drivers for all to anon, authenticated
--   using (true) with check (true);

-- drop policy if exists "allow write schedules" on schedules;
-- create policy "allow write schedules"
--   on schedules for all to anon, authenticated
--   using (true) with check (true);

-- ------------------------------------------------------------
-- 查看当前所有策略（可选，用来确认是否生效）
-- ------------------------------------------------------------
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where tablename in ('vehicles', 'drivers', 'schedules')
order by tablename, policyname;
