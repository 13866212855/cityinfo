# CityInfo - 城市脉动

![Version](https://img.shields.io/badge/version-1.2.0-blue) ![Status](https://img.shields.io/badge/status-active-success) ![Tech](https://img.shields.io/badge/react-19-cyan)

**CityInfo** 是一个现代化的同城信息服务平台（H5），致力于连接本地用户与商家。它集成了信息发布、本地服务查找、即时通讯以及 AI 智能助手等功能，采用领域驱动设计（DDD）思想构建。

## ✨ 核心功能

### 👤 用户端
*   **信息浏览**：支持房产、招聘、二手、服务等 10+ 个分类的浏览与搜索。
*   **发布系统**：支持发布同城信息，集成 **DeepSeek AI** 自动生成吸引人的描述文案。
*   **LBS 定位**：基于 Leaflet 地图的地理位置选择与距离计算。
*   **个人中心**：管理我的发布、订单、钱包及个人资料编辑。
*   **即时通讯**：与商家或 HR 进行实时聊天（支持消息持久化）。

### 🤖 AI 能力
*   **智能助手**：内置 DeepSeek 大模型助手，支持生活咨询与闲聊。
*   **文案生成**：发布信息时，AI 可根据标题和关键词自动撰写详情。
*   **智能客服**：客服聊天中集成 AI 自动回复功能（10秒无响应自动接管）。

### 🛠 管理端
*   **Dashboard**：管理员控制台，查看数据概览。
*   **客户咨询**：统一回复用户咨询消息。
*   **系统配置**：
    *   动态配置首页滚动公告。
    *   **LLM 配置**：在线修改 DeepSeek API Key、模型版本 (Chat/Coder) 及温度参数。
    *   平台开关：一键开启/关闭注册、维护模式等。

---

## 🏗 技术栈

*   **前端框架**: React 19, TypeScript
*   **样式库**: Tailwind CSS
*   **地图组件**: Leaflet
*   **图标库**: FontAwesome 6
*   **后端服务 (BaaS)**: Supabase (PostgreSQL + Realtime)
*   **AI 模型**: DeepSeek API

---

## 🚀 本地开发指南

### 1. 环境准备
确保本地已安装 Node.js (v16+) 和 npm/yarn。

### 2. 安装依赖
由于本项目基于 ESM 模块直接引入 (index.html importmap) 或标准构建工具，请确保安装基础 React 开发依赖：

```bash
npm install
# 或
yarn install
```

### 3. 配置数据库 (Supabase)
本项目依赖 Supabase 进行数据存储。请在 Supabase SQL Editor 中运行以下建表语句：

```sql
-- 1. 帖子表
create table if not exists posts (
  id text primary key,
  title text,
  description text,
  category text,
  price text,
  images jsonb,
  tags jsonb,
  location text,
  lat float,
  lng float,
  distance text,
  contact_phone text,
  publish_time bigint,
  view_count int,
  is_sticky boolean,
  merchant_id text,
  author_name text,
  avatar_url text,
  attributes jsonb
);

-- 2. 用户表
create table if not exists users (
  id text primary key,
  phone text unique,
  nickname text,
  avatar_url text,
  is_verified boolean,
  register_time bigint,
  is_admin boolean,
  real_name text,
  qq text,
  wechat text,
  address text
);

-- 3. 消息表
create table if not exists messages (
  id text primary key,
  user_id text,
  role text,
  content text,
  timestamp bigint
);
```

### ⚠️ 4. 配置图片上传权限 (重要)

由于 SQL Editor 可能遇到权限问题（Error 42501），建议直接使用 **Dashboard UI** 进行配置：

1.  **进入 Storage 菜单**：点击左侧导航栏的 Storage 图标。
2.  **创建存储桶**：
    *   点击 "New Bucket"。
    *   Name 输入 `pic`。
    *   **务必开启 "Public Bucket" 开关**。
    *   点击 "Save"。
3.  **配置策略 (Policies)**：
    *   点击 `pic` 桶旁边的 "Configuration" -> "Policies"。
    *   点击 "New Policy" (针对 pic 桶)。
    *   选择 "For full customization"。
    *   Name 输入 `Allow public uploads`。
    *   **Allowed operations**: 勾选 `INSERT` 和 `SELECT`。
    *   点击 "Review" -> "Save"。

---

## 🐳 生产级部署 (Docker)

本项目为静态单页应用 (SPA)，建议使用 Nginx 容器进行托管。

### 1. 创建 Dockerfile
在项目根目录下创建一个名为 `Dockerfile` 的文件：

```dockerfile
# 第一阶段：构建
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 第二阶段：Nginx 托管
FROM nginx:alpine
# 将构建产物复制到 Nginx 目录 (假设构建输出目录为 build 或 dist)
COPY --from=build /app/build /usr/share/nginx/html
# 暴露 80 端口
EXPOSE 80
# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 构建镜像
运行以下命令构建 Docker 镜像：

```bash
docker build -t cityinfo-app:v1 .
```

### 3. 运行容器 (Run Command)
使用以下命令启动容器。

```bash
docker run -d \
  --name cityinfo-container \
  -p 8080:80 \
  --restart always \
  cityinfo-app:v1
```

现在，可以通过浏览器访问 `http://localhost:8080` 或服务器 IP 使用应用。

---

## 🔑 管理员账号
*   **入口**：点击“我的” -> “登录/注册”
*   **账号**：`admin`
*   **验证码**：`admin123`
*   **功能**：登录后在“我的”页面将出现“管理员后台”入口。

---

## 📱 移动端适配
本项目专为移动端 H5 设计，采用了 `maximum-scale=1.0, user-scalable=no` 视口设置，推荐在手机浏览器或 Chrome 开发者工具的移动端模式下浏览。