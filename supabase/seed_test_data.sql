-- ============================================================
-- 星北方旅游客运管理平台 - 测试数据
-- 使用方法：复制到 Supabase 后台 -> SQL Editor -> 粘贴 -> Run
-- ============================================================

-- ---------- 车辆测试数据 ----------
insert into vehicles (plate_number, model, capacity, status) values
  ('京A·12345', '宇通 ZK6122', 55, '空闲'),
  ('京B·67890', '金龙 XMQ6900', 39, '出车中'),
  ('京C·11111', '丰田考斯特', 23, '维修中');

-- ---------- 司机测试数据 ----------
insert into drivers (name, phone, status) values
  ('张建国', '13800138001', '在岗'),
  ('李卫东', '13800138002', '任务中'),
  ('王秀兰', '13800138003', '休息');

-- ---------- 今日任务测试数据 ----------
-- due_date 用 current_date（今天），这样「今日」页面能筛选出来
insert into schedules (title, description, due_date, due_time, status) values
  ('早班车发车检查',
   '检查车辆胎压、油量、灭火器，确认乘客名单',
   current_date,
   now() + interval '2 hours',
   '待处理'),
  ('旅游团接送任务',
   '接 3 号团从火车站到景区，共 45 人',
   current_date,
   now() + interval '5 hours',
   '进行中'),
  ('车辆日常保养',
   '更换机油和空气滤芯',
   current_date,
   now() + interval '8 hours',
   '已完成');

-- ---------- 明天的任务（用来验证筛选是否生效）----------
-- 这条不应该出现在「今日」页面
insert into schedules (title, description, due_date, due_time, status) values
  ('明日机场接送',
   '这条是明天的任务，今日页面不应该显示',
   current_date + interval '1 day',
   now() + interval '1 day',
   '待处理');

-- ---------- 查看结果 ----------
select 'vehicles' as tbl, count(*) from vehicles
union all
select 'drivers', count(*) from drivers
union all
select 'schedules(today)', count(*) from schedules where due_date = current_date
union all
select 'schedules(all)', count(*) from schedules;
