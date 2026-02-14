-- ============================================================
-- Supabase 钱包功能增强脚本
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本
-- ============================================================

-- 1. 创建资金流水表
create table if not exists wallet_transactions (
  id text primary key,
  user_id text,
  type text, -- RECHARGE, WITHDRAW, INCOME, EXPENSE
  title text,
  amount numeric,
  balance_after numeric,
  status text default 'SUCCESS',
  timestamp bigint
);

-- 2. 开放流水表权限 (演示用)
alter table wallet_transactions enable row level security;
drop policy if exists "Enable all for wallet_transactions" on wallet_transactions;

create policy "Enable all for wallet_transactions" 
on wallet_transactions for all 
using (true) 
with check (true);

-- 3. 可选：更新 Users 表增加余额字段 (如果尚未存在)
alter table users add column if not exists balance numeric default 0.00;
