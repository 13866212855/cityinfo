-- ============================================================
-- 帖子内容初始化脚本
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本
-- ============================================================

insert into posts (
  id, title, description, category, price, 
  images, tags, location, lat, lng, distance, 
  contact_phone, publish_time, view_count, is_sticky, 
  merchant_id, author_name, avatar_url, attributes
) values 
(
  'p1', 
  '地铁口精装两居室，朝南采光好', 
  '宽敞的两居室，带朝南阳台。全新装修厨房。步行5分钟可达地铁站，周边生活便利。',
  'HOUSING',
  '¥2,500/月',
  '["https://picsum.photos/400/300?random=30", "https://picsum.photos/400/300?random=31"]'::jsonb,
  '["免中介费", "可养宠物"]'::jsonb,
  '朝阳区 · 国贸',
  39.909, 116.457, '0.5km',
  '13800138000',
  (extract(epoch from now()) * 1000 - 3600000)::bigint, -- 1 hour ago
  342,
  true,
  'm2',
  '安居置业',
  'https://picsum.photos/100/100?random=12',
  '[{"key": "layout", "label": "户型", "value": "2室1厅"}, {"key": "size", "label": "面积", "value": "85㎡"}]'::jsonb
),
(
  'p2',
  '急招高级Java后端开发工程师',
  '寻找经验丰富的后端工程师，熟悉Spring Boot/Cloud。支持远程办公。',
  'JOBS',
  '20k - 35k',
  '[]'::jsonb,
  '["远程办公", "全职", "五险一金"]'::jsonb,
  '海淀区 · 软件园',
  40.046, 116.299, '5.2km',
  '13900139000',
  (extract(epoch from now()) * 1000 - 7200000)::bigint,
  890,
  false,
  null,
  'HR莎莎',
  'https://picsum.photos/50/50?random=40',
  '[{"key": "exp", "label": "经验要求", "value": "3-5年"}, {"key": "edu", "label": "学历要求", "value": "本科"}]'::jsonb
),
(
  'p3',
  '山地车转让 - 9成新',
  '骑了不到6个月，因搬家忍痛转让。送头盔和车锁。',
  'SECOND_HAND',
  '¥850',
  '["https://picsum.photos/400/300?random=33"]'::jsonb,
  '["急售", "可小刀"]'::jsonb,
  '海淀区 · 大学城',
  39.991, 116.333, '2.1km',
  '13700137000',
  (extract(epoch from now()) * 1000 - 86400000)::bigint,
  56,
  false,
  null,
  '学生小张',
  'https://picsum.photos/50/50?random=41',
  '[{"key": "condition", "label": "成色", "value": "9成新"}]'::jsonb
)
on conflict (id) do update 
set 
  title = excluded.title,
  price = excluded.price,
  description = excluded.description,
  category = excluded.category;
