# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

跑研社 (RunLab) — 跑步工具跨平台应用（微信小程序 + H5），采用 uni-app 框架构建，3x3 九宫格设计展示功能模块。

## 技术栈

- uni-app 3.0 (基于 Vue 3, Composition API, `<script setup>`)
- Vite 5.2 (开发服务器，H5 模式默认端口由 Vite 自动分配)
- 微信小程序 + H5 双平台

## 常用命令

```bash
npm install              # 安装依赖
npm run dev:h5           # 启动 H5 网页开发服务器
npm run dev:mp-weixin    # 启动微信小程序开发模式（需用微信开发者工具导入 dist/dev/mp-weixin）
npm run build:h5         # H5 生产构建
npm run build:mp-weixin  # 微信小程序生产构建
```

## 架构概览

```
src/
├── main.js              # 入口：导出 createApp（uni-app 框架自动挂载）
├── App.vue              # 根组件（uni-app 自动按 pages.json 渲染页面）
├── manifest.json        # uni-app 应用配置（平台参数、appid 等）
├── pages.json           # 路由和窗口配置（替代 vue-router）
├── uni.scss             # uni-app 全局样式变量
├── data/                # 数据文件（JSON 数据表）
│   ├── sheet5-1.json              # Jack Daniels VDOT 表
│   └── sheet5-2.json              # 训练配速建议表
├── utils/               # 通用工具函数（无 Vue 依赖）
│   └── time.js                     # 时间/配速格式化工具
├── logic/               # 业务逻辑（按功能模块分类）
│   ├── performance-prediction/     # 成绩预测业务逻辑
│   │   ├── constants.js            # 常量配置（subject、配速类型、说明文案）
│   │   └── formatters.js           # 配速格式化函数
│   └── running-power/              # 跑力值计算业务逻辑
│       ├── constants.js            # picker 范围、距离配置
│       └── vdot.js                 # VDOT 算法（getVDOT）
└── pages/               # 页面组件（必须在此目录下）
    ├── index/
    │   └── index.vue              # 首页（九宫格功能面板 + tabBar 首页）
    ├── running-power/
    │   └── index.vue              # 跑力值计算
    ├── performance-prediction/
    │   └── index.vue              # 成绩预测
    ├── heart-rate/
    │   └── index.vue              # 心率计算
    ├── training-schedule/
    │   └── index.vue              # 跑步课表
    ├── forum/
    │   └── index.vue              # 交流天地
    └── achievement/
        └── index.vue              # 成就体系（同时也是 tabBar "我的"）
```

## 关键设计模式

### 添加新功能模块的步骤
1. 在 `src/pages/` 创建新目录和 `index.vue` 页面组件
2. 在 `src/pages.json` 的 `pages` 数组中添加路由配置（设置 `navigationStyle: "custom"` 以使用自定义 header）
3. 在 `src/pages/index/index.vue` 的 `menuItems` 数组中添加对应项（指定 id、title、icon、colorClass、path）
4. 如需替换"待开发"占位，将对应 `menuItems` 项的 `path` 设为实际页面路径（如 `/pages/xxx/index`）

### 页面组件约定
- 所有功能页采用统一模板：顶部彩色 header（含 ← 返回按钮和居中标题）+ 居中内容区
- header 颜色与首页九宫格颜色对应：蓝 `#3498DB`（跑力值）、红 `#E74C3C`（成绩预测）、绿 `#2ECC71`（心率）、紫 `#9B59B6`（课表）、橙 `#F39C12`（交流天地）、青 `#1ABC9C`（成就）
- 跑力值计算页和成绩预测页已实现完整功能，其余功能页为"开发中"占位状态
- 页面导航使用 uni-app API：`uni.navigateTo({ url: '/pages/xxx/index' })` 跳转，`uni.navigateBack()` 返回

### uni-app 特殊约定
- HTML 标签使用 uni-app 跨平台组件：`<view>` 替代 `<div>`，`<text>` 替代 `<h1>/<h2>/<p>/<span>`
- CSS 单位使用 `rpx`（750rpx = 屏幕宽度），不使用 `px`
- 避免使用 `:hover` 伪类（小程序不支持）
- 避免使用 `cursor: pointer`（小程序无效）
- `box-sizing: border-box` 在小程序中无效，使用 uni-app 默认盒模型
- `pages.json` 中设置 `"navigationStyle": "custom"` 以使用自定义导航栏
- tabBar 配置在 `pages.json` 中，不在页面组件内

## 核心功能数据说明

### 跑力值计算 (`src/pages/running-power/index.vue`)

- **数据源**: `src/data/sheet5-1.json` — Jack Daniels VDOT 表5-1，56 个 VDOT 值(30-85) × 9 个距离(1500米、1.6公里、3公里、3.2公里、5公里、10公里、15公里、半程马拉松、马拉松)
- **输入**: 5km / 10km / 15km / 半程马拉松 / 马拉松 最快成绩（选填，输入越多越准）
- **算法**: 各输入成绩分别查 `sheet5-1.json` 确定对应 VDOT → 取最大值作为最终 VDOT（由 `src/logic/running-power/vdot.js` 中 `getVDOT()` 实现）
  ```js
  // 核心逻辑：vdotMap[VDOT][subject] 是标准成绩，用户输入慢于标准则降一档
  for (let v = 30; v <= 85; v++) {
    const baseSeconds = getSeconds(vdotMap[String(v)]?.[subject])
    if (总秒数 > baseSeconds) return Math.max(v - 1, 30)
  }
  ```
- **共享**: 计算结果通过 `uni.setStorageSync('vdot', finalVdot)` 全局共享

### 成绩预测 (`src/pages/performance-prediction/index.vue`)

- **数据源**: 同一 `src/data/sheet5-1.json`，直接查表，**无公式推导**
- **输入**: 从 `uni.getStorageSync('vdot')` 读取跑力值页面计算的 VDOT
- **预测项**: 7 个 subject — `['1500米', '3公里', '5公里', '10公里', '15公里', '半程马拉松', '马拉松']`
  ```js
  // 核心查询
  vdotMap[String(vdot)][subject]  // → "0:30:40" (H:MM:SS格式)
  ```
- **"[跑步]"标签规则**: 由 `src/logic/performance-prediction/constants.js` 中 `getSubjectLabel()` 处理：半程马拉松和马拉松 **不显示"跑步"**，其余显示 `subject + "跑步"`
- **时间格式**: `src/utils/time.js` 中 `formatPerformanceTime()` 将 `"H:MM:SS"` 转为中文，如 `"0:30:40"` → `"30分40秒"`
- **时间解析**: `src/utils/time.js` 中 `parseTimeToSeconds()` 将 `"M:SS"` 或 `"H:MM:SS"` 转为总秒数（`paceToSeconds()` 只处理 `"M:SS"`）
- **配速格式化**: `src/logic/performance-prediction/formatters.js` 处理间歇跑/重复跑的配速转换
- **训练配速配置**: `src/logic/performance-prediction/constants.js` 中的 `TRAINING_CONFIG`、`REPEAT_PRIORITY`、`README_CONTENT`
- **分享**: H5 平台使用 `html2canvas` 截图下载（条件编译 `#ifdef H5`），分享时隐藏三个操作按钮
- **按钮**: 分享 / 返回首页(`uni.switchTab`) / 重新评估(`uni.navigateTo` 跑力值计算页)
