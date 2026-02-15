-- Supabase Storage 访问策略配置
-- 用于 qr-codes 存储桶

-- 策略 1：允许认证用户上传
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');

-- 策略 2：允许公开读取
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');

-- 策略 3：允许认证用户删除
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'qr-codes');

-- 注意：这些策略需要在 Supabase Dashboard 的 Storage -> Policies 页面中执行
-- 或者通过 SQL Editor 执行
