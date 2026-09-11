-- ============================================================
-- 把手机号 13800138001 设为管理员
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- 第 1 步：先看看这个用户是否存在，以及 profiles 里有没有他
select
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.role as current_role
from auth.users u
left join profiles p on p.id = u.id
where u.email = '13800138001@phone.local';

-- 第 2 步：插入或更新 profile，把角色设为 admin
-- 说明：用 insert ... on conflict，如果 profile 不存在就新建，存在就更新
insert into profiles (id, full_name, role)
select
  u.id,
  '管理员',
  'admin'
from auth.users u
where u.email = '13800138001@phone.local'
on conflict (id) do update
  set role = 'admin',
      full_name = coalesce(profiles.full_name, '管理员'),
      updated_at = now();

-- 第 3 步：确认结果（应该看到 role = admin）
select
  u.email,
  p.full_name,
  p.role
from auth.users u
join profiles p on p.id = u.id
where u.email = '13800138001@phone.local';
