# 完赛时间计算 — 设计文档

## 概述

新增"完赛时间计算"功能模块，允许用户选择跑步距离和平均配速，计算出预计完赛时间，并使用与配速计算器完全相同的分段策略显示公里分段表。

## 界面设计

### 主题色

青色 `#00BCD4`（与配速计算器相同）

### 输入区

页面顶部包含两个输入区域：

1. **选择跑步距离** — 胶囊按钮组，5 个预设距离 + 1 个"自定义"：
   - 5 公里、10 公里、15 公里、半程马拉松(21.098km)、马拉松(42.195km)
   - 自定义（弹窗输入，范围 3.00~300.00 公里）
   - 与配速计算器的距离选择完全一致

2. **平均配速** — `picker multiSelector` 风格循环选择器，2 列：
   - 分：0~15
   - 秒：00~59
   - 显示格式："X 分 Y 秒 / 公里"

3. **计算按钮** — 青色全宽圆角按钮，文字"计算"

### 结果区

点击计算后显示，包含：

1. **预计完赛时间卡片** — 大号粗体显示总时间(hh:mm:ss)，副信息显示平均配速
2. **配速策略滑杆** — `slider` 范围 -10~+10，步长 1，左端"前慢后快"右端"前快后慢"
3. **显示间隔** — 单选 1 公里(默认) | 5 公里
4. **分段表格** — 3 列：公里 | 时间 | 配速，尾行高亮
5. **操作按钮** — 分享 / 返回首页 / 重新评估

## 架构

### 文件结构

```
src/
├── logic/
│   ├── pace-calculator/
│   │   └── calculator.js          # (仅加 export 导出共享函数)
│   └── finish-time/
│       ├── constants.js           # [NEW] 配速选择器范围
│       └── calculator.js          # [NEW] 完赛时间计算入口
├── pages/
│   └── finish-time/
│       └── index.vue              # [NEW] 页面组件
```

### 路由

已在 `pages.json` 中注册：`pages/finish-time/index`，`navigationStyle: "custom"`

### 首页入口

已在 `src/pages/index/index.vue` 的 `menuItems` 中注册：
- id: 5, title: '完赛时间计算', icon: '🏁', colorClass: 'pink', path: '/pages/finish-time/index'

## 数据流

```
输入: 距离键值 + 配速(分/秒) + 策略值 + 间隔
              │
              ▼
    paceSeconds = min × 60 + sec
    totalSeconds = paceSeconds × totalKm
              │
              ▼
    ┌─ calculateSegmentPaces(totalSeconds, totalKm, strategy)
    │    等比数列模型生成 5 段配速
    │
    └─ buildRows(totalKm, totalSeconds, segmentPaces, interval)
              │
              ▼
    输出: { totalTimeDisplay, avgPaceDisplay, totalKm, totalSeconds, rows }
```

## 核心算法复用

完赛时间计算器的核心算法完全复用配速计算器的共享函数：

| 函数 | 所在文件 | 复用方式 |
|------|---------|---------|
| `calculateSegmentPaces()` | `pace-calculator/calculator.js` | 加 `export` 后导入 |
| `buildRows()` | `pace-calculator/calculator.js` | 加 `export` 后导入 |
| `formatPace()` | `pace-calculator/calculator.js` | 已导出，直接导入 |
| `formatTime()` | `pace-calculator/calculator.js` | 已导出，直接导入 |
| `DISTANCE_CONFIGS` | `pace-calculator/constants.js` | 直接导入 |
| `INTERVAL_OPTIONS` | `pace-calculator/constants.js` | 直接导入 |
| `STRATEGY_CONFIG` | `pace-calculator/constants.js` | 直接导入 |

## 与配速计算器的对比

| 项目 | 配速计算器 | 完赛时间计算器 |
|------|-----------|---------------|
| 输入 | 距离 + **时间**(时/分/秒) | 距离 + **配速**(分/秒) |
| 主结果 | 平均配速 | **完赛时间** |
| 选择器列数 | 3 列(时/分/秒) | **2 列**(分/秒) |
| 分段策略 | ✅ 相同 | ✅ 相同 |
| 显示间隔 | ✅ 相同 | ✅ 相同 |
| 分段表格 | ✅ 相同 | ✅ 相同 |
| 操作按钮 | ✅ 相同 | ✅ 相同 |

## 未竟事宜

- 无。功能清晰，范围明确，与现有配速计算器高度对称。
