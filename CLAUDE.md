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
    │   └── index.vue              # 论坛
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
- header 颜色与首页九宫格颜色对应：蓝 `#3498DB`（跑力值）、红 `#E74C3C`（成绩预测）、绿 `#2ECC71`（心率）、紫 `#9B59B6`（课表）、橙 `#F39C12`（论坛）、青 `#1ABC9C`（成就）
- 所有功能页当前均为"开发中"占位状态，具体功能待实现
- 页面导航使用 uni-app API：`uni.navigateTo({ url: '/pages/xxx/index' })` 跳转，`uni.navigateBack()` 返回

### uni-app 特殊约定
- HTML 标签使用 uni-app 跨平台组件：`<view>` 替代 `<div>`，`<text>` 替代 `<h1>/<h2>/<p>/<span>`
- CSS 单位使用 `rpx`（750rpx = 屏幕宽度），不使用 `px`
- 避免使用 `:hover` 伪类（小程序不支持）
- 避免使用 `cursor: pointer`（小程序无效）
- `box-sizing: border-box` 在小程序中无效，使用 uni-app 默认盒模型
- `pages.json` 中设置 `"navigationStyle": "custom"` 以使用自定义导航栏
- tabBar 配置在 `pages.json` 中，不在页面组件内
