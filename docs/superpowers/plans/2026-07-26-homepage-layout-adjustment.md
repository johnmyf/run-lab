# 首页九宫格布局调整 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整首页 3×3 九宫格布局，移除一个"待开发"，新增"配速计算器"，重新排列"跑步课表""论坛""成就体系"的位置。

**Architecture:** 纯前端布局调整，不涉及后端或状态管理。只需修改 Vue 数据数组顺序、Figma JSON 设计稿的节点顺序、HTML 预览的 DOM 顺序，以及 pages.json 路由和新建占位页面。

**Tech Stack:** Vue 3 (uni-app), Figma JSON 设计规范

## Global Constraints

- 所有 CSS 使用 rpx 单位（uni-app 规范），HTML 预览文件使用 px 单位
- 配速计算器颜色使用用户确认的浅蓝 `#00BCD4`，CSS class 名 `cyan`
- 严格遵循 3×3 九宫格、每行 3 列的布局结构
- 配速计算器路径为 `/pages/pace-calculator/index`

---

### Task 1: 更新 Vue 首页 (`src/pages/index/index.vue`)

**Files:**
- Modify: `src/pages/index/index.vue`

**Interfaces:**
- Consumes: 现有 `menuItems` 数组结构、`goToPage` 函数
- Produces: 更新后的 `menuItems` 数组（新顺序含配速计算器）

- [ ] **Step 1: 调整 menuItems 数组顺序**

将 `menuItems` 数组调整为：
```js
const menuItems = [
  { id: 1, title: '跑力值计算', icon: '⚡', colorClass: 'blue', path: '/pages/running-power/index' },
  { id: 2, title: '成绩预测', icon: '🏆', colorClass: 'red', path: '/pages/performance-prediction/index' },
  { id: 3, title: '心率计算', icon: '❤️', colorClass: 'green', path: '/pages/heart-rate/index' },
  { id: 4, title: '配速计算器', icon: '⏱️', colorClass: 'cyan', path: '/pages/pace-calculator/index' },
  { id: 5, title: '跑步课表', icon: '📅', colorClass: 'purple', path: '/pages/training-schedule/index' },
  { id: 6, title: '论坛', icon: '💬', colorClass: 'orange', path: '/pages/forum/index' },
  { id: 7, title: '成就体系', icon: '🏅', colorClass: 'teal', path: '/pages/achievement/index' },
  { id: 8, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' },
  { id: 9, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' }
]
```

- [ ] **Step 2: 新增 cyan 样式**

在 CSS 部分 `.grid-item.gray` 之后新增：
```css
.grid-item.cyan { background: #00BCD4; }
```

- [ ] **Step 3: 验证**

检查 `menuItems` 数组共 9 项，顺序正确，`cyan` class 有对应样式。

---

### Task 2: 新建配速计算器页面 (`src/pages/pace-calculator/index.vue`)

**Files:**
- Create: `src/pages/pace-calculator/index.vue`

**Interfaces:**
- Consumes: 无（占位页面）
- Produces: 配速计算器页面组件，路径 `/pages/pace-calculator/index`

- [ ] **Step 1: 创建页面目录**

```bash
mkdir -p src/pages/pace-calculator
```

- [ ] **Step 2: 创建 index.vue**

创建页面组件，遵循项目模板（彩色 header + 居中内容 + 开发中占位）：
```vue
<template>
  <view class="page">
    <view class="header" style="background: #00BCD4;">
      <view class="back-btn" @click="uni.navigateBack()">
        <text class="back-text">←</text>
      </view>
      <text class="header-title">配速计算器</text>
    </view>
    <view class="content">
      <text class="placeholder-icon">⏱️</text>
      <text class="placeholder-text">功能开发中，敬请期待</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  height: 160rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  position: relative;
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.back-text {
  color: #FFFFFF;
  font-size: 40rpx;
}
.header-title {
  color: #FFFFFF;
  font-size: 40rpx;
  font-weight: bold;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}
.placeholder-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}
.placeholder-text {
  color: #95A5A6;
  font-size: 28rpx;
}
</style>
```

- [ ] **Step 3: 验证**

确认文件存在，路径为 `src/pages/pace-calculator/index.vue`。

---

### Task 3: 更新 pages.json 路由

**Files:**
- Modify: `src/pages.json`

**Interfaces:**
- Consumes: 现有的 pages 数组结构
- Produces: 新增配速计算器路由条目

- [ ] **Step 1: 添加路由配置**

在 `pages` 数组中 `achievement/index` 条目之后新增：
```json
{
  "path": "pages/pace-calculator/index",
  "style": {
    "navigationStyle": "custom"
  }
}
```

- [ ] **Step 2: 验证**

确认 `pages.json` 中 `pages` 数组包含 8 个条目，配速计算器路由配置正确。

---

### Task 4: 更新 Figma JSON 设计稿 (`figma_design.json`)

**Files:**
- Modify: `figma_design.json`

**Interfaces:**
- Consumes: 现有 Figma JSON 节点结构
- Produces: 更新后的 JSON（重新排序 + 新增配速计算器 + 移除一个待开发）

- [ ] **Step 1: designSystem.colors 新增 cyan**

```json
"cyan": "#00BCD4"
```

- [ ] **Step 2: 重新排序 9 宫格容器 children**

将 `9宫格容器` 的 `children` 数组重新排序为：
```
[跑力值计算, 成绩预测, 心率计算, 配速计算器(新增), 跑步课表, 论坛, 成就体系, 待开发2, 待开发3]
```

其中配速计算器组件节点：
```json
{
  "type": "component",
  "name": "配速计算器",
  "size": { "width": 108, "height": 116 },
  "backgroundColor": "#00BCD4",
  "cornerRadius": 12,
  "children": [
    {
      "type": "icon",
      "name": "配速计算器图标",
      "content": "⏱️",
      "fontSize": 36,
      "position": { "x": 36, "y": 20 }
    },
    {
      "type": "text",
      "name": "功能名称",
      "content": "配速计算器",
      "fontSize": 12,
      "fontWeight": "bold",
      "color": "#FFFFFF",
      "position": { "x": 30, "y": 80 }
    }
  ]
}
```

移除 id 为 `待开发1` 的节点。

- [ ] **Step 3: 验证**

确认 children 数组共 9 项，顺序与目标布局一致，不会出现重复或遗漏。

---

### Task 5: 更新 Figma HTML 预览 (`figma_design_visual.html`)

**Files:**
- Modify: `figma_design_visual.html`

**Interfaces:**
- Consumes: 现有 HTML DOM 结构
- Produces: 更新后的 HTML（grid items 重新排序 + 新增配速计算器卡片 + 移除一个待开发）

- [ ] **Step 1: 新增 cyan 样式**

在 CSS 部分 `.grid-item.gray` 之后新增：
```css
.grid-item.cyan { background: #00BCD4; }
```

- [ ] **Step 2: 调整 grid-container 内 items 顺序**

将 `.grid-container` 内的 DOM 顺序调整为：
```
跑力值计算(blue) → 成绩预测(red) → 心率计算(green) →
配速计算器(cyan, 新增) → 跑步课表(purple) → 论坛(orange) →
成就体系(teal) → 待开发(gray) → 待开发(gray)
```

配速计算器卡片 HTML：
```html
<div class="grid-item cyan">
  <div class="icon">⏱️</div>
  <div class="title">配速计算器</div>
</div>
```

移除一个待开发卡片。

- [ ] **Step 3: 验证**

确认共 9 个 grid-item，顺序与目标布局一致。

---

### Task 6: 整体验证

**Files:** 所有修改过的文件

- [ ] **Step 1: 全局检查**

确认以下布局顺序在所有文件（index.vue / figma_design.json / figma_design_visual.html）中一致：
```
Row 1: 跑力值计算 → 成绩预测 → 心率计算
Row 2: 配速计算器 → 跑步课表 → 论坛
Row 3: 成就体系 → 待开发 → 待开发
```

- [ ] **Step 2: 启动 H5 开发服务器检查**

```bash
npm run dev:h5
```
确认页面能正常加载，九宫格布局正确显示。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 调整首页九宫格布局，新增配速计算器

- 新增配速计算器（浅蓝 #00BCD4），位于第2行第1列
- 跑步课表移至第2行第2列，论坛移至第2行第3列
- 成就体系移至第3行第1列
- 移除一个待开发占位
- 同步更新 figma_design.json 和 figma_design_visual.html

Co-Authored-By: Claude <noreply@anthropic.com>"
```
