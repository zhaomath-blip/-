-- ============================================================
-- 新北方旅游客运管理平台 - schedules 表设置脚本
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- 第 1 步：给 schedules 表添加 due_time（截止时间）列
-- 类型用 timestamptz（带时区的时间戳），这是 Supabase 推荐的时间类型
alter table schedules
  add column if not exists due_time timestamptz;

-- 第 2 步：插入 3 条测试数据
insert into schedules (title, description, due_time, status) values
  ('早班车发车检查', '检查车辆胎压、油量、灭火器，确认乘客名单', now() + interval '2 hours', '待处理'),
  ('旅游团接送任务', '接 3 号团从火车站到景区，共 45 人', now() + interval '5 hours', '进行中'),
  ('车辆日常保养', '更换机油和空气滤芯，已完成', now() - interval '1 day', '已完成');

-- 第 3 步：查看结果（可选，用来确认数据插入成功）
select id, title, description, due_time, status, created_at
from schedules
order by created_at desc;
