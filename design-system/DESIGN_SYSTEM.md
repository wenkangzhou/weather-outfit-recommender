# FeelToday Design System

## 设计哲学

> 冷静 · 数据感 · 工具属性 · 克制 · 不社交化

一款为个人决策而生的天气穿搭工具。界面应当像精密仪器一样可靠，像晨间空气一样清新。

### 气质关键词
- **冷静 (Calm)**：不打扰，不聒噪，信息密度恰到好处
- **数据感 (Data-driven)**：数字清晰可读，状态一目了然
- **工具属性 (Tool)**：功能优先，装饰最小化
- **克制 (Restrained)**：不过度设计，每个元素都有目的
- **不社交化 (Anti-social)**：没有点赞、分享、评论，纯粹的个人体验

### 视觉参考
- **Linear**：极致的间距控制，呼吸感
- **Apple Weather**：液态玻璃，自然过渡
- **Vercel**：技术感与优雅的平衡

---

## 色彩系统

### 主色板 (Primitives)

```
Background:     #000000 (纯黑基底)
Surface:        #0A0A0A / #111111 / #1A1A1A (层级递进)
Border:         rgba(255,255,255,0.08) / rgba(255,255,255,0.12)
Text Primary:   #FFFFFF
Text Secondary: rgba(255,255,255,0.6)
Text Tertiary:  rgba(255,255,255,0.35)
```

### 功能色 (Semantic)

```
Accent Blue:    #3B82F6 (信息、选中)
Accent Cyan:    #22D3EE (高亮、活跃)
Accent Green:   #10B981 (成功、舒适)
Accent Amber:   #F59E0B (警告、注意)
Accent Rose:    #F43F5E (错误、删除)
```

### 数据可视化色

```
Cold:     #60A5FA (冷色调)
Cool:     #34D399 (凉爽)
Perfect:  #A78BFA (舒适)
Warm:     #FB923C (温暖)
Hot:      #F87171 (炎热)
```

---

## 字体系统

### 字体族
```
Primary:   -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif
Monospace: "SF Mono", "JetBrains Mono", monospace (用于数字)
```

### 字号规范

| 层级 | 大小 | 字重 | 行高 | 用途 |
|-----|------|-----|------|-----|
| Display | 72px | 300 | 1.0 | 大温度显示 |
| Title | 28px | 600 | 1.2 | 页面标题 |
| Headline | 20px | 600 | 1.3 | 卡片标题 |
| Body | 16px | 400 | 1.5 | 正文 |
| Label | 14px | 500 | 1.4 | 标签、按钮 |
| Caption | 12px | 400 | 1.4 | 辅助文字 |
| Data | 32px | 300 | 1.0 | 数据数字 |

### 数字专用样式
```css
font-variant-numeric: tabular-nums;
letter-spacing: -0.02em;
```

---

## 间距系统

基于 4px 网格，使用 1.5 倍率递进：

```
4px   - 最小间隙
6px   - 紧凑间隙
8px   - 默认间隙
12px  - 组件内部
16px  - 卡片内边距
24px  - 区块间距
32px  - 大区块
48px  - 页面边距
```

---

## 圆角系统

```
4px   - 标签、小按钮
8px   - 输入框
12px  - 按钮
16px  - 卡片
24px  - 大卡片、弹窗
Full  - Pill、圆形按钮
```

---

## 阴影系统

```
Small:   0 1px 2px rgba(0,0,0,0.2)
Medium:  0 4px 12px rgba(0,0,0,0.3)
Large:   0 8px 30px rgba(0,0,0,0.4)
Glow:    0 0 20px rgba(59,130,246,0.3) (强调光晕)
```

---

## 组件规范

### Button

**Primary**
- Background: #3B82F6
- Text: #FFFFFF
- Padding: 12px 20px
- Border Radius: 12px
- Hover: brightness(1.1)
- Active: scale(0.98)

**Secondary**
- Background: rgba(255,255,255,0.08)
- Border: 1px solid rgba(255,255,255,0.12)
- Text: #FFFFFF

**Ghost**
- Background: transparent
- Text: rgba(255,255,255,0.6)
- Hover: rgba(255,255,255,0.08)

### Card

**Surface Card**
- Background: #111111
- Border: 1px solid rgba(255,255,255,0.08)
- Border Radius: 16px
- Padding: 16px

**Glass Card**
- Background: rgba(255,255,255,0.03)
- Backdrop Filter: blur(20px)
- Border: 1px solid rgba(255,255,255,0.08)
- Border Radius: 16px

### Input

**Text Field**
- Background: rgba(255,255,255,0.05)
- Border: 1px solid rgba(255,255,255,0.08)
- Border Radius: 12px
- Padding: 14px 16px
- Focus: border-color #3B82F6

### Slider

**Track**
- Background: rgba(255,255,255,0.1)
- Height: 4px
- Border Radius: 2px

**Thumb**
- Size: 20px
- Background: #FFFFFF
- Shadow: 0 2px 8px rgba(0,0,0,0.3)

---

## 动画规范

### 时长
```
Fast:    150ms (微交互)
Normal:  250ms (状态变化)
Slow:    350ms (页面过渡)
```

### 缓动函数
```
Ease:           cubic-bezier(0.4, 0, 0.2, 1)
Ease Out:       cubic-bezier(0, 0, 0.2, 1)
Ease In Out:    cubic-bezier(0.4, 0, 0.2, 1)
Spring:         cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## 布局原则

### 页面结构
```
[Status Bar] - 系统状态
[Header]     - 大标题 + 操作
[Content]    - 可滚动内容
[Bottom Bar] - Tab 导航 (固定)
```

### 内容区
- 最大宽度: 430px (移动端优先)
- 水平边距: 20px
- 垂直间距: 24px

### 信息层级
1. **Primary**: 当前温度、选中状态
2. **Secondary**: 辅助数据、标签
3. **Tertiary**: 说明文字、占位符

---

## 天气主题

根据天气自动切换的微妙色调：

```
Sunny:   蓝青渐变 + 暖色点缀
Cloudy:  紫灰渐变 + 冷色基调
Rainy:   深灰蓝 + 青色高光
Night:   深蓝紫 + 星光点缀
```

背景渐变应当极其微妙，不抢夺内容焦点。
