# 🌤️ Feel Today - 智能穿搭助手

基于实时天气的智能穿搭推荐应用，专为跑步和通勤场景设计。

## 功能特性

### 🌦️ 天气与穿搭
- **实时天气**：自动定位或手动选择城市，获取实时天气数据
- **智能推荐**：基于温度、风速、降水等条件，推荐最合适的穿搭组合
- **多层穿搭**：支持上衣多层层叠（内层+中层+外层），灵活应对温差
- **场景适配**：区分通勤和跑步场景，跑步推荐考虑出汗和保暖平衡
- **保暖覆盖率**：算法确保总保暖值在目标范围 80%-120% 内

### 👕 衣柜管理
- **虚拟衣柜**：新用户自动使用 26 件虚拟衣物填充推荐，无需等待录入
- **快速录入**：
  - 4 套预设模板（跑步基础/通勤基础/冬季跑步/雨天跑步）一键批量添加
  - 复制现有衣物快速创建相似物品
  - 分类单独添加，支持 11 种上衣、3 种下装、3 种袜子、5 种鞋子、4 种帽子
- **衣物属性**：保暖值、防水、防风、口袋、适用场景等完整属性
- **平台推荐标记**：虚拟衣物添加后标记"平台推荐"，编辑后自动去除

### 🏃 跑步专属
- **跑步类型**：支持有氧跑、长距离、间歇跑三种类型，推荐策略不同
- **分层推荐**：根据强度和天气自动计算最佳层数（1-3 层）
- **推荐理由**：详细说明当前穿搭的保暖逻辑

### 📱 用户体验
- **流畅交互**：标签页切换无闪烁，本地优先+后台同步
- **手势操作**：衣柜卡片点击显示操作按钮（编辑/复制/删除）
- **快速添加**：衣柜页悬浮按钮，一键进入模板选择
- **Toast 反馈**：操作结果即时提示，深色背景高对比度

### 🎨 个性化
- **深色/浅色主题**：跟随系统或手动切换
- **中英文双语**：完整国际化支持
- **Apple Weather 风格**：现代简洁的视觉设计

### ☁️ 数据同步
- **游客模式**：无需注册，本地存储数据
- **账号同步**：登录后数据同步至云端，多设备共享
- **历史记录**：保存每日穿搭，支持舒适度评分

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **国际化**: react-i18next
- **后端**: Supabase (PostgreSQL + Auth)
- **天气**: OpenWeather API / 高德天气
- **部署**: Vercel

## 快速开始

### 环境要求
- Node.js >= 18
- Yarn 或 npm

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd feel_today

# 安装依赖
yarn install

# 开发模式
yarn dev

# 构建
yarn build
```

### 环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# 天气 API（至少配置一个）
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-openweather-key
NEXT_PUBLIC_AMAP_KEY=your-gaode-key
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── wardrobe/          # 衣柜管理页面
│   ├── history/           # 历史穿搭页面
│   └── page.tsx           # 主页面（穿搭推荐）
├── components/            # React 组件
│   ├── OutfitTab.tsx      # 穿搭推荐标签页
│   ├── SettingsTab.tsx    # 设置标签页
│   └── ClothingCard.tsx   # 衣物卡片组件
├── store/                 # Zustand 状态管理
│   └── appStore.ts
├── i18n/                  # 国际化
│   └── locales/
│       ├── zh.json       # 中文
│       └── en.json       # 英文
├── lib/                   # 工具函数
│   ├── demo-wardrobe.ts  # 26件虚拟衣物数据
│   ├── recommendation.ts # 推荐算法核心
│   ├── supabase.ts       # 数据库操作
│   └── weather.ts        # 天气 API
├── types/                 # TypeScript 类型
└── supabase/              # 数据库迁移和配置
```

## 核心算法

### 保暖计算
- **身体部位权重**：上衣 1.0 / 下装 0.6 / 袜子 0.2 / 鞋子 0 / 帽子 0.3
- **目标保暖值**：基于体感温度和场景计算
- **覆盖率**：(实际保暖 / 目标保暖) 控制在 80%-120%

### 推荐逻辑
1. 根据天气条件筛选可用衣物（防水/防风需求）
2. 用户衣物优先，不足时自动混入虚拟衣物
3. 生成多层上衣组合（最多 3 层）
4. 计算总保暖值，选择最接近目标的组合

## 截图

### 穿搭推荐
![穿搭推荐页](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9hpp98xOBt0pmcbCLd8aGfre78UBAACZRgAArXIQFW3P84HUaGZgzoE.png)
*根据天气智能推荐今日穿搭，支持多层上衣搭配*

### 推荐详情
![推荐详情](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9dpp98uTYWVJq0UkkxRgju4npW0rgACZBgAArXIQFX8GOpO2BfxBjoE.png)
*详细展示每层穿搭及保暖覆盖率，说明推荐理由*

### 空衣柜引导
![空衣柜引导](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9Zpp98rW_VysvZx5ehxMO-1rZioCAACYxgAArXIQFXuD4tp1_aZGjoE.png)
*新用户可使用四套预设模板快速填充衣柜*

### 衣柜管理
![衣柜管理](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9Vpp98ptAdhzq1vvoB87gl0zf0bJgACYhgAArXIQFX4LJQDYjFpKDoE.png)
*按分类管理衣物，点击卡片可编辑、复制或删除*

### 模板快速添加
![模板快速添加](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9Rpp98mnE0K1_EN7AYy-KZknouqcgACYRgAArXIQFVgLrg8dHkITDoE.png)
*一键添加套装，或按分类单独添加衣物*

### 历史记录
![历史记录](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9lpp9814BYG_CUis7rhDASLz6FJRgACZhgAArXIQFUecK37KNA08DoE.png)
*查看历史穿搭，标记舒适度，复制喜欢的搭配*

### 设置页
![设置页](https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAERa9ppp983fjedr3uZfn_XRb4KMxwTngACZxgAArXIQFUsy6tjHqNeHzoE.png)
*切换主题、语言，管理默认跑步类型和账号*

## TODO
1. 增加[PM2.5](https://aqicn.org/data-platform/api/H6321/cn/)展示
2. 跑步路线推荐，链接至[parco](https://parco.run/)

## License

MIT
