# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

跑研匠 (RunLab) — 跑步工具跨平台应用（微信小程序 + H5），采用 uni-app 框架构建，3x3 九宫格设计展示功能模块。

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
│   ├── sheet5-2.json              # 训练配速建议表
│   ├── level.json                 # 等级查询对照数据（大众/专业等级标准）
│   └── bmi.json                   # 体重建议分类数据（成人状态/跑者层级，含颜色）
├── utils/               # 通用工具函数（无 Vue 依赖）
│   └── time.js                     # 时间/配速格式化工具
├── logic/               # 业务逻辑（按功能模块分类）
│   ├── running-power/              # 跑力值计算业务逻辑
│   │   ├── constants.js            # picker 范围、距离配置
│   │   └── vdot.js                 # VDOT 算法（getVDOT）
│   ├── performance-prediction/     # 成绩预测业务逻辑
│   │   ├── constants.js            # 常量配置（subject、配速类型、说明文案）
│   │   └── formatters.js           # 配速格式化函数
│   ├── heart-rate/                 # 心率计算逻辑
│   │   ├── constants.js            # 训练区间、估算方法配置
│   │   └── calculator.js           # 最大心率估算
│   ├── pace-calculator/            # 配速计算逻辑
│   │   ├── constants.js            # 距离配置、分段策略、区间选项
│   │   └── calculator.js           # 平均/分段配速计算
│   ├── finish-time/                # 完赛时间计算逻辑
│   │   ├── constants.js            # 配速范围配置
│   │   └── calculator.js           # 完赛时间/分段配速计算（复用 pace-calculator）
│   ├── level-query/                # 等级查询逻辑
│   │   ├── constants.js            # 项目、性别、年龄组、等级配置
│   │   └── calculator.js           # 等级判定
│   ├── cadence-stride/             # 步频步幅计算逻辑
│   │   ├── constants.js            # 计算模式、输入范围配置
│   │   └── calculator.js           # 配速/步频/步幅互相换算
│   └── bmi/                        # 体重建议计算逻辑
│       ├── constants.js            # 输入默认值、横轴范围、说明文案
│       ├── calculator.js           # BMI 计算/成人状态/跑者层级/横轴分段
│       └── understanding.js        # 说明页结构化内容（UNDERSTANDING_SECTIONS）
└── pages/               # 页面组件（必须在此目录下）
    ├── index/
    │   └── index.vue              # 首页（九宫格功能面板 + tabBar 首页）
    ├── running-power/
    │   └── index.vue              # 跑力值计算
    ├── performance-prediction/
    │   └── index.vue              # 成绩预测
    ├── heart-rate/
    │   └── index.vue              # 心率计算
    ├── pace-calculator/
    │   └── index.vue              # 配速计算器
    ├── finish-time/
    │   └── index.vue              # 完赛时间计算
    ├── level-query/
    │   └── index.vue              # 等级查询
    ├── cadence-stride/
    │   └── index.vue              # 步频步幅计算
    ├── bmi/
    │   ├── index.vue              # 体重建议计算
    │   ├── understanding/
    │   │   └── index.vue          # 跑者如何理解 BMI 说明页
    │   └── components/
    │       └── heatmap-bar.vue    # 横轴热力图组件（百度式彩色分段条）
    ├── training-schedule/
    │   └── index.vue              # 跑步课表（开发中）
    ├── achievement/
    │   └── index.vue              # 成就体系（开发中，tabBar「我的」入口，已从九宫格移除）
    └── forum/                     # 【已移除】交流天地（因监管趋严已停止规划）
        └── index.vue              #   页面代码保留，入口/路由/样式均已注释禁用，恢复时取消注释即可
```

## 关键设计模式

### 添加新功能模块的步骤
1. 在 `src/pages/` 创建新目录和 `index.vue` 页面组件
2. 在 `src/pages.json` 的 `pages` 数组中添加路由配置（设置 `navigationStyle: "custom"` 以使用自定义 header）
3. 在 `src/pages/index/index.vue` 的 `menuItems` 数组中添加对应项（指定 id、title、icon、colorClass、path）
4. 如需替换"开发中"占位（当前仅剩跑步课表），将对应 `menuItems` 项的 `path` 设为实际页面路径（如 `/pages/xxx/index`）

### 页面组件约定
- 已实现的功能页采用表单交互模板：顶部彩色 header（含 ← 返回按钮和居中标题）+ 输入区 + 结果展示区；未实现页面为占位状态（功能图标 + "开发中"提示 + 施工动画）
- header 颜色与首页九宫格颜色对应：蓝 `#3498DB`（跑力值）、红 `#E74C3C`（成绩预测）、橙 `#F39C12`（等级查询）、靛蓝 `#5C6BC0`（步频步幅）、青 `#00BCD4`（配速计算器）、粉 `#E91E63`（完赛时间）、绿 `#2ECC71`（心率）、蓝绿 `#1ABC9C`（体重建议）、紫 `#9B59B6`（课表）
- 已实现完整功能：跑力值计算、成绩预测、等级查询、步频步幅计算、配速计算器、完赛时间计算、心率计算、体重建议；开发中占位：跑步课表（成就体系已从九宫格移除，仅保留 tabBar「我的」入口）
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

### 心率计算 (`src/pages/heart-rate/index.vue`)

- **输入**: 年龄（10-99）、性别
- **算法**: 三种公式估算最大心率 — 传统公式 `220-年龄`、Tanaka `208-0.7×年龄`、Gulati（区分性别），见 `src/logic/heart-rate/constants.js` 的 `METHODS`
- **输出**: 最大心率估算结果 + 5 个训练区间（热身/燃脂/有氧耐力/乳酸阈/无氧），由 `src/logic/heart-rate/calculator.js` 计算

### 配速计算器 (`src/pages/pace-calculator/index.vue`)

- **输入**: 距离（5公里~马拉松，支持自定义 3~300 公里）、期望完成时间
- **算法**: `src/logic/pace-calculator/calculator.js`
- **输出**: 平均配速 + 按策略划分的分段配速（策略见 `constants.js` 的 `STRATEGY_CONFIG`，分段区间见 `INTERVAL_OPTIONS`）
- **复用**: 完赛时间计算页复用其距离配置与分段计算

### 完赛时间计算 (`src/pages/finish-time/index.vue`)

- **输入**: 距离、平均配速（分钟/秒）
- **算法**: `src/logic/finish-time/calculator.js`，复用配速计算器的 `DISTANCE_CONFIGS` 与分段计算
- **输出**: 完赛时间 + 分段配速表

### 等级查询 (`src/pages/level-query/index.vue`)

- **数据源**: `src/data/level.json`
- **输入**: 项目（马拉松/半程马拉松）、性别、最好成绩、年龄
- **算法**: `src/logic/level-query/calculator.js`
- **输出**: 成绩对应等级（大众二级 ~ 国际健将，见 `constants.js` 的 `LEVELS_LOW_TO_HIGH`；未达标返回 `NO_LEVEL_TEXT`）

### 步频步幅计算 (`src/pages/cadence-stride/index.vue`)

- **输入**: 三种计算模式，见 `src/logic/cadence-stride/constants.js` 的 `MODE_OPTIONS` — 由步频和步幅计算配速 / 由配速和步幅计算步频 / 由配速和步频计算步幅
- **算法**: `src/logic/cadence-stride/calculator.js`
- **单位**: 步频（步/分钟）、步幅（米）、配速（分/公里）

### 体重建议 (`src/pages/bmi/index.vue`)

- **数据源**: `src/data/bmi.json` — 成人身体状态 4 档（偏瘦/正常/偏胖/肥胖）+ 跑者层级 5 档（区分性别：需注意身体健康/世界顶尖精英/大众精英/健康完赛/新手），每档含 `min`/`max`/`color`/`visible`
- **输入**: 体重（kg）、身高（cm）、性别（男/女）
- **算法**: `src/logic/bmi/calculator.js`
  - `calcBMI(weightKg, heightCm)` 计算 BMI（保留 1 位小数）
  - `findAdultStatus(bmi, adultData)` 成人状态判定 — min 闭区间、max 开区间 `[min, max)`
  - `findRunnerLevel(bmi, gender, runnerData)` 跑者层级判定 — 闭区间 + 重叠取更高级 + 首档严格小于兜底
  - `getSegments()` / `getBoundaryWeights()` / `getMarkerPosition()` 供横轴热力图渲染
- **横轴组件**: `src/pages/bmi/components/heatmap-bar.vue` — 百度式彩色分段条，含临界 BMI + 对应体重交界标签、当前值黑色三角形标记、按占比分段渲染（`visible === false` 的档不显示）
- **说明页**: `src/pages/bmi/understanding/index.vue` — 「跑者如何理解 BMI」，内容由 `src/logic/bmi/understanding.js` 的 `UNDERSTANDING_SECTIONS` 结构化定义（`h2`/`h3`/`p`/`table`/`list`/`divider` 六种类型，`**加粗**` 由 `parseBold()` 解析）
- **header 颜色**: 蓝绿 teal `#1ABC9C`（对应首页九宫格第 8 格）
