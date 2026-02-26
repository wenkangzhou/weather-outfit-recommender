# 🌤️ 今日穿搭推荐

基于天气的智能穿搭助手，支持日常通勤和跑步两种场景。

## 功能特性

- ☀️ **实时天气**: 自动获取当前位置天气数据
- 👕 **智能推荐**: 根据温度、湿度、风力推荐合适穿搭
- 🏃 **场景切换**: 支持日常通勤和跑步两种场景
- 🔄 **换季节点**: 考虑由冬入春、由秋入冬的特殊体感
- 👤 **个性化**: 支持个人体感偏好设置
- 📱 **移动端优化**: 单页面应用，适合手机使用

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Storage)
- **天气**: OpenWeather API
- **部署**: Vercel

## 快速开始

### 1. 克隆项目并安装依赖

```bash
cd feel_today
pnpm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填入你的 API 密钥：

```bash
cp .env.local.example .env.local
```

需要配置的变量：
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `NEXT_PUBLIC_OPENWEATHER_API_KEY`: OpenWeather API 密钥

### 3. 设置 Supabase 数据库

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 打开 SQL Editor，执行 `supabase/schema.sql` 中的 SQL 语句
3. 创建 Storage Bucket：`clothing-images`（Public）

### 4. 运行开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 部署到 Vercel

### 方法一：Vercel CLI

```bash
pnpm add -g vercel
vercel
```

### 方法二：GitHub 集成

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 自动部署

## 使用指南

### 首次使用

1. 进入"我的"页面
2. 在"个性化设置"中设置你的位置和体感偏好
3. 在"我的衣柜"中录入你的衣物

### 录入衣物

- 支持四类：上衣、下装、袜子、鞋子
- 设置保暖度（1-10）
- 标记防水、防风属性

### 获取推荐

- 在"今日穿搭"页面查看推荐
- 可切换"通勤"和"跑步"场景
- 点击刷新按钮重新生成推荐
- 点击单品可替换为其他备选

## 个性化设置说明

| 设置项 | 说明 |
|--------|------|
| 怕冷程度 | 数值越高，低温时推荐越厚的衣服 |
| 怕热程度 | 数值越高，高温时推荐越薄的衣服 |
| 出汗程度 | 跑步时根据出汗量调整推荐 |
| 对风敏感 | 开启后风大时会加强防风推荐 |

## 推荐算法说明

算法综合考虑以下因素：
- 实际温度和体感温度
- 湿度（湿冷/闷热影响）
- 风力（风寒效应）
- 是否降雨
- 换季节点（体感偏差）
- 个人体感偏好
- 运动产热（跑步场景）

## 文件结构

```
my-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面（含 Tab 切换）
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── OutfitTab.tsx      # 穿搭推荐 Tab
│   ├── SettingsTab.tsx    # 设置管理 Tab
│   └── ClothingCard.tsx   # 衣物卡片
├── lib/                   # 工具函数
│   ├── supabase.ts        # Supabase 客户端
│   ├── weather.ts         # 天气 API
│   └── recommendation.ts  # 推荐算法
├── types/                 # TypeScript 类型
│   └── index.ts
├── supabase/              # 数据库配置
│   └── schema.sql         # 表结构
└── public/                # 静态资源
```

## License

MIT
