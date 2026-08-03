# [步频步幅计算] 模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在跑研社新增[步频步幅计算]模块：三选一计算项，输入两项后**实时**得出第三项（无计算按钮），并展示「步频·步幅·配速」知识附录。

**Architecture:** 逻辑层 `src/logic/cadence-stride/`（constants.js 常量/单位/附录文案 + calculator.js 公式互推与格式化）；页面层 `src/pages/cadence-stride/index.vue`（实时计算：结果用 `computed` 派生自输入 refs，无按钮）；入口接入 `pages.json` 路由与首页九宫格（移除「待开发」）。

**Tech Stack:** uni-app 3.0（Vue 3 Composition API, `<script setup>`）、Vite 5.2、微信小程序 + H5 双平台、html2canvas（H5 分享截图）。

## Global Constraints

- **步频单位**：统一「步/分钟」（需求中"步/秒"为笔误，已确认更正）；`CADENCE_UNIT = '步/分钟'`
- **公式**（单位统一为米/分钟）：配速(秒/公里) = `60000 ÷ (步频 × 步幅)`；步频 = `60000 ÷ (配速秒 × 步幅)`；步幅 = `60000 ÷ (配速秒 × 步频)`
- **格式化**：配速用 `utils/time.js` 的 `secondsToPaceStr()` → `4'38"` 后接 `/公里`；步频四舍五入为整数；步幅最多 2 位小数并去尾零（`1.20` → `1.2`）
- **实时计算**：无计算按钮；仅当两个所需输入均为有效正数（`isFinite(n) && n > 0`）时显示结果，否则不显示
- **模式隐藏**：三模式分别隐藏被算出的输入项（`v-show`：`mode==='cadence'` 隐藏步频、`mode==='stride'` 隐藏步幅、`mode==='pace'` 隐藏配速）；切换模式保留已有输入值并自动重算
- **配速 picker**：分 0~15、秒 00~59，默认 `[5, 0]`（5'00"）
- **页面规范**：页头靛蓝 `#5C6BC0`；CSS 用 rpx；用 `<view>`/`<text>`；避免 `:hover`/`cursor:pointer`
- **分享（参照完赛时间计算页面）**：H5 `#ifdef H5` + `@/utils/share` 的 `captureAndShare`（prefix `'步频步幅'`），分享时 `sharing=true` 隐藏按钮；微信小程序 `#ifdef MP-WEIXIN` 的 `onShareAppMessage`
- **入口**：九宫格**移除「待开发」**项（同时移除 `.grid-item.gray` 样式）；新增 `colorClass: 'indigo'`（背景 `#5C6BC0`），插入在[等级查询]之后，调整后共 9 项填满 3×3
- **附录文案**：全文转录自 `context_md/StrideLength_RunCadence_Pace.md`，编号修正为 1/2/3，步频单位修正为 步/分钟

---
## 文件结构

| 文件 | 职责 |
| --- | --- |
| `src/logic/cadence-stride/constants.js` | 计算项三模式、配速 picker 范围、单位、提示语、附录内容 |
| `src/logic/cadence-stride/calculator.js` | 三个公式函数 + 格式化 + `computeResult()` 实时结果 |
| `src/pages/cadence-stride/index.vue` | 步频步幅计算页面（实时计算、附录、分享/返回首页） |
| `src/pages.json` | 注册路由 |
| `src/pages/index/index.vue` | 首页九宫格入口（移除待开发、新增 indigo） |

> **测试说明**：项目无测试框架（package.json 无 test script），且逻辑模块用 `@/` 别名无法被 Node 直接加载。因此逻辑验证采用人工推演核对（对照规格三用例），页面用 dev-server 手动验收，与 level-query/pace-calculator 等现有模块一致。

---

## Task 1: 常量与计算逻辑

**Files:**
- Create: `src/logic/cadence-stride/constants.js`
- Create: `src/logic/cadence-stride/calculator.js`

**Interfaces:**
- Consumes: `src/utils/time.js` 的 `secondsToPaceStr(totalSecs)` → `"4'38\""`（已存在）
- Produces:
  - `MODE_OPTIONS: Array<{ key: 'pace'|'cadence'|'stride', label: string }>` — 三模式
  - `PACE_MIN_RANGE: string[]`、`PACE_SEC_RANGE: string[]`、`DEFAULT_PACE: [number, number]`
  - `CADENCE_UNIT = '步/分钟'`、`STRIDE_UNIT = '米'`、`PACE_UNIT = '/公里'`、`HINT_TEXT: string`
  - `APPENDIX: Array<{ title: string, lines: string[] }>` — 5 板块
  - `formatPaceStr(paceSeconds: number): string` — 如 `"4'38\"/公里"`
  - `formatCadenceStr(cadence: number): string` — 四舍五入整数
  - `formatStrideStr(stride: number): string` — 最多 2 位小数去尾零
  - `computeResult({ mode, cadence, stride, paceSeconds }): { prefix: string, value: string, suffix: string } | null`

- [ ] **Step 1: 创建 `src/logic/cadence-stride/constants.js`**

```js
/**
 * 步频步幅计算模块 — 常量配置
 * @module logic/cadence-stride/constants
 */

/** 计算项（三选一） */
export const MODE_OPTIONS = [
  { key: 'pace', label: '由步频和步幅计算配速' },
  { key: 'cadence', label: '由配速和步幅计算步频' },
  { key: 'stride', label: '由配速和步频计算步幅' },
]

/** 配速 picker：分 0~15 */
export const PACE_MIN_RANGE = Array.from({ length: 16 }, (_, i) => String(i))

/** 配速 picker：秒 00~59 */
export const PACE_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 默认配速：5'00" */
export const DEFAULT_PACE = [5, 0]

/** 单位 */
export const CADENCE_UNIT = '步/分钟'
export const STRIDE_UNIT = '米'
export const PACE_UNIT = '/公里'

/** 输入提示语 */
export const HINT_TEXT = '输入完成后，直接出计算结果，无需点击按钮'

/** 附录内容（转录自 context_md/StrideLength_RunCadence_Pace.md，编号修正为 1/2/3） */
export const APPENDIX = [
  {
    title: '1. 步频（Cadence）',
    lines: [
      '定义：跑步时每分钟双脚落地的次数（通常计单脚或双脚？常见指双脚合计步数，即每分钟迈出的总步数，单位：步/分钟）。',
      '理想范围：多数优秀长跑运动员的步频在 170～190 步/分钟，新手常低于160。',
      '作用：高步频能减少垂直振幅，降低关节冲击，提高跑步经济性。但过高可能导致心率上升过快；过低则容易形成“跨步跑”，增加受伤风险。',
    ],
  },
  {
    title: '2. 步幅（Stride Length）',
    lines: [
      '定义：跑步时每迈出一步，两只脚落地之间的距离（单位：米）。更精确地说是同一只脚两次着地间的距离，但常用单步步长。',
      '影响因素：身高、腿部力量、髋关节灵活性、技术（如送髋、后蹬角度）。',
      '误区：并非越大越好。过度增大步幅往往导致“刹车效应”（脚落在身体前方），损伤膝盖和髋部。合理的步幅应与步频协调，由地面反作用力和推进效率决定。',
    ],
  },
  {
    title: '3. 配速（Pace）',
    lines: [
      '定义：完成单位距离所用的时间，通常表示为 分钟/公里 或 分钟/英里。例如“5分30秒/公里”。',
      '用途：衡量跑步强度、规划比赛策略、控制体能分配。',
      '与速度的关系：配速的倒数即为速度（公里/小时）。例如配速5分/公里对应12公里/小时。',
    ],
  },
  {
    title: '三者关系',
    lines: [
      '配速 = 1000 ÷（步频 × 步幅）（单位统一为米和分钟）',
      '相同配速下，不同跑者可能采用不同的步频-步幅组合（低步频大步幅 vs 高步频小步幅）。',
      '提升配速有两种途径：保持步频不变增大步幅，或保持步幅不变提高步频。通常建议优先优化步频至合理区间，再逐步增加步幅。',
    ],
  },
  {
    title: '训练建议',
    lines: [
      '新手：先稳定步频到170以上，避免跨步。',
      '进阶：通过力量训练（如臀腿爆发力）和柔韧性练习（如髋屈肌拉伸）自然增大步幅。',
      '配速训练：结合间歇跑、节奏跑等专项练习，找到个人最优的步频-步幅平衡点。',
    ],
  },
]
```

- [ ] **Step 2: 创建 `src/logic/cadence-stride/calculator.js`**

```js
/**
 * 步频步幅计算模块 — 核心算法
 * @module logic/cadence-stride/calculator
 */
import { secondsToPaceStr } from '@/utils/time'
import { CADENCE_UNIT, STRIDE_UNIT, PACE_UNIT } from './constants'

/**
 * 由步频、步幅计算配速（秒/公里）
 * @param {number} cadence - 步频（步/分钟，>0）
 * @param {number} stride - 步幅（米，>0）
 * @returns {number} 每公里秒数
 */
export function calcPaceSeconds(cadence, stride) {
  return 60000 / (cadence * stride)
}

/**
 * 由配速、步幅计算步频（步/分钟）
 * @param {number} paceSeconds - 配速（秒/公里，>0）
 * @param {number} stride - 步幅（米，>0）
 * @returns {number} 步频
 */
export function calcCadence(paceSeconds, stride) {
  return 60000 / (paceSeconds * stride)
}

/**
 * 由配速、步频计算步幅（米）
 * @param {number} paceSeconds - 配速（秒/公里，>0）
 * @param {number} cadence - 步频（步/分钟，>0）
 * @returns {number} 步幅
 */
export function calcStride(paceSeconds, cadence) {
  return 60000 / (paceSeconds * cadence)
}

/** 配速格式化：如 277.8 → "4'38\"/公里" */
export function formatPaceStr(paceSeconds) {
  return `${secondsToPaceStr(paceSeconds)}${PACE_UNIT}`
}

/** 步频格式化：四舍五入为整数 */
export function formatCadenceStr(cadence) {
  return String(Math.round(cadence))
}

/** 步幅格式化：最多 2 位小数，去尾零（1.20 → "1.2"） */
export function formatStrideStr(stride) {
  return String(parseFloat(stride.toFixed(2)))
}

/**
 * 实时计算入口：两个所需输入均有效（正数）时返回结果句子三段，否则 null
 * @param {Object} params
 * @param {'pace'|'cadence'|'stride'} params.mode - 计算项
 * @param {number} params.cadence - 步频（无效时传 NaN）
 * @param {number} params.stride - 步幅（无效时传 NaN）
 * @param {number} params.paceSeconds - 配速秒数（配速 picker 得出）
 * @returns {{ prefix: string, value: string, suffix: string }|null}
 */
export function computeResult({ mode, cadence, stride, paceSeconds }) {
  if (mode === 'pace') {
    if (!isValid(cadence) || !isValid(stride)) return null
    const paceSec = calcPaceSeconds(cadence, stride)
    return {
      prefix: `由平均步频: ${formatCadenceStr(cadence)} ${CADENCE_UNIT}, 平均步幅: ${formatStrideStr(stride)} ${STRIDE_UNIT}, 得出平均配速: `,
      value: formatPaceStr(paceSec),
      suffix: '',
    }
  }
  if (mode === 'cadence') {
    if (!isValid(paceSeconds) || !isValid(stride)) return null
    const cad = calcCadence(paceSeconds, stride)
    return {
      prefix: `由平均配速: ${formatPaceStr(paceSeconds)}, 平均步幅: ${formatStrideStr(stride)} ${STRIDE_UNIT}, 得出平均步频: `,
      value: formatCadenceStr(cad),
      suffix: ` ${CADENCE_UNIT}`,
    }
  }
  // mode === 'stride'
  if (!isValid(paceSeconds) || !isValid(cadence)) return null
  const st = calcStride(paceSeconds, cadence)
  return {
    prefix: `由平均配速: ${formatPaceStr(paceSeconds)}, 平均步频: ${formatCadenceStr(cadence)} ${CADENCE_UNIT}, 得出平均步幅: `,
    value: formatStrideStr(st),
    suffix: ` ${STRIDE_UNIT}`,
  }
}

/** 有效正数判定 */
function isValid(n) {
  return typeof n === 'number' && isFinite(n) && n > 0
}
```

- [ ] **Step 3: 逻辑复核（对照规格三用例，人工推演）**

在提交前逐行确认公式与格式化与以下推演一致：

| 输入 | 推演 | 期望返回 |
| --- | --- | --- |
| mode='pace', cadence=180, stride=1.2 | calcPaceSeconds = 60000/216 ≈ 277.78 → secondsToPaceStr 四舍五入 278 → "4'38\"/公里" | `{ prefix: '由平均步频: 180 步/分钟, 平均步幅: 1.2 米, 得出平均配速: ', value: "4'38\"/公里", suffix: '' }` |
| mode='cadence', paceSeconds=278, stride=1.2 | calcCadence = 60000/(278×1.2) ≈ 179.86 → round → 180 | `{ prefix: '由平均配速: 4\'38"/公里, 平均步幅: 1.2 米, 得出平均步频: ', value: '180', suffix: ' 步/分钟' }` |
| mode='stride', paceSeconds=278, cadence=180 | calcStride = 60000/(278×180) ≈ 1.199 → toFixed(2)=1.20 → parseFloat → "1.2" | `{ prefix: '由平均配速: 4\'38"/公里, 平均步频: 180 步/分钟, 得出平均步幅: ', value: '1.2', suffix: ' 米' }` |
| mode='pace', cadence=NaN（步频未填） | isValid(NaN) false | `null` |

- [ ] **Step 4: 提交**

```bash
git add src/logic/cadence-stride/constants.js src/logic/cadence-stride/calculator.js
git commit -m "feat: 新增步频步幅计算常量与公式逻辑"
```

---

## Task 2: 步频步幅计算页面 + 路由 + 九宫格入口

**Files:**
- Create: `src/pages/cadence-stride/index.vue`
- Modify: `src/pages.json`（新增路由）
- Modify: `src/pages/index/index.vue`（插入九宫格项 + 新增 indigo 配色 + 移除待开发/gray）

**Interfaces:**
- Consumes: Task 1 的 `MODE_OPTIONS/PACE_MIN_RANGE/PACE_SEC_RANGE/DEFAULT_PACE/CADENCE_UNIT/STRIDE_UNIT/PACE_UNIT/HINT_TEXT/APPENDIX` 与 `computeResult`；`@/utils/share` 的 `captureAndShare`（H5）
- Produces: 可在 H5 与微信小程序中打开的 `/pages/cadence-stride/index` 页面

- [ ] **Step 1: 创建 `src/pages/cadence-stride/index.vue`**

完整页面（靛蓝 `#5C6BC0` 主题，实时计算无按钮，分享/返回首页齐全）：

```vue
<template>
  <view class="page-container">
    <!-- 顶栏 #5C6BC0 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack">
        <text>←</text>
      </view>
      <text class="header-title">步频步幅计算</text>
    </view>

    <view class="content-wrapper">
      <!-- 计算项（三选一） -->
      <view class="section">
        <text class="section-label">计算项</text>
        <view class="mode-options">
          <view
            v-for="m in MODE_OPTIONS"
            :key="m.key"
            class="mode-option"
            :class="{ active: mode === m.key }"
            @click="selectMode(m.key)"
          >
            <text class="mode-radio">{{ mode === m.key ? '●' : '○' }}</text>
            <text class="mode-label">{{ m.label }}</text>
          </view>
        </view>
        <text class="section-hint">{{ HINT_TEXT }}</text>
      </view>

      <!-- 输入项（随模式隐藏其一） -->
      <view class="section">
        <text class="section-label">输入项</text>

        <!-- 步频 -->
        <view class="input-row" v-show="mode !== 'cadence'">
          <text class="input-label">步频</text>
          <input
            class="input-field"
            type="digit"
            v-model="cadenceInput"
            placeholder="如 180"
            :maxlength="4"
          />
          <text class="input-unit">{{ CADENCE_UNIT }}</text>
        </view>

        <!-- 步幅 -->
        <view class="input-row" v-show="mode !== 'stride'">
          <text class="input-label">步幅</text>
          <input
            class="input-field"
            type="digit"
            v-model="strideInput"
            placeholder="如 1.2"
            :maxlength="5"
          />
          <text class="input-unit">{{ STRIDE_UNIT }}</text>
        </view>

        <!-- 配速 -->
        <view class="input-row" v-show="mode !== 'pace'">
          <text class="input-label">配速</text>
          <picker
            mode="multiSelector"
            :range="pacePicker.ranges"
            :value="pacePicker.selected"
            @columnchange="onColumnChange"
            @change="onPaceChange"
          >
            <view class="pace-display">
              <view class="pace-col">
                <text class="pace-num">{{ pacePicker.ranges[0][pacePicker.selected[0]] }}</text>
                <text class="pace-label">分</text>
              </view>
              <view class="pace-col">
                <text class="pace-num">{{ pacePicker.ranges[1][pacePicker.selected[1]] }}</text>
                <text class="pace-label">秒</text>
              </view>
              <text class="pace-suffix">{{ PACE_UNIT }}</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 结果区（实时，无需按钮） -->
      <view v-if="hasResult" class="result-card">
        <text class="result-sentence">{{ result.prefix }}</text>
        <text class="result-value">{{ result.value }}</text>
        <text class="result-suffix">{{ result.suffix }}</text>
      </view>

      <!-- 附录 -->
      <text class="appendix-title">附录：步频 · 步幅 · 配速</text>
      <view class="appendix-card">
        <view class="appendix-section" v-for="(sec, i) in APPENDIX" :key="i">
          <text class="appendix-sec-title">{{ sec.title }}</text>
          <text class="appendix-sec-line" v-for="(line, j) in sec.lines" :key="j">{{ line }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="!sharing">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
import {
  MODE_OPTIONS, PACE_MIN_RANGE, PACE_SEC_RANGE, DEFAULT_PACE,
  CADENCE_UNIT, STRIDE_UNIT, PACE_UNIT, HINT_TEXT, APPENDIX,
} from '@/logic/cadence-stride/constants'
import { computeResult } from '@/logic/cadence-stride/calculator'

// ==================== 状态 ====================

const mode = ref('pace')          // 默认：由步频和步幅计算配速
const cadenceInput = ref('')      // 步频输入（步/分钟）
const strideInput = ref('')       // 步幅输入（米）

const pacePicker = reactive({
  ranges: [PACE_MIN_RANGE, PACE_SEC_RANGE],
  selected: [...DEFAULT_PACE],
})

const sharing = ref(false)

// ==================== 实时结果（computed 派生，输入即算） ====================

const result = computed(() => {
  const [mIdx, sIdx] = pacePicker.selected
  const paceSeconds = Number(pacePicker.ranges[0][mIdx]) * 60 + Number(pacePicker.ranges[1][sIdx])
  return computeResult({
    mode: mode.value,
    cadence: parseFloat(cadenceInput.value),
    stride: parseFloat(strideInput.value),
    paceSeconds,
  })
})

const hasResult = computed(() => result.value !== null)

// ==================== 方法 ====================

function selectMode(key) {
  mode.value = key
}

function onColumnChange(e) {
  const { column, value } = e.detail
  pacePicker.selected[column] = value
}

function onPaceChange(e) {
  pacePicker.selected = e.detail.value
}

function navigateBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '步频步幅计算 — 跑研社',
  path: '/pages/cadence-stride/index',
}))
// #endif

// 分享（H5 截图 + 二维码，参照完赛时间计算页面）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '步频步幅' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}
.content-wrapper {
  padding: 30rpx;
}

/* 顶栏 */
.header {
  height: 160rpx;
  background: #5C6BC0;
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
.back-btn text {
  color: #FFF;
  font-size: 40rpx;
}
.header-title {
  color: #FFF;
  font-size: 40rpx;
  font-weight: bold;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* 卡片区 */
.section {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.section-label {
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}
.section-hint {
  font-size: 22rpx;
  color: #95A5A6;
  display: block;
  margin-top: 16rpx;
}

/* 计算项单选行 */
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.mode-option {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #E0E0E0;
}
.mode-option.active {
  background: #E8EAF6;
  border-color: #5C6BC0;
}
.mode-radio {
  font-size: 28rpx;
  color: #5C6BC0;
}
.mode-label {
  font-size: 28rpx;
  color: #2C3E50;
}
.mode-option.active .mode-label {
  color: #3F51B5;
  font-weight: bold;
}

/* 输入行 */
.input-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
}
.input-label {
  width: 100rpx;
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
}
.input-field {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  color: #2C3E50;
  text-align: center;
}
.input-unit {
  width: 130rpx;
  font-size: 26rpx;
  color: #7F8C8D;
}

/* 配速选择器 */
.pace-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: baseline;
  padding: 16rpx 30rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 12rpx;
}
.pace-col {
  display: inline-flex;
  align-items: baseline;
  min-width: 100rpx;
}
.pace-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
  min-width: 48rpx;
  text-align: center;
}
.pace-label {
  font-size: 26rpx;
  color: #2C3E50;
  margin-left: 4rpx;
}
.pace-suffix {
  font-size: 24rpx;
  color: #95A5A6;
  margin-left: 8rpx;
}

/* 结果卡（实时） */
.result-card {
  background: #E8EAF6;
  border-radius: 16rpx;
  padding: 36rpx 30rpx;
  margin-bottom: 30rpx;
  line-height: 1.6;
}
.result-sentence,
.result-suffix {
  font-size: 28rpx;
  color: #2C3E50;
}
.result-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #5C6BC0;
}

/* 附录 */
.appendix-title {
  font-size: 26rpx;
  color: #95A5A6;
  display: block;
  margin: 30rpx 0 24rpx;
  padding-left: 8rpx;
}
.appendix-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.appendix-section {
  margin-bottom: 30rpx;
}
.appendix-section:last-child {
  margin-bottom: 0;
}
.appendix-sec-title {
  font-size: 28rpx;
  color: #5C6BC0;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}
.appendix-sec-line {
  font-size: 24rpx;
  color: #555;
  line-height: 1.7;
  display: block;
  margin-bottom: 8rpx;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0 60rpx;
}
.action-buttons .btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-share {
  background: #5C6BC0;
  color: #FFF;
}
.btn-home {
  background: #2C3E50;
  color: #FFF;
}
</style>
```

- [ ] **Step 2: 在 `src/pages.json` 注册路由**

在 `pages/level-query/index` 路由项之后、`pages/finish-time/index` 路由项之前插入：

```json
    {
      "path": "pages/cadence-stride/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
```

- [ ] **Step 3: 在 `src/pages/index/index.vue` 更新九宫格入口**

将 `menuItems` 数组整体替换为（移除「待开发」，在[等级查询]之后插入[步频步幅计算]，后续项 id 顺延）：

```js
const menuItems = [
  { id: 1, title: '跑力值计算', icon: '⚡', colorClass: 'blue', path: '/pages/running-power/index' },
  { id: 2, title: '成绩预测', icon: '🏆', colorClass: 'red', path: '/pages/performance-prediction/index' },
  { id: 3, title: '心率计算', icon: '❤️', colorClass: 'green', path: '/pages/heart-rate/index' },
  { id: 4, title: '配速计算器', icon: '⏱️', colorClass: 'cyan', path: '/pages/pace-calculator/index' },
  { id: 5, title: '完赛时间计算', icon: '🏁', colorClass: 'pink', path: '/pages/finish-time/index' },
  { id: 6, title: '等级查询', icon: '🥇', colorClass: 'orange', path: '/pages/level-query/index' },
  { id: 7, title: '步频步幅计算', icon: '👣', colorClass: 'indigo', path: '/pages/cadence-stride/index' },
  { id: 8, title: '跑步课表', icon: '📅', colorClass: 'purple', path: '/pages/training-schedule/index' },
  { id: 9, title: '成就体系', icon: '🏅', colorClass: 'teal', path: '/pages/achievement/index' }
]
```

同时修改 `.grid-item` 配色：将 `.grid-item.gray { background: #95A5A6; }` 替换为 `.grid-item.indigo { background: #5C6BC0; }`（移除已无用的 gray、新增 indigo）。

- [ ] **Step 4: dev-server 手动验收**

Run: `npm run dev:h5`（终端会输出访问 URL，浏览器打开首页）。

逐项确认：

1. 首页九宫格：共 9 项填满 3×3，新增[步频步幅计算]在第3行第1列（等级查询之后），靛蓝色块 + 👣 图标，点击进入步频步幅计算页
2. 页面默认：计算项默认选中第一项「由步频和步幅计算配速」；显示步频、步幅两个输入框，配速输入**隐藏**；结果区**不显示**
3. 实时计算（用例1）：步频填 `180`、步幅填 `1.2` → 结果区立即显示 `由平均步频: 180 步/分钟, 平均步幅: 1.2 米, 得出平均配速: **4'38"/公里**`（4'38" 靛蓝突出）
4. 输入缺失：清空任一项 → 结果区立即消失
5. 切到第二项「由配速和步幅计算步频」：步频输入**隐藏**、配速输入出现（默认 5'00"）；步幅仍填 `1.2` → 显示 `由平均配速: 5'00"/公里, 平均步幅: 1.2 米, 得出平均步频: **167** 步/分钟`（60000/(300×1.2)=166.7→167）
6. 切到第三项「由配速和步频计算步幅」：步幅输入**隐藏**；步频仍填 `180`、配速 5'00" → 显示 `由平均配速: 5'00"/公里, 平均步频: 180 步/分钟, 得出平均步幅: **1.11** 米`
7. 再次切回第一项：步频 `180`、步幅 `1.2` 仍保留，结果立即重算为 `4'38"/公里`
8. 用例2：第二项 + 配速选 `4'38"`、步幅 `1.2` → 步频 `180` 步/分钟
9. 用例3：第三项 + 配速 `4'38"`、步频 `180` → 步幅 `1.2` 米
10. 配速 picker：点开选择分/秒，确认后结果立即更新
11. 附录区：标题「附录：步频 · 步幅 · 配速」，5 板块（步频/步幅/配速/三者关系/训练建议）文案完整
12. [返回首页]：回到首页（tabBar switchTab）
13. [分享]：触发浏览器下载 `步频步幅.png`（截图含结果区与附录，按钮隐藏）

- [ ] **Step 5: 提交**

```bash
git add src/pages/cadence-stride/index.vue src/pages.json src/pages/index/index.vue
git commit -m "feat: 新增步频步幅计算页面、路由与九宫格入口"
```

---

## Task 3: 双平台构建验证

**Files:**
- 无改动（仅验证）

- [ ] **Step 1: H5 生产构建**

Run: `npm run build:h5`
Expected: 构建成功，`dist/build/h5` 生成，无报错。

- [ ] **Step 2: 微信小程序生产构建**

Run: `npm run build:mp-weixin`
Expected: 构建成功，`dist/build/mp-weixin` 生成，无报错。

- [ ] **Step 3: 确认部署产物**

`postbuild:h5` 会自动运行 `scripts/prepare-deploy.sh`；若构建通过且无报错即可。

---

## Self-Review 结论（编写时已核对）

- **规格覆盖**：常量/公式（Task1）、页面/路由/入口（Task2）、构建（Task3）逐一对应设计文档第 3~6 节；三模式隐藏、实时计算无按钮、结果句文案、附录、分享、返回首页、移除待开发均落在 Task2 验收清单
- **占位符扫描**：无 TBD/TODO，所有代码步骤含完整实现
- **类型一致性**：`computeResult({ mode, cadence, stride, paceSeconds })` 参数结构与返回 `{ prefix, value, suffix }` 在 Task1 定义、Task2 消费一致；`DEFAULT_PACE` 在 constants 定义、页面 `selected: [...DEFAULT_PACE]` 拷贝使用（避免改动常量）；`PACE_MIN_RANGE/PACE_SEC_RANGE` 命名与完赛时间模块一致
