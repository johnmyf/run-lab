# [步频步幅计算] 模块设计文档

日期：2026-08-03
状态：已确认（设计讨论完成）

## 1. 背景与目标

在跑研社（uni-app，微信小程序 + H5）中新增 [步频步幅计算] 模块：用户选择计算项（由步频+步幅算配速 / 由配速+步幅算步频 / 由配速+步频算步幅），输入两项后**实时**得出第三项，无需点击按钮，并附「步频·步幅·配速」知识附录。

需求来源：`context_md/StrideLength_RunCadence_Pace.md`。

## 2. 已确认的需求要点

- **步频单位**：统一使用「步/分钟」（需求中「步/秒」为笔误；附录明确 170～190 步/分钟，180步/秒在物理上不可能）
- **计算项三选一**：由步频和步幅计算配速（默认）/ 由配速和步幅计算步频 / 由配速和步频计算步幅；隐藏被算出的那一项输入
- **实时计算**：输入完成后直接出结果，无计算按钮
- **模块位置**：等级查询之后；九宫格**移除「待开发」占位**，共 9 项填满 3×3
- **颜色**：九宫格色块 + 页头统一靛蓝 `#5C6BC0`
- **配速输入**：`picker mode="multiSelector"`（分/秒），默认 5'00"，参照完赛时间计算页样式

## 3. 计算办法

公式（单位统一为米和分钟）：

- 配速（秒/公里） = `60000 ÷ (步频 × 步幅)`
- 步频（步/分钟） = `60000 ÷ (配速秒 × 步幅)`
- 步幅（米） = `60000 ÷ (配速秒 × 步频)`

互推验证：步频 180、步幅 1.2 → 配速 = 60000/216 ≈ 277.8s → 显示 `4'38"/公里`。

## 4. 业务逻辑 `src/logic/cadence-stride/`

### constants.js

- `MODE_OPTIONS`：三模式及各自隐藏项
  - `{ key: 'pace', label: '由步频和步幅计算配速', hidden: 'pace' }`（默认）
  - `{ key: 'cadence', label: '由配速和步幅计算步频', hidden: 'cadence' }`
  - `{ key: 'stride', label: '由配速和步频计算步幅', hidden: 'stride' }`
- `PACE_MIN_RANGE`（0~15）、`PACE_SEC_RANGE`（00~59）、`DEFAULT_PACE = [5, 0]`
- 单位常量：`CADENCE_UNIT = '步/分钟'`、`STRIDE_UNIT = '米'`、`PACE_UNIT = '/公里'`
- 提示语：`HINT_TEXT = '输入完成后，直接出计算结果，无需点击按钮'`
- `APPENDIX`：附录内容，5 个板块数组（每板块 `{ title, lines: [...] }`）：
  1. 步频（Cadence）、2. 步幅（Stride Length）、3. 配速（Pace）、4. 三者关系、5. 训练建议
  - 文案全文转录自需求 `{附录}`，编号修正为 1/2/3，步频单位修正为 步/分钟

### calculator.js

- `calcPaceSeconds(cadence, stride)` → `60000 / (cadence * stride)`
- `calcCadence(paceSeconds, stride)` → `60000 / (paceSeconds * stride)`
- `calcStride(paceSeconds, cadence)` → `60000 / (paceSeconds * cadence)`
- 格式化：
  - 配速：复用 `src/utils/time.js` 的 `secondsToPaceStr()` → `4'38"`，后接 `/公里`
  - 步频：四舍五入为整数
  - 步幅：最多 2 位小数并去尾零（`1.20` → `1.2`）

## 5. 页面 `src/pages/cadence-stride/index.vue`

沿用统一模板（页头 + 卡片 + 结果 + 附录 + 按钮）：

- **页头**：靛蓝 `#5C6BC0`，标题「步频步幅计算」，左侧 ← 返回（`uni.navigateBack()`）
- **计算项**（卡片）：3 行单选样式（标签较长，整行可点选，非小胶囊），选中项高亮靛蓝；默认第一项
- **输入项**（卡片，随模式隐藏其一）：
  - 步频：数字输入框 + 单位「步/分钟」，placeholder「如 180」
  - 步幅：数字输入框 + 单位「米」，placeholder「如 1.2」
  - 配速：`picker mode="multiSelector"` 分/秒 + 后缀 `/公里`，默认 5'00"
  - 卡片内提示语「输入完成后，直接出计算结果，无需点击按钮」
- **结果区**（实时，`v-if` 有结果时显示）：句子结构，被算出的值加粗、靛蓝、放大突出
  - 步频+步幅→配速：`由平均步频: 180 步/分钟, 平均步幅: 1.2 米, 得出平均配速: **4'38"/公里**`
  - 配速+步幅→步频：`由平均配速: 4'38"/公里, 平均步幅: 1.2 米, 得出平均步频: **180** 步/分钟`
  - 配速+步频→步幅：`由平均配速: 4'38"/公里, 平均步频: 180 步/分钟, 得出平均步幅: **1.2** 米`
  - 输入不足（0 或 1 个有效值）时不显示结果，无计算按钮
- **附录区**：标题「附录：步频 · 步幅 · 配速」，5 板块静态渲染（参考等级查询的附录分隔样式）
- **操作按钮**（`v-show="!sharing"`）：
  - 分享：参照完赛时间计算页
  - 返回首页：`uni.switchTab({ url: '/pages/index/index' })`

## 6. 路由与九宫格入口

- `src/pages.json` 新增：
  ```json
  { "path": "pages/cadence-stride/index", "style": { "navigationStyle": "custom" } }
  ```
- `src/pages/index/index.vue` 的 `menuItems`：移除「待开发」项；在**等级查询之后**插入
  `{ title: '步频步幅计算', icon: '👣', colorClass: 'indigo', path: '/pages/cadence-stride/index' }`
  - 新增 `colorClass: 'indigo'` 样式（背景 `#5C6BC0`）
  - 调整后共 9 项：跑力值 · 成绩预测 · 心率 · 配速计算器 · 完赛时间计算 · 等级查询 · 步频步幅计算 · 跑步课表 · 成就体系（填满 3×3）

## 7. 分享（参照完赛时间计算页面）

- H5：`#ifdef H5` + `@/utils/share` 的 `captureAndShare`，截图前缀「步频步幅」，截图时 `sharing=true` 隐藏按钮
- 微信小程序：`#ifdef MP-WEIXIN` 的 `onShareAppMessage`，标题「步频步幅计算 — 跑研社」，path `/pages/cadence-stride/index`

## 8. 明确不做的（YAGNI）

- 不做「重新评估/重算」按钮（实时计算无需）
- 不做步频/步幅历史记录、存储
- 不做声音/节拍器等延伸功能
- 不做超出「有效正数」的强范围校验（避免输入过程中结果闪断）；合理范围通过 placeholder 提示

## 9. 验证

- 例1：步频 180、步幅 1.2 → 配速 `4'38"/公里`
- 例2：配速 4'38"、步幅 1.2 → 步频 `180` 步/分钟
- 例3：配速 4'38"、步频 180 → 步幅 `1.2` 米
- 交互：切换计算项时隐藏对应输入、已有输入值保留并自动重算；输入缺失时不显示结果
- 构建：`npm run dev:h5` 页面正常渲染；`npm run build:h5` / `npm run build:mp-weixin` 通过
