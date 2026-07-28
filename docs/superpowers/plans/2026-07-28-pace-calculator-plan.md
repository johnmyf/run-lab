# 配速计算器 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现配速计算器页面，用户选择距离和期望完成时间后，生成配速分段表格，支持匀速和变速策略。

**Architecture:** 三层结构：constants（配置）→ calculator（算法）→ page（UI），与项目现有模式一致。

**Tech Stack:** uni-app 3.0 (Vue 3, Composition API)、微信小程序 + H5

## 全局约束

- 使用 uni-app 跨平台组件：`<view>` 替代 `<div>`，`<text>` 替代 `<p>/<span>`，不出现 HTML 标签
- CSS 单位使用 `rpx`，不使用 `px`、`:hover`、`cursor: pointer`
- 组件的 JavaScript/TypeScript 中使用 `@/` 路径别名引用 `src/` 下模块
- 页眉颜色：青色 `#00BCD4`
- 与成绩预测页一致，分享使用 `html2canvas`（H5 条件编译）

---
### Task 1: 常量配置

**Files:**
- Create: `src/logic/pace-calculator/constants.js`

**Interfaces:**
- Produces: `DISTANCE_CONFIGS`（距离配置表）、`INTERVAL_OPTIONS`（显示间隔）、`STRATEGY_CONFIG`（策略参数）、pickr 范围数组

- [ ] **Step 1: 创建常量文件**

```js
/**
 * 配速计算器 — 常量配置
 * @module logic/pace-calculator/constants
 */

/** 距离配置 */
export const DISTANCE_CONFIGS = [
  { key: '5k',        label: '5公里',        km: 5 },
  { key: '10k',      label: '10公里',       km: 10 },
  { key: '15k',      label: '15公里',       km: 15 },
  { key: 'half',     label: '半程马拉松',    km: 21.0975 },
  { key: 'marathon', label: '马拉松',       km: 42.195 },
]

/** 显示间隔选项 */
export const INTERVAL_OPTIONS = [
  { value: 1, label: '1公里' },
  { value: 5, label: '5公里' },
]

/** 配速策略配置 */
export const STRATEGY_CONFIG = {
  SEGMENTS: 5,    // 固定分 5 段
  MIN: -10,       // 前慢后快最大值
  MAX: 10,        // 前快后慢最大值
  STEP: 1,        // 步长
}

/** 时间选择器范围 */
export const HOUR_RANGE = Array.from({ length: 7 }, (_, i) => i)         // 0-6
export const MIN_SEC_RANGE = Array.from({ length: 60 }, (_, i) => i)     // 0-59
```

- [ ] **Step 2: 验证文件结构**

```bash
ls -la src/logic/pace-calculator/constants.js
```

- [ ] **Step 3: 提交**

```bash
git add src/logic/pace-calculator/constants.js
git commit -m "feat(pace-calculator): add constants config"
```

---
### Task 2: 核心算法

**Files:**
- Create: `src/logic/pace-calculator/calculator.js`

**Interfaces:**
- Consumes: `DISTANCE_CONFIGS` (from constants.js)
- Produces: `calculatePaceTable(params)` — 主入口函数
  - 输入: `{ distanceKey, hours, minutes, seconds, strategy, interval }`
  - 输出: `{ avgPaceDisplay: string, avgPaceSeconds: number, totalKm: number, totalSeconds: number, rows: Array<{km, cumulativeDisplay, paceDisplay}> }`

**算法总览：**
```
1. 计算总秒数、总公里数、平均配速
2. 按策略计算 5 段配速值
   - 匀速: 全段相同
   - 非匀速: 等比数列 + 总时间约束逆推基础配速
3. 计算各公里边界精确累计时间（逐段累加）
4. 对每公里行：累计时间四舍五入取整 → 该公里配速 = 差值
5. 尾行显示该段每公里配速
6. 按间隔过滤（1km 全显示 / 5km 按块平均）
7. 格式化输出
```

- [ ] **Step 1: 创建 calculator.js 骨架**

```js
/**
 * 配速计算器 — 核心算法
 * @module logic/pace-calculator/calculator
 */
import { DISTANCE_CONFIGS, STRATEGY_CONFIG } from './constants'

/**
 * 计算配速表格
 * @param {Object} params
 * @param {string} params.distanceKey - 距离键值
 * @param {number} params.hours - 时 0-6
 * @param {number} params.minutes - 分 0-59
 * @param {number} params.seconds - 秒 0-59
 * @param {number} params.strategy - 配速策略 -10~+10
 * @param {number} params.interval - 显示间隔 1|5
 * @returns {Object} { avgPaceDisplay, avgPaceSeconds, totalKm, totalSeconds, rows }
 */
export function calculatePaceTable(params) {
  const { distanceKey, hours, minutes, seconds, strategy, interval } = params
  const config = DISTANCE_CONFIGS.find(d => d.key === distanceKey)
  if (!config) return null

  const totalKm = config.km
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  if (totalSeconds <= 0) return null

  const avgPaceSeconds = totalSeconds / totalKm
  const avgPaceDisplay = formatPace(avgPaceSeconds)

  // 计算 5 段配速
  const segmentPaces = calculateSegmentPaces(totalSeconds, totalKm, strategy)

  // 生成表格行
  const rows = buildRows(totalKm, totalSeconds, segmentPaces, interval)

  return { avgPaceDisplay, avgPaceSeconds: Math.round(avgPaceSeconds), totalKm, totalSeconds, rows }
}

/** 计算 5 段配速值（秒/公里） */
function calculateSegmentPaces(totalSeconds, totalKm, strategy) { /* TODO */ }

/** 生成表格行 */
function buildRows(totalKm, totalSeconds, segmentPaces, interval) { /* TODO */ }

/** 精确累计时间（某公里点的精确秒数） */
function exactCumulativeTime(distance, totalKm, segmentPaces) { /* TODO */ }
```

- [ ] **Step 2: 实现 calculateSegmentPaces**

当 `strategy === 0`（匀速）:
- 5 段配速相同 = `totalSeconds / totalKm`

当 `strategy !== 0`:
- 段间变化率 `r = strategy / 100 / STRATEGY_CONFIG.SEGMENTS`
- 等比数列和 `sum = (Math.pow(1 + r, 5) - 1) / r`
- 基础配速 `P = totalSeconds * 5 / (totalKm * sum)`
- 段 k 配速 = `P * Math.pow(1 + r, k - 1)`, k = 1..5

```js
function calculateSegmentPaces(totalSeconds, totalKm, strategy) {
  const { SEGMENTS } = STRATEGY_CONFIG
  const r = strategy / 100 / SEGMENTS

  if (Math.abs(r) < 0.0001) {
    // 匀速
    const pace = totalSeconds / totalKm
    return Array(SEGMENTS).fill(pace)
  }

  // 等比数列和：Σ(1+r)^(k-1) for k=1..5
  const sum = (Math.pow(1 + r, SEGMENTS) - 1) / r
  const P = totalSeconds * SEGMENTS / (totalKm * sum)

  return Array.from({ length: SEGMENTS }, (_, i) => P * Math.pow(1 + r, i))
}
```

- [ ] **Step 3: 实现 exactCumulativeTime**

遍历 5 段，累加每段内的距离 × 段配速，直到达到目标距离。

```js
function exactCumulativeTime(distance, totalKm, segmentPaces) {
  const { SEGMENTS } = STRATEGY_CONFIG
  const segLen = totalKm / SEGMENTS
  let time = 0
  let remaining = distance

  for (let i = 0; i < SEGMENTS && remaining > 0.0001; i++) {
    const segDist = Math.min(remaining, segLen)
    time += segDist * segmentPaces[i]
    remaining -= segDist
  }

  return time
}
```

- [ ] **Step 4: 实现 buildRows（1km 间隔模式）**

核心思路：计算各公里边界的精确累计时间，四舍五入后取差值作为配速。尾行单独处理。

```js
function buildRows(totalKm, totalSeconds, segmentPaces, interval) {
  const numFullKm = Math.floor(totalKm)
  const hasPartialKm = totalKm - numFullKm > 0.001

  // Step 1: 计算所有公里边界的精确累计时间
  const boundaries = [{ km: 0, exactCum: 0 }]
  for (let i = 1; i <= numFullKm; i++) {
    boundaries.push({ km: i, exactCum: exactCumulativeTime(i, totalKm, segmentPaces) })
  }
  if (hasPartialKm) {
    boundaries.push({ km: totalKm, exactCum: totalSeconds })
  }

  // Step 2: 生成每公里行
  const allRows = []
  const { SEGMENTS } = STRATEGY_CONFIG

  for (let i = 1; i < boundaries.length; i++) {
    const prev = boundaries[i - 1]
    const curr = boundaries[i]
    const isLastRow = (i === boundaries.length - 1)

    const roundedCum = Math.round(curr.exactCum)
    const prevRoundedCum = Math.round(prev.exactCum)

    let paceSeconds
    if (isLastRow) {
      // 尾行：使用该段每公里配速（不是按剩余距离换算）
      const segIdx = Math.min(Math.floor(prev.km * SEGMENTS / totalKm), SEGMENTS - 1)
      paceSeconds = Math.round(segmentPaces[segIdx])
    } else {
      paceSeconds = roundedCum - prevRoundedCum
    }

    allRows.push({
      km: curr.km,
      cumulativeSeconds: roundedCum,
      paceSeconds,
    })
  }

  // Step 3: 按间隔过滤
  if (interval === 1) {
    return allRows
  }

  // interval === 5: 每 5km 显示一行，配速为该 5km 块的平均配速
  const result = []
  let lastCum = 0
  let lastKm = 0

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    const kmInt = Math.round(row.km)
    const isTotal = (row.km === totalKm)

    if (isTotal || (kmInt % 5 === 0 && kmInt > 0)) {
      let paceSeconds

      if (isTotal && Math.abs(row.km - kmInt) > 0.001) {
        // 有小数尾行：显示最后一段的每公里配速（不是块平均）
        paceSeconds = Math.round(segmentPaces[SEGMENTS - 1])
      } else {
        // 整公里行：显示该 5km 块的平均配速
        const blockDist = row.km - lastKm
        const blockTime = row.cumulativeSeconds - lastCum
        paceSeconds = blockDist > 0 ? Math.round(blockTime / blockDist) : 0
      }

      result.push({
        km: row.km,
        cumulativeSeconds: row.cumulativeSeconds,
        paceSeconds,
      })

      lastCum = row.cumulativeSeconds
      lastKm = row.km
    }
  }

  return result
}
```

- [ ] **Step 5: 实现格式化函数**

```js
/**
 * 格式化秒数为配速显示 "M'SS""
 * @param {number} secs
 * @returns {string} 如 "5'41""
 */
export function formatPace(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}'${String(s).padStart(2, '0')}"`
}

/**
 * 格式化秒数为时间显示 "H:MM:SS" 或 "MM:SS"
 * @param {number} totalSecs - 整数
 * @returns {string}
 */
export function formatTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
```

- [ ] **Step 6: 添加边界处理**

在 `calculatePaceTable` 顶部添加：
```js
if (!config) return null
if (totalSeconds <= 0) return null
if (strategy < STRATEGY_CONFIG.MIN || strategy > STRATEGY_CONFIG.MAX) return null
if (interval !== 1 && interval !== 5) return null
```

- [ ] **Step 7: 验证算法（手动测试）**

```js
// 理想测试用例：半马2小时，匀速，1km间隔
const result = calculatePaceTable({
  distanceKey: 'half',
  hours: 2, minutes: 0, seconds: 0,
  strategy: 0,
  interval: 1,
})
console.log('平均配速:', result.avgPaceDisplay)  // 应 ≈ 5'41"
console.log('行数:', result.rows.length)          // 22（21全km + 1尾行）
console.log('最后行:', result.rows[result.rows.length - 1])
// { km: 21.0975, cumulativeSeconds: 7200, paceSeconds: 341 }

// 验证尾行累计时间 = 7200
console.assert(result.rows[result.rows.length - 1].cumulativeSeconds === 7200, '总时间不匹配')
```

- [ ] **Step 8: 提交**

```bash
git add src/logic/pace-calculator/calculator.js
git commit -m "feat(pace-calculator): add core calculator algorithm"
```

---
### Task 3: 页面组件

**Files:**
- Modify: `src/pages/pace-calculator/index.vue`（替换占位内容）

**Interfaces:**
- Consumes: `calculatePaceTable`, `formatPace`, `formatTime` (from calculator.js)
- Consumes: `DISTANCE_CONFIGS`, `INTERVAL_OPTIONS`, `STRATEGY_CONFIG`, `HOUR_RANGE`, `MIN_SEC_RANGE` (from constants.js)

## 组件结构

```
<template>
  <view class="page-container">
    <!-- 顶栏 #00BCD4 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack"> ← </view>
      <text class="header-title">配速计算器</text>
    </view>

    <view class="content-wrapper">
      <!-- 输入区 -->
      <view class="section distance-section">
        <text class="section-label">选择跑步距离</text>
        <view class="distance-options">
          <view v-for="d in DISTANCE_CONFIGS" :key="d.key"
            class="distance-chip"
            :class="{ active: distanceKey === d.key }"
            @click="selectDistance(d.key)">
            <text>{{ d.label }}</text>
          </view>
        </view>
      </view>

      <view class="section time-section">
        <text class="section-label">期望完成时间</text>
        <view class="time-picker-row">
          <!-- 三列 picker: 时/分/秒 -->
          <picker mode="multiSelector"
            :range="[HOUR_RANGE, MIN_SEC_RANGE, MIN_SEC_RANGE]"
            :value="[hoursIdx, minutesIdx, secondsIdx]"
            @change="onTimeChange">
            <view class="time-display">
              <text>{{ HOUR_RANGE[hoursIdx] }}时</text>
              <text>{{ MIN_SEC_RANGE[minutesIdx] }}分</text>
              <text>{{ MIN_SEC_RANGE[secondsIdx] }}秒</text>
            </view>
          </picker>
        </view>
      </view>

      <button class="calculate-btn" @click="calculate">计算配速</button>

      <!-- 结果区（计算后显示） -->
      <view v-if="hasResult" class="result-section">
        <view class="avg-pace-card">
          <text class="avg-pace-label">平均配速</text>
          <text class="avg-pace-value">{{ result.avgPaceDisplay }}/公里</text>
        </view>

        <!-- 配速策略滑杆 -->
        <view class="section">
          <text class="section-label">配速策略</text>
          <view class="strategy-row">
            <text class="strategy-label">先慢后快</text>
            <slider :min="STRATEGY_CONFIG.MIN" :max="STRATEGY_CONFIG.MAX"
              :step="STRATEGY_CONFIG.STEP" :value="strategy"
              @changing="onStrategyChanging" @change="onStrategyChange"
              activeColor="#00BCD4" />
            <text class="strategy-label">先快后慢</text>
          </view>
          <text class="strategy-hint">{{ strategyHint }}</text>
        </view>

        <!-- 显示间隔 -->
        <view class="section">
          <text class="section-label">显示间隔</text>
          <view class="interval-options">
            <view v-for="opt in INTERVAL_OPTIONS" :key="opt.value"
              class="interval-radio"
              :class="{ active: interval === opt.value }"
              @click="selectInterval(opt.value)">
              <text>{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- 配速表格 -->
        <view class="pace-table-wrapper">
          <view class="pace-table">
            <view class="table-header">
              <text class="col-km">公里</text>
              <text class="col-time">时间</text>
              <text class="col-pace">配速</text>
            </view>
            <scroll-view scroll-y class="table-body">
              <view class="table-row" v-for="(row, idx) in result.rows" :key="idx"
                :class="{ 'total-row': isLastRow(idx) }">
                <text class="col-km">{{ formatKm(row.km) }}</text>
                <text class="col-time">{{ formatTime(row.cumulativeSeconds) }}</text>
                <text class="col-pace">{{ formatPace(row.paceSeconds) }}</text>
              </view>
            </scroll-view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons" v-show="!sharing">
          <button class="btn btn-share" @click="shareResult">分享</button>
          <button class="btn btn-home" @click="goHome">返回首页</button>
          <button class="btn btn-re-eval" @click="scrollToTop">重新评估</button>
        </view>
      </view>
    </view>
  </view>
</template>
```

## 交互逻辑

- **选择距离**: `selectDistance(key)` → 更新 `distanceKey`，清除已有结果
- **修改时间**: `onTimeChange(e)` → 更新 picker 索引，清除已有结果
- **点击计算**: `calculate()` → 验证时间>0 → 调用 `calculatePaceTable()` → 更新结果
- **拖动策略**: `onStrategyChanging(e)` → 更新 `strategy` 值和提示文字；`onStrategyChange(e)` → 重新计算
- **切换间隔**: `selectInterval(v)` → 更新 `interval` → 重新计算

- [ ] **Step 1: 实现模板结构**

创建完整的 template，包括：
- 青色 header（← 返回 + 标题居中）
- 距离选择（胶囊式按钮组）
- 时间选择器（picker mode="multiSelector" 三列：时/分/秒）
- 计算按钮
- 结果区（v-if 控制显隐）：
  - 平均配速卡片
  - 策略滑杆
  - 显示间隔单选
  - 配速表格（带滚动）
  - 操作按钮组

- [ ] **Step 2: 实现 script 逻辑**

```html
<script setup>
import { ref, computed } from 'vue'
// #ifdef H5
import html2canvas from 'html2canvas'
// #endif
import {
  DISTANCE_CONFIGS, INTERVAL_OPTIONS, STRATEGY_CONFIG,
  HOUR_RANGE, MIN_SEC_RANGE,
} from '@/logic/pace-calculator/constants'
import { calculatePaceTable, formatPace, formatTime } from '@/logic/pace-calculator/calculator'

// 状态
const distanceKey = ref(null)
const hoursIdx = ref(0)
const minutesIdx = ref(0)
const secondsIdx = ref(0)
const strategy = ref(0)
const interval = ref(1)
const result = ref(null)
const sharing = ref(false)

const hasResult = computed(() => result.value !== null && result.value.rows?.length > 0)

// 策略提示
const strategyHint = computed(() => {
  if (strategy.value === 0) return '匀速 — 全程配速一致'
  if (strategy.value < 0) return `前慢后快 — 前段慢 ${Math.abs(strategy.value)}%，后段快 ${Math.abs(strategy.value)}%`
  return `前快后慢 — 前段快 ${strategy.value}%，后段慢 ${strategy.value}%`
})

// 方法
function selectDistance(key) {
  distanceKey.value = key
  result.value = null
}

function onTimeChange(e) {
  const [h, m, s] = e.detail.value
  hoursIdx.value = h
  minutesIdx.value = m
  secondsIdx.value = s
  result.value = null
}

function calculate() {
  if (!distanceKey.value) {
    uni.showToast({ title: '请选择跑步距离', icon: 'none' })
    return
  }
  const totalSecs = HOUR_RANGE[hoursIdx.value] * 3600
    + MIN_SEC_RANGE[minutesIdx.value] * 60
    + MIN_SEC_RANGE[secondsIdx.value]
  if (totalSecs <= 0) {
    uni.showToast({ title: '请设置有效时间', icon: 'none' })
    return
  }

  result.value = calculatePaceTable({
    distanceKey: distanceKey.value,
    hours: HOUR_RANGE[hoursIdx.value],
    minutes: MIN_SEC_RANGE[minutesIdx.value],
    seconds: MIN_SEC_RANGE[secondsIdx.value],
    strategy: strategy.value,
    interval: interval.value,
  })
}

function onStrategyChanging(e) {
  strategy.value = e.detail.value
}

function onStrategyChange() {
  if (hasResult.value) calculate()
}

function selectInterval(v) {
  interval.value = v
  if (hasResult.value) calculate()
}

function isLastRow(idx) {
  return result.value && idx === result.value.rows.length - 1
}

function formatKm(km) {
  const intKm = Math.round(km)
  if (Math.abs(km - intKm) < 0.001) return String(intKm)
  return km.toFixed(3)
}

function navigateBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }
function scrollToTop() {
  result.value = null
  uni.pageScrollTo({ scrollTop: 0, duration: 300 })
}

// 分享（H5 截图）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await uni.nextTick()
  try {
    const canvas = await html2canvas(document.querySelector('.page-container'), {
      useCORS: true,
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = '配速计划.png'
    link.href = canvas.toDataURL()
    link.click()
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  }
  sharing.value = false
  // #endif
}
</script>
```

- [ ] **Step 3: 实现样式**

```html
<style scoped>
/* 全局布局 */
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
  background: #00BCD4;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  position: relative;
}
.back-btn {
  width: 60rpx; height: 60rpx;
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}
.back-btn text { color: #FFF; font-size: 40rpx; }
.header-title {
  color: #FFF; font-size: 40rpx; font-weight: bold;
  position: absolute; left: 50%; transform: translateX(-50%);
}

/* 卡片区 */
.section {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.section-label {
  font-size: 28rpx; color: #2C3E50; font-weight: bold;
  display: block; margin-bottom: 20rpx;
}

/* 距离选择 - 胶囊按钮 */
.distance-options {
  display: flex; flex-wrap: wrap; gap: 16rpx;
}
.distance-chip {
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx; color: #7F8C8D;
  transition: all 0.2s;
}
.distance-chip.active {
  background: #00BCD4;
  border-color: #00BCD4;
  color: #FFF;
}

/* 时间选择器 */
.time-picker-row {
  display: flex; justify-content: center;
}
.time-display {
  display: flex; gap: 20rpx;
  padding: 20rpx 40rpx;
  background: #F0F8FF;
  border-radius: 12rpx;
  border: 2rpx solid #E0E0E0;
}
.time-display text {
  font-size: 36rpx; font-weight: bold; color: #2C3E50;
}

/* 计算按钮 */
.calculate-btn {
  width: 100%; height: 88rpx;
  background: #00BCD4; color: #FFF;
  font-size: 32rpx; font-weight: bold;
  border-radius: 44rpx;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,188,212,0.4);
}

/* 平均配速 */
.avg-pace-card {
  background: #E0F7FA;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 24rpx;
}
.avg-pace-label { font-size: 26rpx; color: #555; display: block; }
.avg-pace-value {
  font-size: 48rpx; font-weight: bold; color: #00BCD4;
  display: block; margin-top: 10rpx;
}

/* 策略滑杆 */
.strategy-row {
  display: flex; align-items: center; gap: 16rpx;
}
.strategy-label { font-size: 22rpx; color: #7F8C8D; white-space: nowrap; }
slider { flex: 1; }
.strategy-hint {
  font-size: 24rpx; color: #00BCD4;
  text-align: center; display: block; margin-top: 10rpx;
}

/* 间隔单选 */
.interval-options {
  display: flex; gap: 30rpx;
}
.interval-radio {
  padding: 12rpx 36rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx; color: #7F8C8D;
}
.interval-radio.active {
  background: #00BCD4; border-color: #00BCD4; color: #FFF;
}

/* 配速表格 */
.pace-table-wrapper {
  background: #FFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.table-header {
  display: flex; padding: 20rpx 30rpx;
  background: #00BCD4; color: #FFF;
  font-size: 28rpx; font-weight: bold;
}
.table-body { max-height: 700rpx; }
.table-row {
  display: flex; padding: 20rpx 30rpx;
  border-bottom: 2rpx solid #F0F0F0;
  font-size: 28rpx; color: #2C3E50;
}
.table-row:last-child { border-bottom: none; }
.table-row.total-row {
  background: #E0F7FA;
  font-weight: bold;
}
.col-km { width: 30%; }
.col-time { width: 35%; text-align: center; }
.col-pace { width: 35%; text-align: right; }

/* 操作按钮 */
.action-buttons {
  display: flex; gap: 20rpx; padding: 30rpx 0 60rpx;
}
.action-buttons .btn {
  flex: 1; height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx; display: flex;
  align-items: center; justify-content: center;
}
.btn-share { background: #00BCD4; color: #FFF; }
.btn-home { background: #2C3E50; color: #FFF; }
.btn-re-eval { background: #ECF0F1; color: #2C3E50; }
</style>
```

- [ ] **Step 4: 验证页面**

```bash
npm run dev:h5
# 在浏览器中测试：
# 1. 选择距离 → 半程马拉松
# 2. 设置时间 → 2时0分0秒
# 3. 点击计算 → 检查表格是否正确
# 4. 拖拽策略滑杆 → 表格更新
# 5. 切换显示间隔 → 表格更新
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/pace-calculator/index.vue
git commit -m "feat(pace-calculator): implement pace calculator page"
```
