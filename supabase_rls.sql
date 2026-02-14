-- !!! 重要提示 !!!

-- 如果您在运行此脚本时遇到 "ERROR: 42501: must be owner of table objects"：
-- 这意味着您当前的 SQL Editor 用户没有权限修改 Storage 系统表的策略。
-- 这是 Supabase 安全机制的一部分。

-- 请放弃使用此脚本，转而使用 Supabase 界面进行操作（100% 成功）：
-- 1. 点击左侧菜单 "Storage"。
-- 2. 点击 "New Bucket"，名称填 "pic"，开启 "Public Bucket"。
-- 3. 在 "Configuration" -> "Policies" 中，为 "pic" 桶添加新策略。
-- 4. 允许 "INSERT" (上传) 和 "SELECT" (查看) 权限。
-- 5. Target roles 选 "anon" 或不选（默认为 public）。

-- ==========================================
-- 以下脚本仅供拥有 Superuser 权限的用户尝试
-- ==========================================

-- 1. 尝试创建存储桶
insert into storage.buckets (id, name, public)
values ('pic', 'pic', true)
on conflict (id) do nothing;

-- 2. 尝试创建上传策略
create policy "Allow Public Insert"
on storage.objects for insert
to public
with check ( bucket_id = 'pic' );

-- 3. 尝试创建读取策略
create policy "Allow Public Select"
on storage.objects for select
to public
using ( bucket_id = 'pic' );
