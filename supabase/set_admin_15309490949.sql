-- ============================================================
-- 把手机号 15309490949 设为管理员
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- 建议：按顺序一段一段执行，先看第 1 步的诊断结果
-- ============================================================

-- ============================================================
-- 第 1 步：诊断 —— 这个用户到底存不存在？
-- 说明：手机号登录时，系统内部把手机号转成「手机号@phone.local」当邮箱
--       如果这里查不到，说明该账号还没注册成功
-- ============================================================
select
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.id as profile_id,
  p.full_name,
  p.role as current_role
from auth.users u
left join profiles p on p.id = u.id
where u.email = '15309490949@phone.local';

-- ============================================================
-- 第 2 步：如果第 1 步查到了用户，但 profile_id 是空的
--         （说明 profiles 表里没有这条记录），执行下面这段补建
-- ============================================================
insert into profiles (id, full_name, role)
select
  u.id,
  '管理员',
  'admin'
from auth.users u
where u.email = '15309490949@phone.local'
on conflict (id) do update
  set role = 'admin',
      full_name = coalesce(profiles.full_name, '管理员'),
      updated_at = now();

-- ============================================================
-- 第 3 步：确认结果（应该看到 role = admin）
-- ============================================================
select
  u.email,
  p.full_name,
  p.role
from auth.users u
join profiles p on p.id = u.id
where u.email = '15309490949@phone.local';

-- ============================================================
-- 第 4 步：查看当前所有管理员（确认设置是否生效）
-- ============================================================
select
  u.email,
  p.full_name,
  p.role
from profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
order by u.created_at;
