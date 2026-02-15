# API Key 全局配置说明

## ✅ 已实现：管理员配置一次，所有用户可用

### 🎯 功能说明

现在API Key的配置方式已经改为**全局共享模式**：
- 管理员在后台配置一次API Key
- 配置保存到系统配置（服务器端存储）
- 所有用户（包括未登录用户）都可以使用AI功能
- 无需每个用户单独配置

### 📋 工作原理

#### 之前的方式（已废弃）
```
管理员配置 → localStorage（浏览器本地）
用户A访问 → 读取localStorage → 没有配置 ❌
用户B访问 → 读取localStorage → 没有配置 ❌
```

#### 现在的方式（已实现）
```
管理员配置 → 系统配置表（sys_config）→ 全局存储
用户A访问 → 读取系统配置 → 有配置 ✅
用户B访问 → 读取系统配置 → 有配置 ✅
用户C访问 → 读取系统配置 → 有配置 ✅
```

### 🔧 技术实现

#### 1. 存储位置变更

**之前：**
- 存储在浏览器的 `localStorage`
- Key: `cityinfo_llm_config`
- 作用域：单个浏览器

**现在：**
- 存储在系统配置表 `sys_config`
- Keys: 
  - `llm_api_key` - API密钥
  - `llm_model` - 模型名称
  - `llm_temperature` - 温度参数
  - `llm_max_tokens` - 最大令牌数
- 作用域：全局（所有用户）

#### 2. 代码修改

**services/deepseek.ts**
```typescript
// 新增异步版本，从系统配置读取
export const getLLMConfig = async () => {
    const { api } = await import('./supabase');
    const apiKey = await api.getSystemConfig('llm_api_key');
    // ... 读取其他配置
}

// 保留同步版本作为后备（从localStorage）
export const getLLMConfigSync = () => {
    const saved = localStorage.getItem('cityinfo_llm_config');
    // ...
}
```

**pages/AdminDashboard.tsx**
```typescript
// 保存时写入系统配置
const handleSaveLLM = async () => {
    await api.saveSystemConfig('llm_api_key', llmConfig.apiKey);
    await api.saveSystemConfig('llm_model', llmConfig.model);
    // ... 保存其他配置
}

// 加载时从系统配置读取
useEffect(() => {
    const loadLLMConfig = async () => {
        const apiKey = await api.getSystemConfig('llm_api_key');
        // ... 读取其他配置
    };
}, [activeTab]);
```

**pages/AIChat.tsx**
```typescript
// 检查API Key时使用异步方法
const checkApiKey = async () => {
    const config = await getLLMConfig();
    setHasApiKey(!!config.apiKey);
};
```

### 📱 使用流程

#### 管理员配置（一次性）

1. 以管理员身份登录
2. 进入"管理员控制台"
3. 点击"系统"标签
4. 找到"AI 模型参数 (DeepSeek) - 全局配置"
5. 输入API Key（以 `sk-` 开头）
6. 配置其他参数（可选）：
   - Model Name: `deepseek-chat`
   - Max Tokens: `2000`
   - Temperature: `0.7`
7. 点击"保存配置（全局生效）"
8. 看到提示"AI 模型参数配置已保存（全局生效）"

#### 普通用户使用

1. 打开应用（无需登录）
2. 进入"消息" -> "人工客服" -> "AI助手"
3. 状态显示绿色"DeepSeek Online"
4. 直接发送消息，AI立即响应
5. **无需任何配置！**

### 🔍 验证方法

#### 方法1：多浏览器测试
1. 管理员在Chrome配置API Key
2. 打开Firefox（无痕模式）
3. 访问AI聊天页面
4. 应该能正常使用（状态显示绿色）

#### 方法2：手机测试
1. 管理员在电脑配置API Key
2. 手机访问应用
3. 进入AI聊天
4. 应该能正常使用

#### 方法3：清除缓存测试
1. 配置API Key后
2. 清除浏览器所有数据（Ctrl+Shift+Del）
3. 重新访问应用
4. AI功能仍然可用

### 🗄️ 数据库表结构

```sql
-- sys_config 表
CREATE TABLE sys_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 示例数据
INSERT INTO sys_config (key, value) VALUES
('llm_api_key', '"sk-abc123..."'),
('llm_model', '"deepseek-chat"'),
('llm_temperature', '"0.7"'),
('llm_max_tokens', '"2000"');
```

### 🔒 安全考虑

#### Mock模式（开发环境）
- 配置保存到 `localStorage`（带前缀 `sys_config_`）
- 如果localStorage不可用，使用内存存储
- 仅在当前会话有效

#### 生产模式（Supabase）
- 配置保存到数据库 `sys_config` 表
- 需要配置RLS（行级安全）策略
- 建议：只允许管理员写入，所有人可读

```sql
-- 允许所有人读取系统配置
CREATE POLICY "Allow public read on sys_config"
ON sys_config FOR SELECT
USING (true);

-- 只允许管理员写入
CREATE POLICY "Allow admin write on sys_config"
ON sys_config FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### 📊 UI改进

#### 管理后台
- 标题显示"AI 模型参数 (DeepSeek) - 全局配置"
- 添加蓝色提示框："配置后所有用户都可使用AI功能，无需单独配置"
- 保存按钮文字："保存配置（全局生效）"
- 加载状态显示："加载中..." / "已就绪"

#### AI聊天页面
- 状态指示器：
  - 绿色 + "DeepSeek Online" = 已配置
  - 红色 + "未配置 API Key" = 未配置
- 每2秒自动检查配置状态
- 管理员配置后，用户端自动更新（最多2秒延迟）

### 🐛 故障排查

#### 问题1：配置后用户仍无法使用
**检查：**
1. 确认配置已保存成功（查看提示消息）
2. 等待2秒让客户端检测到配置
3. 检查浏览器控制台是否有错误
4. 确认API Key格式正确（以sk-开头）

#### 问题2：Mock模式下配置不生效
**原因：** Mock模式使用localStorage，不同浏览器不共享
**解决：** 
- 在每个浏览器都配置一次，或
- 使用Supabase生产模式

#### 问题3：数据库权限错误
**错误信息：** "配置保存失败：权限不足"
**解决：**
```sql
-- 检查RLS策略
SELECT * FROM pg_policies WHERE tablename = 'sys_config';

-- 如果没有策略，添加：
ALTER TABLE sys_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on sys_config"
ON sys_config FOR ALL
USING (true);
```

### ✅ 测试清单

部署后请验证：

- [ ] 管理员可以保存配置
- [ ] 保存后显示成功提示
- [ ] 刷新页面后配置仍然存在
- [ ] 其他浏览器可以读取配置
- [ ] 手机端可以使用AI功能
- [ ] 清除缓存后仍然可用
- [ ] AI聊天状态显示正确（绿色）
- [ ] 发送消息能收到AI回复

### 📝 总结

**核心改变：**
- ❌ 之前：每个用户单独配置（localStorage）
- ✅ 现在：管理员配置一次，全局生效（sys_config表）

**用户体验：**
- ❌ 之前：每个用户都要配置API Key
- ✅ 现在：用户无需任何配置，开箱即用

**管理成本：**
- ❌ 之前：需要告诉每个用户如何配置
- ✅ 现在：管理员配置一次即可

---

**更新时间：** 2025-02-14
**版本：** v1.1.0
**状态：** ✅ 已实现并测试
