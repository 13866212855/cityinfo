# 需求文档：管理员充值收款码配置

## 简介

本功能旨在完善系统的充值功能，允许管理员在后台配置充值收款二维码，并确保用户在充值时能够正确显示管理员配置的收款码。系统使用 Supabase 作为主要存储方案，将二维码图片存储在 Supabase Storage 中，将配置信息存储在 Supabase 数据库中。系统同时支持 Mock 模式用于开发测试。

**Supabase 配置信息：**
- Project URL: https://ksstnzetvktwcoeyheqv.supabase.co
- Database: cityinfo
- Storage Bucket: 用于存储二维码图片文件

## 术语表

- **System**: 整个充值收款码配置系统
- **Admin_Dashboard**: 管理员后台界面组件
- **Wallet_Component**: 用户个人中心的钱包充值组件
- **QR_Upload_Handler**: 处理二维码上传的功能模块
- **Config_Storage**: 系统配置存储服务
- **Image_Storage**: 图片文件存储服务
- **Recharge_QR**: 充值收款二维码图片
- **System_Config**: 系统配置数据（键值对存储）
- **Mock_Mode**: 使用 localStorage 的本地模拟模式
- **Supabase_Mode**: 使用 Supabase 后端的生产模式
- **Storage_Bucket**: Supabase Storage 中用于存储图片的存储桶
- **System_Config_Table**: Supabase 数据库中存储系统配置的表

## 需求

### 需求 0：Supabase 数据库表结构

**用户故事：** 作为系统架构师，我希望定义清晰的数据库表结构，以便存储系统配置信息。

#### 验收标准

1. THE System SHALL 在 Supabase 数据库中创建或使用 system_config 表
2. THE system_config 表 SHALL 包含以下字段：
   - id (uuid, primary key, default: gen_random_uuid())
   - key (text, unique, not null) - 配置项的键名
   - value (text, nullable) - 配置项的值
   - created_at (timestamp, default: now())
   - updated_at (timestamp, default: now())
3. THE system_config 表 SHALL 在 key 字段上创建唯一索引
4. THE System SHALL 支持通过 key='recharge_qr' 查询和更新收款码配置
5. WHEN 更新配置时，THE System SHALL 自动更新 updated_at 字段为当前时间

### 需求 0.1：Supabase Storage 配置

**用户故事：** 作为系统架构师，我希望配置 Supabase Storage 用于存储二维码图片，以便实现可靠的文件存储。

#### 验收标准

1. THE System SHALL 在 Supabase Storage 中创建或使用名为 'qr-codes' 的存储桶
2. THE Storage_Bucket SHALL 配置为公开访问（public bucket）以便用户可以直接访问图片 URL
3. THE Storage_Bucket SHALL 限制上传文件大小不超过 5MB
4. THE Storage_Bucket SHALL 只允许图片文件类型（image/*）
5. WHEN 上传新的二维码图片时，THE System SHALL 使用唯一的文件名（如：recharge_qr_{timestamp}.{ext}）避免冲突

## 需求

### 需求 1：管理员上传收款二维码

**用户故事：** 作为管理员，我希望能够上传充值收款二维码图片，以便用户在充值时看到正确的收款信息。

#### 验收标准

1. WHEN 管理员在后台财务标签页选择二维码图片文件，THE System SHALL 验证文件格式为有效的图片格式（jpg, jpeg, png, gif, webp）
2. WHEN 管理员上传二维码图片，THE Image_Storage SHALL 将图片文件上传到存储服务并返回可访问的 URL
3. WHEN 图片上传成功，THE Config_Storage SHALL 将图片 URL 保存到系统配置中，配置键为 'recharge_qr'
4. IF 图片上传失败，THEN THE System SHALL 显示错误提示信息并保持当前配置不变
5. WHEN 二维码配置保存成功，THE Admin_Dashboard SHALL 显示成功提示并更新预览图

### 需求 2：用户充值时显示收款二维码

**用户故事：** 作为用户，我希望在充值时看到管理员配置的收款二维码，以便我能够扫码完成充值。

#### 验收标准

1. WHEN 用户打开钱包充值页面，THE Wallet_Component SHALL 从系统配置中加载 'recharge_qr' 配置项
2. WHEN 收款二维码配置存在且有效，THE Wallet_Component SHALL 显示管理员配置的二维码图片
3. WHEN 收款二维码配置不存在或为空，THE Wallet_Component SHALL 显示默认占位图
4. WHEN 二维码图片加载失败，THE Wallet_Component SHALL 显示默认占位图
5. WHEN 二维码正在加载时，THE Wallet_Component SHALL 显示加载状态指示器

### 需求 3：Mock 模式下的配置存储

**用户故事：** 作为开发者，我希望在 Mock 模式下也能测试收款码配置功能，以便在没有网络连接或 Supabase 服务时进行开发和测试。

#### 验收标准

1. WHEN 系统运行在 Mock 模式下，THE Config_Storage SHALL 使用 localStorage 存储系统配置
2. WHEN 管理员在 Mock 模式下上传二维码，THE Image_Storage SHALL 将图片转换为 Base64 编码的 data URL
3. WHEN 保存配置到 localStorage，THE Config_Storage SHALL 使用 'system_config_recharge_qr' 作为存储键
4. WHEN 从 localStorage 加载配置，THE Config_Storage SHALL 正确解析并返回配置值
5. WHEN localStorage 不可用或读取失败，THE System SHALL 降级使用内存存储并在控制台记录警告

### 需求 4：Supabase 模式下的配置存储

**用户故事：** 作为系统管理员，我希望在生产环境中使用 Supabase 存储收款码配置，以便实现持久化和多端同步。

#### 验收标准

1. WHEN 系统运行在 Supabase 模式下，THE Image_Storage SHALL 将二维码图片上传到 Supabase Storage 的 'qr-codes' 存储桶
2. WHEN 图片上传到 Supabase Storage，THE Image_Storage SHALL 返回公开可访问的图片 URL（格式：https://ksstnzetvktwcoeyheqv.supabase.co/storage/v1/object/public/qr-codes/{filename}）
3. WHEN 保存配置，THE Config_Storage SHALL 使用 UPSERT 操作将配置保存到 system_config 表（key='recharge_qr'）
4. WHEN 从数据库加载配置，THE Config_Storage SHALL 查询 system_config 表中 key='recharge_qr' 的记录并返回 value 字段
5. IF 数据库操作失败，THEN THE System SHALL 记录错误日志并向用户显示友好的错误提示（如"配置保存失败，请稍后重试"）

### 需求 5：配置数据的一致性和完整性

**用户故事：** 作为系统架构师，我希望确保配置数据的一致性和完整性，以便系统能够可靠运行。

#### 验收标准

1. WHEN 保存新的二维码配置，THE Config_Storage SHALL 覆盖旧的配置值
2. WHEN 读取配置值，THE Config_Storage SHALL 返回最新保存的配置
3. WHEN 配置值为 null 或 undefined，THE System SHALL 将其视为未配置状态
4. WHEN 配置的图片 URL 无效或无法访问，THE System SHALL 显示默认占位图而不是错误
5. THE System SHALL 确保配置的读写操作是原子性的，避免并发冲突

### 需求 6：用户体验优化

**用户故事：** 作为用户，我希望充值流程流畅且有清晰的反馈，以便我能够顺利完成充值操作。

#### 验收标准

1. WHEN 二维码正在加载时，THE Wallet_Component SHALL 显示骨架屏或加载动画
2. WHEN 二维码加载完成，THE Wallet_Component SHALL 平滑过渡到显示二维码图片
3. WHEN 用户点击二维码图片，THE Wallet_Component SHALL 支持放大查看功能
4. WHEN 管理员上传二维码时，THE Admin_Dashboard SHALL 显示上传进度指示器
5. WHEN 任何操作失败时，THE System SHALL 显示具体的错误信息而不是通用错误

### 需求 7：图片格式和大小限制

**用户故事：** 作为系统管理员，我希望系统能够限制上传的图片格式和大小，以便保证系统性能和用户体验。

#### 验收标准

1. WHEN 管理员选择上传文件，THE System SHALL 验证文件大小不超过 5MB
2. WHEN 文件大小超过限制，THE System SHALL 拒绝上传并提示用户文件过大
3. WHEN 文件格式不是图片格式，THE System SHALL 拒绝上传并提示用户选择有效的图片文件
4. WHEN 图片尺寸过大（超过 2000x2000 像素），THE System SHALL 提示用户但允许上传
5. THE System SHALL 支持常见图片格式：JPEG, PNG, GIF, WebP

### 需求 8：配置的安全性

**用户故事：** 作为安全工程师，我希望确保配置功能的安全性，以便防止未授权访问和恶意操作。

#### 验收标准

1. WHEN 用户尝试上传二维码，THE System SHALL 验证用户具有管理员权限
2. WHEN 非管理员用户尝试访问上传功能，THE System SHALL 拒绝操作并返回权限错误
3. WHEN 上传图片文件，THE System SHALL 验证文件内容确实是图片而不是伪装的恶意文件
4. WHEN 保存配置到数据库，THE System SHALL 使用参数化查询防止 SQL 注入
5. WHEN 返回图片 URL，THE System SHALL 确保 URL 指向受信任的存储域名
