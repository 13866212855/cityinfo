# Supabase Storage 设置指南

## 创建 qr-codes 存储桶

请按照以下步骤在 Supabase Dashboard 中创建存储桶：

### 步骤 1：创建存储桶

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择项目：cityinfo
3. 导航到 Storage 页面
4. 点击 "New bucket" 按钮
5. 填写以下信息：
   - Name: `qr-codes`
   - Public bucket: ✅ 勾选（允许公开访问）
   - File size limit: `5242880` (5MB = 5 * 1024 * 1024 bytes)
   - Allowed MIME types: `image/*`

### 步骤 2：配置访问策略

在创建存储桶后，需要配置以下访问策略：

#### 策略 1：允许认证用户上传

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');
```

#### 策略 2：允许公开读取

```sql
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');
```

#### 策略 3：允许认证用户删除

```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'qr-codes');
```

### 验证

创建完成后，存储桶的公开 URL 格式应为：
```
https://ksstnzetvktwcoeyheqv.supabase.co/storage/v1/object/public/qr-codes/{filename}
```

### 注意事项

- 确保存储桶设置为 public，否则用户无法访问二维码图片
- 文件大小限制为 5MB，超过此大小的文件将被拒绝
- 只允许上传图片文件（image/*）
- 文件名使用时间戳确保唯一性：`recharge_qr_{timestamp}.{ext}`
