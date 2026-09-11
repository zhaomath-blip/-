-- ============================================================
-- 修复：把 15309490949 设为管理员
-- 诊断结果：该账号已存在，但当前角色是 driver（司机）
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- 第 1 步：直接按 id 更新角色（id 已通过诊断确认）
update profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), '管理员'),
    updated_at = now()
where id = 'fb8a14a4-20ec-4a4b-b597-cedd2d25d60c';

-- 第 2 步：确认结果（应看到 role = admin）
select id, full_name, role
from profiles
where id = 'fb8a14a4-20ec-4a4b-b597-cedd2d25d60c';

-- 第 3 步：查看当前所有管理员
select id, full_name, role
from profiles
where role = 'admin'
order by created_at;
