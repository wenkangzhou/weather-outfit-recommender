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
- **Notion**：简洁的功能性设计

---

## 色彩系统

### 浅色模式 (Light Mode)

浅色模式采用**纯净白底 + 微妙的灰度层级**，营造清爽、专业的工具感。

```
Background:     #FFFFFF (纯净白)
Surface:        #F5F5F5 / #F0F0F0 / #E8E8E8 (层级递进)
Border:         rgba(0, 0, 0, 0.06) / rgba(0, 0, 0, 0.1)
Text Primary:   #111111 (近黑，柔和不刺眼)
Text Secondary: rgba(0, 0, 0, 0.5)
Text Tertiary:  rgba(0, 0, 0, 0.35)
```

**浅色模式特点：**
- 纯白背景，像一张纸
- 深色文字，高对比度但柔和
- 边框极淡，几乎不可见
- 阴影轻微，营造深度感

### 深色模式 (Dark Mode)

深色模式采用**纯黑基底 + 微妙的灰度层级**，营造沉浸、专注的氛围。

```
Background:     #000000 (纯黑)
Surface:        #0A0A0A / #111111 / #1A1A1A (层级递进)
Border:         rgba(255, 255, 255, 0.06) / rgba(255, 255, 255, 0.1)
Text Primary:   #FFFFFF (纯白)
Text Secondary: rgba(255, 255, 255, 0.55)
Text Tertiary:  rgba(255, 255, 255, 0.35)
```

**深色模式特点：**
- OLED 纯黑，省电且沉浸
- 白色文字，清晰锐利
- 边框微光，勾勒结构
- 玻璃质感，现代感强

### 功能色 (Semantic) - 双模式通用

```
Accent Blue:    #0066FF (浅色) / #3B82F6 (深色)
Accent Cyan:    #0891B2 (浅色) / #22D3EE (深色)
Accent Green:   #059669 (浅色) / #10B981 (深色)
Accent Amber:   #D97706 (浅色) / #F59E0B (深色)
Accent Rose:    #DC2626 (浅色) / #F43F5E (深色)
Accent Purple:  #7C3AED (浅色) / #A78BFA (深色)
```

**浅色模式功能色调整：**
- 饱和度略微降低，避免过于鲜艳
- 明度降低，与白色背景协调

### 数据可视化色 - 双模式适配

| 温度 | 浅色模式 | 深色模式 |
|-----|---------|---------|
| Cold | #3B82F6 | #60A5FA |
| Cool | #10B981 | #34D399 |
| Perfect | #8B5CF6 | #A78BFA |
| Warm | #F59E0B | #FB923C |
| Hot | #EF4444 | #F87171 |

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

### 浅色模式阴影
```
Small:   0 1px 2px rgba(0, 0, 0, 0.04)
Medium:  0 4px 12px rgba(0, 0, 0, 0.08)
Large:   0 8px 30px rgba(0, 0, 0, 0.12)
```

### 深色模式阴影
```
Small:   0 1px 2px rgba(0, 0, 0, 0.3)
Medium:  0 4px 12px rgba(0, 0, 0, 0.4)
Large:   0 8px 30px rgba(0, 0, 0, 0.5)
Glow:    0 0 20px rgba(59, 130, 246, 0.3)
```

---

## 组件规范

### Button

**Primary - 浅色**
- Background: #0066FF
- Text: #FFFFFF
- Hover: brightness(1.05)

**Primary - 深色**
- Background: #3B82F6
- Text: #FFFFFF
- Hover: brightness(1.1)

**Secondary - 浅色**
- Background: #F5F5F5
- Border: 1px solid rgba(0, 0, 0, 0.08)
- Text: #111111

**Secondary - 深色**
- Background: rgba(255, 255, 255, 0.08)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Text: #FFFFFF

### Card

**浅色模式 Card**
- Background: #FFFFFF
- Border: 1px solid rgba(0, 0, 0, 0.06)
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.04)

**深色模式 Card**
- Background: #111111
- Border: 1px solid rgba(255, 255, 255, 0.08)
- 无阴影，靠边框勾勒

### Input

**浅色模式 Input**
- Background: #F5F5F5
- Border: 1px solid rgba(0, 0, 0, 0.06)
- Focus: border-color #0066FF

**深色模式 Input**
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid rgba(255, 255, 255, 0.08)
- Focus: border-color #3B82F6

---

## 天气主题 - 双模式适配

### 浅色模式天气色

```
Sunny:   蓝白渐变，清新明亮
Cloudy:  灰白色调，柔和沉稳  
Rainy:   蓝灰色调，冷静收敛
Night:   深蓝紫调，深邃宁静
```

**浅色模式天气背景特点：**
- 使用渐变色营造氛围
- 但保持整体明亮
- 文字始终深色，确保可读性

### 深色模式天气色

```
Sunny:   深蓝渐变 + 暖色点缀
Cloudy:  紫灰渐变 + 冷色基调
Rainy:   深灰蓝 + 青色高光
Night:   深蓝紫 + 星光点缀
```

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
Spring:         cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## 模式切换原则

1. **瞬间切换**：主题切换应该是瞬时的，没有过渡动画
2. **系统跟随**：默认跟随系统设置
3. **记忆选择**：用户手动选择后记住偏好
4. **组件自适应**：所有组件必须同时支持两种模式

---

## 实现要点

### Tailwind 配置
- 使用 CSS 变量定义颜色
- darkMode: 'class' 策略
- 组件使用语义化颜色名称

### CSS 变量命名
```css
--background: 背景色
--foreground: 前景文字色
--muted: 次级背景
--muted-foreground: 次级文字
--border: 边框色
--accent: 强调色
```
