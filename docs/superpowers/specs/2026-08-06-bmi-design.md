# 体重建议（BMI 计算）模块设计

> 日期：2026-08-06
> 需求来源：`context_md/bmi-calculate.md`、`context_md/Understanding-BMI-for-Runners.md`

## 1. 概述

新增「体重建议」功能模块：用户输入体重 / 身高 / 性别，点击 [计算] 后得出 BMI，并依据
**成人 BMI 分级标准（中国参考）** 与 **跑者 BMI 分级标准** 判定「身体状态」与「跑者层级」，
用两条彩色横轴图形展示当前 BMI 所处位置及各颜色交界处的临界 BMI 与对应体重。

同时：
- 新增「跑者如何理解 BMI」应用内说明页（内容转录自 Understanding-BMI-for-Runners.md）
- 首页九宫格调整：移除「成就体系」（tabBar「我的」入口保留），位置 8 插入「体重建议」

## 2. 界面交互

### 2.1 输入区
| 字段 | 控件 | 默认值 | 单位 |
| --- | --- | --- | --- |
| 体重 | 数字输入框（`type="digit"`，允许数字和小数点） | 65 | 公斤 (kg) |
| 身高 | 数字输入框（`type="digit"`） | 170 | 厘米 (cm) |
| 性别 | 单选（男 / 女） | 男 | — |

[计算] 按钮：校验输入合法后计算，展示结果区。

### 2.2 结果区（点击 [计算] 后显示）
- 大号数字：`xx.x` BMI（保留 1 位小数）
- 身体状态：偏瘦 | 正常 | 偏胖 | 肥胖（枚举）
- 跑者层级：需注意身体健康 | 世界顶尖精英 | 大众精英/严肃跑者 | 健康完赛跑者 | 新手/健身跑者（枚举）

### 2.3 横轴图形显示区（计算后显示，共 2 条）
整体参考百度 BMI 热力图样式（`data-resources/bmi_百度搜索.mhtml`）。每条结构（自上而下）：

```
   18.5     24.0    28.0        ← 交界 BMI 数字（kg/m²，首段左边界不显示）
  52.8kg   67.3kg  78.5kg       ← 交界对应体重（按输入身高推算，取整）
            ▼(黑三角)            ← 当前 BMI 精确位置标记
[粉色][ 绿色 ][ 黄色 ][ 深红 ]    ← 彩色分段条
  偏瘦    正常    偏胖    肥胖    ← 分类名标签
```

1. **交界值标签**（条形上方两行）：临界 BMI 数字（单位 kg/m²）+ 对应体重（体重 = BMI × 身高(m)²，取整；首段左边界不显示）
2. **黑色三角形标记**：位于条形正上方、交界值标签行下方，`left` 按当前 BMI 在坐标轴上的**精确比例**计算（`getMarkerPosition`，clamp 到 0%~100%），向下指向条形
3. **彩色分段条**：色块数量与分类数一致（成人 4 段 / 跑者 5 段），宽度与各段 BMI 区间在坐标轴上的占比成正比，两端圆角
4. **分类名标签**（条形下方）：各段居中显示分类名称

第一条（成人身体状态）：
| 颜色 | 偏瘦 | 正常 | 偏胖 | 肥胖 |
| --- | --- | --- | --- | --- |
| 色值 | 粉色 `#FFB6C1` | 绿色 `#2ECC71` | 黄色 `#F1C40F` | 深红 `#8B0000` |

第二条（跑者层级，随性别切换，共 5 段）：
| 颜色 | 需注意身体健康 | 世界顶尖精英 | 大众精英/严肃跑者 | 健康完赛跑者 | 新手/健身跑者 |
| --- | --- | --- | --- | --- | --- |
| 色值 | 灰色 `#95A5A6` | 粉色 `#FFB6C1` | 绿色 `#2ECC71` | 黄色 `#F1C40F` | 浅蓝 `#87CEEB` |

### 2.4 说明区（始终显示）
> BMI（Body Mass Index，**身体质量指数**）：是衡量人体胖瘦程度以及是否健康的一个常用指标。

链接「跑者如何理解 BMI（身体质量指数）」→ `uni.navigateTo('/pages/bmi/understanding/index')`。

### 2.5 操作按钮
- **[分享]**：参考成绩预测页对应按钮（H5 截图 + 二维码下载；小程序 `onShareAppMessage`），分享前缀 `体重建议`；分享时隐藏三个操作按钮
- **[返回首页]**：`uni.switchTab('/pages/index/index')`
- **[重新计算]**（原名「重新结算」）：**保留输入值**，仅清除结果区（`calculated=false`）

## 3. 数据设计

### 3.1 `src/data/bmi.json`
两种标准单独保存为 JSON，程序直接引用。

```json
{
  "adult": [
    { "name": "偏瘦", "min": null,  "max": 18.5, "color": "#FFB6C1" },
    { "name": "正常", "min": 18.5,  "max": 24.0, "color": "#2ECC71" },
    { "name": "偏胖", "min": 24.0,  "max": 28.0, "color": "#F1C40F" },
    { "name": "肥胖", "min": 28.0,  "max": null, "color": "#8B0000" }
  ],
  "runnerLevels": {
    "男": [
      { "name": "世界顶尖精英",   "min": 17.0, "max": 19.0, "color": "#FFB6C1" },
      { "name": "大众精英/严肃跑者", "min": 19.0, "max": 21.5, "color": "#2ECC71" },
      { "name": "健康完赛跑者",     "min": 21.0, "max": 23.5, "color": "#F1C40F" },
      { "name": "新手/健身跑者",    "min": 23.0, "max": null, "color": "#87CEEB" },
      { "name": "需注意身体健康",   "min": null, "max": 17.0, "color": "#95A5A6" }
    ],
    "女": [
      { "name": "世界顶尖精英",   "min": 16.5, "max": 18.5, "color": "#FFB6C1" },
      { "name": "大众精英/严肃跑者", "min": 18.0, "max": 20.5, "color": "#2ECC71" },
      { "name": "健康完赛跑者",     "min": 20.0, "max": 22.5, "color": "#F1C40F" },
      { "name": "新手/健身跑者",    "min": 22.5, "max": null, "color": "#87CEEB" },
      { "name": "需注意身体健康",   "min": null, "max": 16.5, "color": "#95A5A6" }
    ]
  }
}
```

字段说明：
- `min` / `max`：区间边界，**闭区间**（`bmi >= min && bmi <= max` 命中）；`null` 表示无下界 / 无上界
  - 如「21.0 ~ 23.5」= `min:21.0, max:23.5`
  - 如「23.0 ~ 25.0+」= `min:23.0, max:null`（无上限）
- `name`：显示名（身体状态使用「偏胖」而非表格中的「超重」，与界面枚举及图例一致）
- `color`：横轴色块 / 图例圆点颜色
- **跑者层级数组顺序 = 优先级顺序（由高到低）**：世界顶尖精英 → 大众精英/严肃跑者 → 健康完赛跑者 → 新手/健身跑者 → 需注意身体健康（最低）
- 「需注意身体健康」：男 BMI < 17.0 / 女 BMI < 16.5 时命中；其 `max`（17.0 / 16.5）与「世界顶尖精英」的 `min` 相接且优先级更低，故 BMI 恰好等于 17.0 / 16.5 时仍判为世界顶尖精英
- 横轴渲染时按 `min` 升序排列（需注意在左端），算法则按数组顺序（优先级）遍历

## 4. 算法设计

### 4.1 `src/logic/bmi/calculator.js`

```js
calcBMI(weightKg, heightCm)                    // BMI = weight / (height/100)^2，保留 1 位小数
findAdultStatus(bmi, adultData)                // 顺序遍历，返回首个命中区间；bmi 低于 min 视为落在首段
findRunnerLevel(bmi, gender, runnerData)       // 按层级数组顺序（高→低）遍历，命中即返回
getBoundaryWeights(heightCm, categories)       // 相邻两档交界：{ bmi: categories[i].max, weightKg: 取整 }
getMarkerPosition(bmi, axisMin, axisMax)       // (bmi - axisMin) / (axisMax - axisMin) * 100%，clamp 到 [0,100]
```

数据（`bmi.json`）由页面从 `@/data/bmi.json` 导入后显式传入算法，与 `level-query` 的 `queryLevel(params, levelData)` 模式一致。

**跑者层级判定**（实现「同时满足两个区间取更高级」）：
按数组顺序（世界顶尖精英 → 大众精英 → 健康完赛 → 新手）遍历，第一个命中的即结果。
示例：男性 BMI 21.1 同时命中「大众精英(19~21.5)」和「健康完赛(21~23.5)」→ 返回大众精英（更高级）。

**低于最低标准处理**（已更新）：男性 BMI < 17.0 / 女性 BMI < 16.5 时命中「需注意身体健康」
（数组中最后一项，`max` 为 17.0 / 16.5）。因该区间优先级最低且与精英区间相接，
正常层级（世界顶尖精英起）均优先命中，故不影响「同时满足取更高级」规则。

### 4.2 坐标轴与有效分段
常量定义（`src/logic/bmi/constants.js`）：
- 成人身体状态条坐标轴：`[14, 32]`
- 跑者层级条坐标轴：`[14, 30]`（男女共用）

**有效分段**（颜色交界位置）：渲染前将分类按 `min` 升序排列（需注意在左端），第 i 段视觉区间为
`[ i==0 ? axisMin : categories[i-1].max , categories[i].max ?? axisMax ]`。
交界点 = `categories[i].max`：
- 成人条：18.5 / 24.0 / 28.0
- 跑者条（男）：17.0 / 19.0 / 21.5 / 23.5
- 跑者条（女）：16.5 / 18.5 / 20.5 / 22.5

交界标签显示：`临界BMI` + `对应体重`（体重 = 临界BMI × (身高cm/100)²，四舍五入取整）。
三角形超出坐标轴时 clamp 到 0% / 100%。

## 5. 页面与路由

### 5.1 新增 `src/pages/bmi/index.vue`（体重建议）
- 顶部 header：teal `#1ABC9C`，← 返回按钮 + 居中标题「体重建议」
- 输入卡片 → [计算] 按钮（teal，圆角通栏，样式参考等级查询的 `query-btn`）
- 结果卡（计算后显示）：`xx.x BMI` 大号数字 + 身体状态 + 跑者层级
- 两条横轴图形卡（计算后显示）
- 说明区卡片（始终显示）+ 跳转链接
- 操作按钮：分享 / 返回首页 / 重新计算

### 5.2 新增 `src/pages/bmi/understanding/index.vue`（跑者如何理解 BMI）
- 头部与 BMI 页一致（teal），标题「跑者如何理解BMI」
- 内容转录自 Understanding-BMI-for-Runners.md，**结构化章节数据**渲染：
  章节类型 `h2`（小标题）、`p`（段落，支持 `**加粗**` 分段渲染）、`table`（表头+行）、`list`（列表项）、`divider`（分隔线）
- 分享（前缀 `跑者如何理解BMI`）/ 返回首页 按钮

说明页内容数据存放于 `src/logic/bmi/understanding.js`（数组结构，类似步频步幅页 APPENDIX 先例）。

### 5.3 `src/pages.json`
新增两条路由（均 `"navigationStyle": "custom"`）：
- `pages/bmi/index`
- `pages/bmi/understanding/index`

### 5.4 首页九宫格 `src/pages/index/index.vue`
`menuItems` 调整后的顺序：
| 位置 | 功能 | 图标 | 颜色类 |
| --- | --- | --- | --- |
| 1 | 跑力值计算 | ⚡ | blue |
| 2 | 成绩预测 | 🏆 | red |
| 3 | 等级查询 | 🥇 | orange |
| 4 | 步频步幅计算 | 👟 | indigo |
| 5 | 配速计算器 | ⏱️ | cyan |
| 6 | 完赛时间计算 | 🏁 | pink |
| 7 | 心率计算 | ❤️ | green |
| 8 | **体重建议（新）** | **⚖️** | **teal（复用成就体系释放的颜色）** |
| 9 | 跑步课表 | 📅 | purple |

- 移除「成就体系」项；tabBar 保持不动（成就体系仍为「我的」）
- `goToPage` 无需改动（体重建议走 `navigateTo`）

## 6. 边界情况与校验
- 体重 / 身高为空、为 0、或非数字：`uni.showToast` 提示「请输入有效体重/身高」，不计算
- 性别切换：跑者层级判定与第二条横轴随之切换（若已计算则自动重算）
- 跑者层级低于最低标准 → 需注意身体健康（见 4.1）
- 跑者层级无上界（新手 25.0+）：凡高于其下界者均命中新手段

## 7. 文档同步
- 更新 `README.md` 功能列表与 `CLAUDE.md` 架构概览（模块清单、九宫格颜色映射）

## 8. 文件清单
| 操作 | 文件 |
| --- | --- |
| 新增 | `src/data/bmi.json` |
| 新增 | `src/logic/bmi/constants.js` |
| 新增 | `src/logic/bmi/calculator.js` |
| 新增 | `src/logic/bmi/understanding.js` |
| 新增 | `src/pages/bmi/index.vue` |
| 新增 | `src/pages/bmi/understanding/index.vue` |
| 修改 | `src/pages.json`（新增 2 路由） |
| 修改 | `src/pages/index/index.vue`（九宫格调整） |
| 修改 | `README.md` / `CLAUDE.md`（文档同步） |
