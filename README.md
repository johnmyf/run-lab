# 英文名
RunLab
# 中文名
跑研社
# 跑步工具跨平台应用

基于 uni-app 框架构建的跑步工具应用，同时支持微信小程序和 H5 网页双平台。采用 3x3 九宫格设计，可灵活扩展功能模块。

## 功能模块

当前支持6个核心功能模块：

1. **跑力值计算** ⚡ - 计算跑步能力指数
2. **成绩预测** 🏆 - 预测跑步成绩
3. **心率计算** ❤️ - 心率区间计算
4. **跑步课表** 📅 - 训练计划管理
5. **论坛** 💬 - 跑步社区交流
6. **成就体系** 🏅 - 成就与徽章系统

另外预留了3个"待开发"位置，方便后续功能扩展。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app 3.0 (基于 Vue 3 Composition API) |
| 构建工具 | Vite 5.2 |
| 平台支持 | 微信小程序 + H5 网页 |
| 样式 | rpx 响应式单位 + SCSS |
| 语言 | JavaScript (ES Module) |

## 项目结构

```
run-lab/
├── index.html                  # H5 入口 HTML（uni-app 自动生成）
├── package.json                # 项目依赖配置
├── vite.config.js              # Vite 构建配置（@dcloudio/vite-plugin-uni）
├── figma_design.json           # Figma 设计稿格式
├── figma_design_visual.html    # 设计稿可视化预览
└── src/
    ├── main.js                 # 应用入口（export createSSRApp）
    ├── App.vue                 # 根组件 + 全局样式
    ├── manifest.json           # uni-app 跨平台应用配置
    ├── pages.json              # 路由配置 + tabBar 配置（替代 vue-router）
    ├── uni.scss                # 全局 SCSS 变量（主题色、字体大小等）
    └── pages/                  # 页面组件目录
        ├── index/
        │   └── index.vue              # 首页（3x3 九宫格功能面板）
        ├── running-power/
        │   └── index.vue              # 跑力值计算页
        ├── performance-prediction/
        │   └── index.vue              # 成绩预测页
        ├── heart-rate/
        │   └── index.vue              # 心率计算页
        ├── training-schedule/
        │   └── index.vue              # 跑步课表页
        ├── forum/
        │   └── index.vue              # 论坛页
        └── achievement/
            └── index.vue              # 成就体系页（同时作为 tabBar"我的"）
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动 H5 网页开发服务器

```bash
npm run dev:h5
打开这个地址测试: http://localhost:3000/  
```

应用将在浏览器中自动打开（Vite 自动分配端口）。H5 模式下支持热更新，修改代码实时生效。

### 启动微信小程序开发模式

```bash
npm run dev:mp-weixin
```

编译完成后，使用**微信开发者工具**导入 `dist/dev/mp-weixin` 目录即可预览。开发模式下支持热更新。

### H5 生产构建

```bash
npm run build:h5
```

构建产物输出到 `dist/build/h5` 目录。

### 微信小程序生产构建

```bash
npm run build:mp-weixin
```

构建产物输出到 `dist/build/mp-weixin` 目录，可直接上传发布。

### 可用脚本一览

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | H5 开发服务器 |
| `npm run dev:mp-weixin` | 微信小程序开发模式 |
| `npm run build:h5` | H5 生产构建 |
| `npm run build:mp-weixin` | 微信小程序生产构建 |

## 设计稿

### Figma 设计稿

项目包含两种格式的设计稿：

1. **figma_design.json** - 标准 Figma JSON 格式，可直接导入 Figma
2. **figma_design_visual.html** - 可视化 HTML 预览，直接在浏览器中打开查看设计

### 设计特点

- **3x3 九宫格布局** - 卡片式网格，可扩展性强
- **色彩编码** - 每个功能模块使用独特的颜色标识
- **图标化设计** - 使用 emoji 图标，简洁直观
- **跨平台适配** - 使用 rpx 响应式单位（750rpx = 屏幕宽度），H5 和小程序自动适配
- **自定义导航栏** - 所有页面使用自定义 header，颜色与功能模块对应

### 颜色方案

| 颜色 | 色值 | 对应模块 |
|------|------|----------|
| 蓝色 | `#3498DB` | 跑力值计算 |
| 红色 | `#E74C3C` | 成绩预测 |
| 绿色 | `#2ECC71` | 心率计算 |
| 紫色 | `#9B59B6` | 跑步课表 |
| 橙色 | `#F39C12` | 论坛 |
| 青色 | `#1ABC9C` | 成就体系 |
| 灰色 | `#95A5A6` | 待开发 |
| 深蓝 | `#2C3E50` | 首页 header / 底部 tabBar |

## 页面说明

### 首页（pages/index/index）

- 深蓝色顶部导航栏，标题"跑步工具"
- 欢迎信息卡片
- 3x3 九宫格功能面板，点击跳转对应功能页
- 底部 tabBar（"首页"和"我的"两个标签，深蓝底色）

### 功能页面（6 个）

每个功能页面采用统一模板：
- 顶部彩色 header（高度 160rpx），颜色与功能模块对应
- 左侧 ← 返回按钮，居中标题
- 居中内容区：功能图标 + 标题 + "开发中"提示 + 施工动画

### tabBar 说明

tabBar 在 [pages.json](src/pages.json) 中配置：
- **首页** → `pages/index/index`
- **我的** → `pages/achievement/index`（成就体系页）

## 扩展指南

### 添加新功能模块

1. 在 `src/pages/` 下创建新目录和 `index.vue` 页面组件（参考现有功能页模板）
2. 在 [src/pages.json](src/pages.json) 的 `pages` 数组中添加路由配置，设置 `"navigationStyle": "custom"`
3. 在 [src/pages/index/index.vue](src/pages/index/index.vue) 的 `menuItems` 数组中添加新模块（指定 id、title、icon、colorClass、path）
4. 为新模块选择合适的颜色和图标

### 替换"待开发"模块

将 `menuItems` 中 id 为 7/8/9 的项的 `path` 属性设置为实际页面路径（如 `/pages/new-feature/index`），同时将 `colorClass` 从 `gray` 改为对应颜色类。

## 开发注意事项

### uni-app 跨平台约定

| 注意事项 | 说明 |
|----------|------|
| HTML 标签 | 使用 `<view>` 替代 `<div>`，`<text>` 替代 `<h1>/<h2>/<p>/<span>`，`<image>` 替代 `<img>` |
| CSS 单位 | 使用 `rpx` 而非 `px`（750rpx = 屏幕宽度） |
| CSS 限制 | 避免 `:hover` 伪类（小程序不支持）和 `cursor` 属性（小程序无效） |
| 导航 API | `uni.navigateTo({ url: '/pages/xxx/index' })` 跳转，`uni.navigateBack()` 返回 |
| 页面位置 | 所有页面必须在 `src/pages/` 目录下 |
| 路由配置 | 使用 `pages.json` 配置路由，不使用 vue-router |
| 自定义导航 | 在 `pages.json` 中设置 `"navigationStyle": "custom"` 以使用自定义 header |
| 平台判断 | 使用 `#ifdef MP-WEIXIN` / `#ifdef H5` / `#endif` 条件编译 |

### 代码风格

- 使用 Vue 3 Composition API（`<script setup>`）
- 保持组件的单一职责
- 页面组件放在独立目录中，命名为 `index.vue`
- 全局样式变量定义在 [src/uni.scss](src/uni.scss)

## 许可证

MIT
