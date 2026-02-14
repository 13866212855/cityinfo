-- ============================================================
-- Supabase 数据库修复脚本 (CityInfo)
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本
-- ============================================================

-- 1. 创建 withdrawals 表 (核心修复)
create table if not exists withdrawals (
  id text primary key,
  user_id text,
  user_nickname text,
  amount numeric,
  method text,
  account text,
  real_name text,
  bank_name text,
  status text default 'PENDING',
  timestamp bigint
);

-- 2. 关闭所有表的 RLS (最简单的权限修复方式 - 仅供开发/演示使用)
-- 这样就不需要配置复杂的 Policy 了
alter table withdrawals disable row level security;
alter table users disable row level security;
alter table posts disable row level security;
alter table messages disable row level security;

-- 3. 确保 Storage 权限
-- 如果您还没有创建 'pic' bucket，请在 Dashboard -> Storage 中手动创建并设置为 Public
-- 这里尝试赋予所有 buckets 读写权限
create policy "Allow All"
on storage.objects for all
using (true)
with check (true);
