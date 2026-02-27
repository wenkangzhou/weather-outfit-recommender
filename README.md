# 🌤️ Weather Style - 智能穿搭

基于天气的智能穿搭推荐应用。

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **状态管理**: Zustand
- **国际化**: react-i18next
- **后端**: Supabase
- **天气**: OpenWeather API

## 快速开始

### 使用 Yarn（推荐）

```bash
# 安装依赖
yarn install

# 开发
yarn dev

# 构建
yarn build
```

### 环境变量

复制 `.env.local.example` 为 `.env.local`，填入：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_OPENWEATHER_API_KEY`

## 项目结构

```
├── app/                    # Next.js App Router
├── components/            # React 组件
├── store/                 # Zustand 状态管理
├── i18n/                  # 国际化配置
│   └── locales/
│       ├── zh.json       # 中文翻译
│       └── en.json       # 英文翻译
├── lib/                   # 工具函数
├── types/                 # TypeScript 类型
└── supabase/              # 数据库配置
```

## 功能特性

- ☀️ 实时天气 + 地理位置定位
- 👕 智能穿搭推荐（通勤/跑步场景）
- 🌓 深色/浅色主题切换
- 🌐 中英文多语言支持
- 🎨 Apple Weather 风格 UI
- 🎮 预留 Three.js 3D 展示区

## License

MIT
