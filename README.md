# 英文名
RunLab
# 中文名
跑研社
# 跑步工具网页应用

一个现代化的跑步工具网页应用，采用9宫格设计，可灵活扩展功能模块。

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

- Vue 3 (Composition API)
- Vue Router 4
- Vite

## 项目结构

```
running-tools/
├── figma_design.json           # Figma设计稿格式
├── figma_design_visual.html    # 设计稿可视化预览
├── package.json                # 项目依赖配置
├── vite.config.js              # Vite构建配置
├── index.html                  # 入口HTML
└── src/
    ├── main.js                 # 应用入口
    ├── App.vue                 # 根组件
    ├── style.css               # 全局样式
    ├── router/
    │   └── index.js            # 路由配置
    └── views/
        ├── Home.vue            # 首页(9宫格面板)
        ├── RunningPower.vue           # 跑力值计算页
        ├── PerformancePrediction.vue  # 成绩预测页
        ├── HeartRate.vue               # 心率计算页
        ├── TrainingSchedule.vue       # 跑步课表页
        ├── Forum.vue                   # 论坛页
        └── Achievement.vue            # 成就体系页
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 自动打开。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 设计稿

### Figma设计稿

项目包含两种格式的设计稿：

1. **figma_design.json** - 标准Figma JSON格式，可直接导入Figma
2. **figma_design_visual.html** - 可视化HTML预览，直接在浏览器中打开查看设计

### 设计特点

- **9宫格布局** - 3x3网格，可扩展性强
- **色彩编码** - 每个功能模块使用独特的颜色标识
- **图标化设计** - 使用emoji图标，简洁直观
- **响应式设计** - 适配移动端和桌面端
- **统一配色方案** - 基于Material Design配色

### 颜色方案

- 蓝色 #3498DB - 跑力值计算
- 红色 #E74C3C - 成绩预测
- 绿色 #2ECC71 - 心率计算
- 紫色 #9B59B6 - 跑步课表
- 橙色 #F39C12 - 论坛
- 青色 #1ABC9C - 成就体系
- 灰色 #95A5A6 - 待开发

## 页面说明

### 首页

- 顶部导航栏
- 欢迎信息
- 9宫格功能面板
- 底部导航

### 功能页面

每个功能页面包含：
- 带颜色的顶部导航栏(对应功能颜色)
- 返回按钮
- 功能图标
- 功能标题
- "开发中"提示(预留，后续可扩展具体功能)

## 扩展指南

### 添加新功能模块

1. 在 `src/views/` 创建新的Vue页面组件
2. 在 `src/router/index.js` 添加路由配置
3. 在 `src/views/Home.vue` 的 `menuItems` 数组中添加新模块
4. 为新模块选择合适的颜色和图标

### 替换"待开发"模块

将 `menuItems` 中 id 为 7/8/9 的项的 `path` 属性设置为实际路由路径。

## 开发建议

- 遵循Vue 3 Composition API最佳实践
- 保持组件的单一职责
- 统一代码风格
- 添加必要的注释

## 许可证

MIT
