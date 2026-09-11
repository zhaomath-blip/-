-- ============================================================
-- 新北方旅游客运管理平台 - 管理员 & 打卡 功能数据库脚本
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- 建议：整段一次性执行
-- ============================================================

-- ============================================================
-- 第 1 部分：profiles 表（用户资料 + 角色）
-- 说明：profiles 表已存在，这里只补齐需要的列
-- ============================================================

-- 1.1 补齐 profiles 表字段（已存在则跳过）
alter table profiles
  add column if not exists phone text,
  add column if not exists full_name text,
  add column if not exists role text default 'driver',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 1.2 role 取值约束：admin（管理员）/ driver（司机）
--     用 do 块包裹，避免重复执行时报错
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table profiles
      add constraint profiles_role_check
      check (role in ('admin', 'driver'));
  end if;
end $$;

-- ============================================================
-- 第 2 部分：checkins 打卡表
-- ============================================================

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid references schedules(id) on delete set null,
  type text not null default 'clock_in',      -- clock_in 上班 / clock_out 下班
  note text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- 常用索引
create index if not exists checkins_user_id_idx on checkins(user_id);
create index if not exists checkins_created_at_idx on checkins(created_at desc);

-- ============================================================
-- 第 3 部分：schedules 表补齐字段
-- ============================================================

alter table schedules
  add column if not exists assignee_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- ============================================================
-- 第 4 部分：RLS 策略
-- ============================================================

-- ---------- 4.1 profiles ----------
alter table profiles enable row level security;

-- 所有人可读（前端需要判断角色）
drop policy if exists "profiles read all" on profiles;
create policy "profiles read all"
  on profiles for select
  to anon, authenticated
  using (true);

-- 用户可插入/更新自己的资料
drop policy if exists "profiles insert self" on profiles;
create policy "profiles insert self"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles update self" on profiles;
create policy "profiles update self"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- 4.2 checkins ----------
alter table checkins enable row level security;

-- 登录用户可读所有打卡记录（管理端要看）
drop policy if exists "checkins read all" on checkins;
create policy "checkins read all"
  on checkins for select
  to authenticated
  using (true);

-- 登录用户只能插入自己的打卡
drop policy if exists "checkins insert self" on checkins;
create policy "checkins insert self"
  on checkins for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 登录用户只能删除自己的打卡
drop policy if exists "checkins delete self" on checkins;
create policy "checkins delete self"
  on checkins for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------- 4.3 schedules 写入策略 ----------
-- 登录用户可新增任务（发布任务）
drop policy if exists "schedules insert auth" on schedules;
create policy "schedules insert auth"
  on schedules for insert
  to authenticated
  with check (true);

-- 登录用户可更新任务（改状态、打卡关联等）
drop policy if exists "schedules update auth" on schedules;
create policy "schedules update auth"
  on schedules for update
  to authenticated
  using (true)
  with check (true);

-- 登录用户可删除任务
drop policy if exists "schedules delete auth" on schedules;
create policy "schedules delete auth"
  on schedules for delete
  to authenticated
  using (true);

-- ============================================================
-- 第 5 部分：自动创建 profile 的触发器
-- 说明：新用户注册后，自动在 profiles 里建一条记录
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'driver'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 第 6 部分：把某个用户设为管理员
-- 使用方法：把下面的手机号改成你要设为管理员的账号，然后执行
-- ============================================================

-- 示例：把 13800138001@phone.local 设为管理员
-- update profiles
-- set role = 'admin'
-- where id = (
--   select id from auth.users where email = '13800138001@phone.local'
-- );

-- ============================================================
-- 第 7 部分：查看结果
-- ============================================================

select 'profiles' as tbl, count(*) as cnt from profiles
union all
select 'checkins', count(*) from checkins
union all
select 'schedules', count(*) from schedules;
