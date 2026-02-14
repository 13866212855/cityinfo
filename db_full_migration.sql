
-- ============================================================
-- CityInfo 全量数据化迁移脚本
-- ============================================================

-- 1. 系统分类表 (替代 CATEGORY_CONFIG)
create table if not exists sys_categories (
  key text primary key, -- HOUSING, JOBS ...
  label text not null,
  icon text not null,   -- FontAwesome class
  color text not null,  -- Tailwind classes
  sort_order int default 0
);

-- 插入默认分类数据
insert into sys_categories (key, label, icon, color, sort_order) values
('HOUSING', '房屋租赁', 'fa-home', 'bg-blue-100 text-blue-600', 1),
('JOBS', '求职招聘', 'fa-briefcase', 'bg-orange-100 text-orange-600', 2),
('SECOND_HAND', '二手闲置', 'fa-tag', 'bg-green-100 text-green-600', 3),
('SERVICES', '生活服务', 'fa-tools', 'bg-purple-100 text-purple-600', 4),
('CARPOOL', '顺风车', 'fa-car', 'bg-indigo-100 text-indigo-600', 5),
('PETS', '宠物生活', 'fa-paw', 'bg-pink-100 text-pink-600', 6),
('DATING', '同城交友', 'fa-heart', 'bg-red-100 text-red-600', 7),
('BUSINESS', '生意转让', 'fa-shop-lock', 'bg-yellow-100 text-yellow-600', 8),
('EDUCATION', '教育培训', 'fa-graduation-cap', 'bg-teal-100 text-teal-600', 9),
('AGRICULTURE', '农林牧渔', 'fa-wheat-awn', 'bg-lime-100 text-lime-600', 10)
on conflict (key) do nothing;

-- 2. 轮播图表 (替代 MOCK_BANNERS)
create table if not exists sys_banners (
  id text primary key,
  image_url text not null,
  link_url text,
  title text,
  sort_order int default 0,
  is_active boolean default true
);

insert into sys_banners (id, image_url, link_url, title, sort_order) values
('1', 'https://picsum.photos/800/400?random=1', '#', '暑期租房大促 - 免中介费', 1),
('2', 'https://picsum.photos/800/400?random=2', '#', '金牌保洁服务 - 低至8折', 2)
on conflict (id) do nothing;

-- 3. 商户表 (替代 MOCK_MERCHANTS)
create table if not exists merchants (
  id text primary key,
  name text not null,
  logo_url text,
  banner_url text,
  description text,
  address text,
  rating numeric default 5.0,
  is_verified boolean default false,
  followers int default 0,
  phone text
);

insert into merchants (id, name, logo_url, banner_url, description, address, rating, is_verified, followers, phone) values
('m1', '极速家政服务', 'https://picsum.photos/100/100?random=10', 'https://picsum.photos/800/300?random=11', '专注家庭清洁与维修服务十年，好评如潮。', '科技园区创业路123号', 4.8, true, 1205, '010-5550123'),
('m2', '安居置业', 'https://picsum.photos/100/100?random=12', 'https://picsum.photos/800/300?random=13', '为您寻找城市中心的理想家园，真实房源保障。', '市中心广场大厦A座', 4.5, true, 850, '010-5550987')
on conflict (id) do nothing;

-- 4. 服务商品表 (替代 MOCK_SERVICES)
create table if not exists merchant_services (
  id text primary key,
  merchant_id text references merchants(id),
  title text not null,
  price numeric not null,
  image_url text,
  sales_count int default 0
);

insert into merchant_services (id, merchant_id, title, price, image_url, sales_count) values
('s1', 'm1', '2小时深度保洁', 89.99, 'https://picsum.photos/200/200?random=20', 450),
('s2', 'm1', '空调清洗基础套餐', 59.00, 'https://picsum.photos/200/200?random=21', 120)
on conflict (id) do nothing;

-- 5. 系统配置表 (存储 JSON 结构的复杂数据，如 LOCATION_DATA)
create table if not exists sys_config (
  key text primary key,
  value jsonb not null,
  description text
);

-- 插入热门城市
insert into sys_config (key, value, description) values
('popular_cities', '["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安"]'::jsonb, '热门城市列表')
on conflict (key) do nothing;

-- 插入地址库 (简化版，完整版可以在后台编辑)
insert into sys_config (key, value, description) values
('location_data', '{
    "安徽省": {
        "阜阳市": {
            "颍上县": ["古城镇", "慎城镇", "红星镇", "谢桥镇", "南照镇"],
            "颍州区": ["清河街道", "文峰街道"],
            "太和县": ["城关镇", "旧县镇"]
        },
        "合肥市": {
            "蜀山区": ["三里庵街道", "五里墩街道"],
            "瑶海区": ["明光路街道", "胜利路街道"]
        }
    },
    "北京市": {
        "北京市": {
            "朝阳区": ["三里屯街道", "望京街道", "国贸"],
            "海淀区": ["中关村街道", "学院路街道"]
        }
    },
    "浙江省": {
        "杭州市": {
            "西湖区": ["北山街道", "西溪街道"],
            "余杭区": ["五常街道", "仓前街道"]
        }
    }
}'::jsonb, '省市区三级联动数据')
on conflict (key) do nothing;

-- 6. 开放权限 (简单模式，便于前端直接读取)
alter table sys_categories disable row level security;
alter table sys_banners disable row level security;
alter table merchants disable row level security;
alter table merchant_services disable row level security;
alter table sys_config disable row level security;
