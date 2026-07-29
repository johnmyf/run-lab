# 完赛时间计算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建"完赛时间计算"页面，允许用户选择跑步距离和平均配速，计算预计完赛时间并展示分段表。

**Architecture:** 高度复用配速计算器的共享函数（calculateSegmentPaces、buildRows、formatPace、formatTime），完赛时间计算器只做输入转换（配速→总秒数），分段生成逻辑一字不改。页面模板也参照配速计算器，将时间 picker 替换为配速 picker。

**Tech Stack:** uni-app 3 (Vue 3 Composition API, `<script setup>`), Vite 5.2

## Global Constraints

- 所有交互和文档使用中文
- CSS 单位使用 `rpx`（750rpx = 屏幕宽度），不使用 `px`
- 使用 uni-app 跨平台组件：`<view>` 替代 `<div>`，`<text>` 替代 `<h1>/<h2>/<p>/<span>`
- 避免使用 `:hover` 伪类和 `cursor: pointer`
- 主题色：青色 `#00BCD4`（与配速计算器一致）
- 页面路由使用 `navigationStyle: "custom"`
- 避免破坏现有配速计算器功能

---
### Task 1: 导出配速计算器的共享函数

**Files:**
- Modify: `src/logic/pace-calculator/calculator.js`（给 3 个内部函数加 export）

**Interfaces:**
- Consumes: 无（纯修改现有文件）
- Produces: 导出的 `calculateSegmentPaces`、`exactCumulativeTime`、`buildRows`

- [ ] **Step 1: 给 calculateSegmentPaces 加 export**

在 `src/logic/pace-calculator/calculator.js` 中将第 49 行的 `function calculateSegmentPaces` 改为 `export function calculateSegmentPaces`

- [ ] **Step 2: 给 exactCumulativeTime 加 export**

将第 77 行的 `function exactCumulativeTime` 改为 `export function exactCumulativeTime`

- [ ] **Step 3: 给 buildRows 加 export**

将第 93 行的 `function buildRows` 改为 `export function buildRows`

- [ ] **Step 4: 提交**

```bash
git add src/logic/pace-calculator/calculator.js
git commit -m "refactor(pace-calculator): export shared functions for reuse

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---
### Task 2: 创建完赛时间计算器的常量配置

**Files:**
- Create: `src/logic/finish-time/constants.js`

**Interfaces:**
- Consumes: 无
- Produces: `export const PACE_MIN_RANGE`、`export const PACE_SEC_RANGE`

配速选择器只有分和秒两列。分 0~15，秒 00~59。

- [ ] **Step 1: 创建常量文件**

`src/logic/finish-time/constants.js`:

```js
/**
 * 完赛时间计算 — 常量配置
 * @module logic/finish-time/constants
 */

/** 配速 - 分钟范围（0~15） */
export const PACE_MIN_RANGE = Array.from({ length: 16 }, (_, i) => String(i))

/** 配速 - 秒范围（00~59） */
export const PACE_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
```

- [ ] **Step 2: 提交**

```bash
git add src/logic/finish-time/constants.js
git commit -m "feat(finish-time): add pace picker range constants

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---
### Task 3: 创建完赛时间计算器核心算法

**Files:**
- Create: `src/logic/finish-time/calculator.js`

**Interfaces:**
- Consumes: 从 pace-calculator/calculator.js 导入的 `calculateSegmentPaces`、`buildRows`、`formatPace`、`formatTime`；从 pace-calculator/constants.js 导入的 `DISTANCE_CONFIGS`、`STRATEGY_CONFIG`
- Produces: `calculateFinishTimeTable(params)`

`calculateFinishTimeTable` 的参数和返回值：

```js
/**
 * 计算完赛时间表格
 * @param {Object} params
 * @param {string} params.distanceKey - 距离键值 '5k'|'10k'|'15k'|'half'|'marathon'|'custom'
 * @param {number} params.paceMin - 配速分钟 0-15
 * @param {number} params.paceSec - 配速秒 0-59
 * @param {number} params.strategy - 配速策略 -10~+10
 * @param {number} params.interval - 显示间隔 1|5
 * @param {number|null} params.customKm - 自定义距离（仅 custom 时）
 * @returns {Object|null} { totalTimeDisplay, avgPaceDisplay, avgPaceSeconds, totalKm, totalSeconds, rows }
 */

// 核心逻辑:
// 1. 确定 totalKm（同配速计算器）
// 2. paceSeconds = paceMin * 60 + paceSec
// 3. totalSeconds = paceSeconds * totalKm
// 4. segmentPaces = calculateSegmentPaces(totalSeconds, totalKm, strategy)
// 5. rows = buildRows(totalKm, totalSeconds, segmentPaces, interval)
// 6. 返回 { totalTimeDisplay, avgPaceDisplay, avgPaceSeconds, totalKm, totalSeconds, rows }
```

- [ ] **Step 1: 创建 calculator.js**

```js
/**
 * 完赛时间计算 — 核心算法
 * @module logic/finish-time/calculator
 */
import { DISTANCE_CONFIGS } from '@/logic/pace-calculator/constants'
import {
  calculateSegmentPaces,
  buildRows,
  formatPace,
  formatTime,
} from '@/logic/pace-calculator/calculator'

/**
 * 计算完赛时间表格
 * @param {Object} params
 * @param {string} params.distanceKey
 * @param {number} params.paceMin - 配速分钟 0-15
 * @param {number} params.paceSec - 配速秒 0-59
 * @param {number} params.strategy - -10~+10
 * @param {number} params.interval - 1|5
 * @param {number|null} params.customKm
 * @returns {Object|null}
 */
export function calculateFinishTimeTable(params) {
  const { distanceKey, paceMin, paceSec, strategy, interval, customKm } = params

  // 确定总距离
  let totalKm
  if (distanceKey === 'custom') {
    if (!customKm || customKm < 3 || customKm > 300) return null
    totalKm = customKm
  } else {
    const config = DISTANCE_CONFIGS.find(d => d.key === distanceKey)
    if (!config) return null
    totalKm = config.km
  }

  // 平均配速 → 总秒数
  if (paceMin < 0 || paceMin > 15 || paceSec < 0 || paceSec > 59) return null
  const paceSeconds = paceMin * 60 + paceSec
  if (paceSeconds <= 0) return null
  const totalSeconds = Math.round(paceSeconds * totalKm)

  // 复用共享算法
  const segmentPaces = calculateSegmentPaces(totalSeconds, totalKm, strategy)
  const rows = buildRows(totalKm, totalSeconds, segmentPaces, interval)

  return {
    totalTimeDisplay: formatTime(totalSeconds),
    avgPaceDisplay: formatPace(paceSeconds),
    avgPaceSeconds: Math.round(paceSeconds),
    totalKm,
    totalSeconds,
    rows,
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/logic/finish-time/calculator.js
git commit -m "feat(finish-time): add finish time calculation logic

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---
### Task 4: 创建完赛时间计算页面组件

**Files:**
- Create: `src/pages/finish-time/index.vue`

**Interfaces:**
- Consumes: `calculateFinishTimeTable` from `@/logic/finish-time/calculator`；`DISTANCE_CONFIGS`、`INTERVAL_OPTIONS`、`STRATEGY_CONFIG` from `@/logic/pace-calculator/constants`；`PACE_MIN_RANGE`、`PACE_SEC_RANGE` from `@/logic/finish-time/constants`
- Produces: 完整的可交互页面

页面结构与配速计算器高度一致，主要差异：
1. 配速选择器为 2 列（分/秒），而非 3 列（时/分/秒）
2. 结果区显示"预计完赛时间"卡片而非"平均配速"卡片
3. 计算按钮文字改为"计算"
4. 分享截图标题改为"完赛计划.png"

- [ ] **Step 1: 创建页面组件**

`src/pages/finish-time/index.vue`，完整内容如下：

```vue
<template>
  <view class="page-container">
    <!-- 顶栏 #00BCD4 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack">
        <text>←</text>
      </view>
      <text class="header-title">完赛时间计算</text>
    </view>

    <view class="content-wrapper">
      <!-- 选择跑步距离 -->
      <view class="section">
        <text class="section-label">选择跑步距离</text>
        <view class="distance-options">
          <view
            v-for="d in distanceOptions"
            :key="d.key"
            class="distance-chip"
            :class="{ active: distanceKey === d.key }"
            @click="selectDistance(d.key)"
          >
            <text>{{ d.label }}</text>
          </view>
        </view>
      </view>

      <!-- 自定义距离弹窗 -->
      <view class="modal-overlay" v-if="showCustomModal" @click="cancelCustom">
        <view class="modal-box" @click.stop>
          <text class="modal-title">自定义距离</text>
          <view class="modal-input-row">
            <input
              class="modal-input"
              v-model="customKmInput"
              type="digit"
              placeholder="输入距离"
              :maxlength="6"
            />
            <text class="modal-unit">公里</text>
          </view>
          <text class="modal-hint">范围：3.00 ~ 300.00 公里</text>
          <view class="modal-buttons">
            <button class="modal-btn modal-btn-cancel" @click="cancelCustom">取消</button>
            <button class="modal-btn modal-btn-confirm" @click="confirmCustom">确定</button>
          </view>
        </view>
      </view>

      <!-- 平均配速 -->
      <view class="section">
        <text class="section-label">平均配速</text>
        <picker
          mode="multiSelector"
          :range="pacePicker.ranges"
          :value="pacePicker.selected"
          @columnchange="onColumnChange"
          @change="onPaceChange"
        >
          <view class="pace-display">
            <text>{{ pacePicker.ranges[0][pacePicker.selected[0]] }}分</text>
            <text>{{ pacePicker.ranges[1][pacePicker.selected[1]] }}秒</text>
            <text class="pace-unit">/ 公里</text>
          </view>
        </picker>
      </view>

      <button class="calculate-btn" @click="calculate">计算</button>

      <!-- 结果区（计算后显示） -->
      <view v-if="hasResult" class="result-section">
        <view class="total-time-card">
          <text class="total-time-label">预计完赛时间</text>
          <text class="total-time-value">{{ result.totalTimeDisplay }}</text>
          <text class="total-time-sub">平均配速 {{ result.avgPaceDisplay }}/公里</text>
        </view>

        <!-- 配速策略滑杆 -->
        <view class="section">
          <text class="section-label">配速策略</text>
          <view class="strategy-row">
            <text class="strategy-label">先慢后快</text>
            <slider
              :min="STRATEGY_CONFIG.MIN"
              :max="STRATEGY_CONFIG.MAX"
              :step="STRATEGY_CONFIG.STEP"
              :value="strategy"
              @changing="onStrategyChanging"
              @change="onStrategyChange"
              activeColor="#00BCD4"
            />
            <text class="strategy-label">先快后慢</text>
          </view>
          <text class="strategy-hint">{{ strategyHint }}</text>
        </view>

        <!-- 显示间隔 -->
        <view class="section">
          <text class="section-label">显示间隔</text>
          <view class="interval-options">
            <view
              v-for="opt in INTERVAL_OPTIONS"
              :key="opt.value"
              class="interval-radio"
              :class="{ active: interval === opt.value }"
              @click="selectInterval(opt.value)"
            >
              <text>{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- 分段表 -->
        <view class="pace-table-wrapper">
          <view class="table-header">
            <text class="col-km">公里</text>
            <text class="col-time">时间</text>
            <text class="col-pace">配速</text>
          </view>
          <view :class="['table-body', { 'table-body-expand': sharing }]">
            <view
              class="table-row"
              v-for="(row, idx) in result.rows"
              :key="idx"
              :class="{ 'total-row': isLastRow(idx) }"
            >
              <text class="col-km">{{ formatKm(row.km) }}</text>
              <text class="col-time">{{ formatTime(row.cumulativeSeconds) }}</text>
              <text class="col-pace">{{ formatPace(row.paceSeconds) }}</text>
            </view>
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

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
// #ifdef H5
import html2canvas from 'html2canvas'
// #endif
import {
  DISTANCE_CONFIGS, INTERVAL_OPTIONS, STRATEGY_CONFIG,
} from '@/logic/pace-calculator/constants'
import { PACE_MIN_RANGE, PACE_SEC_RANGE } from '@/logic/finish-time/constants'
import { calculateFinishTimeTable } from '@/logic/finish-time/calculator'
import { formatPace, formatTime } from '@/logic/pace-calculator/calculator'

// ==================== 配速选择器状态 ====================

const pacePicker = reactive({
  ranges: [PACE_MIN_RANGE, PACE_SEC_RANGE],
  selected: [5, 0],  // 默认 5分0秒/公里
})

// ==================== 其他状态 ====================

const distanceKey = ref(null)
const customKm = ref(null)
const customKmInput = ref('')
const showCustomModal = ref(false)
const strategy = ref(0)
const interval = ref(1)
const result = ref(null)
const sharing = ref(false)

const distanceOptions = computed(() => [
  ...DISTANCE_CONFIGS,
  { key: 'custom', label: customKm.value ? `自定义(${customKm.value.toFixed(1)}km)` : '自定义' },
])

const hasResult = computed(() => result.value !== null && result.value.rows?.length > 0)

const strategyHint = computed(() => {
  const S = strategy.value
  if (S === 0) return '匀速 — 全程配速一致'
  const pct = Math.abs(S)
  if (S < 0) return `前慢后快 — 后段快 ${pct}%，逐段加速`
  return `前快后慢 — 后段慢 ${pct}%，逐段降速`
})

// ==================== 方法 ====================

function selectDistance(key) {
  if (key === 'custom') {
    if (customKm.value) {
      distanceKey.value = 'custom'
    } else {
      customKmInput.value = ''
    }
    showCustomModal.value = true
    result.value = null
    return
  }
  distanceKey.value = key
  result.value = null
}

function confirmCustom() {
  const val = parseFloat(customKmInput.value)
  if (isNaN(val) || val < 3 || val > 300) {
    uni.showToast({ title: '请输入 3.00~300.00 之间的距离', icon: 'none' })
    return
  }
  customKm.value = val
  distanceKey.value = 'custom'
  showCustomModal.value = false
}

function cancelCustom() {
  showCustomModal.value = false
  if (distanceKey.value === 'custom' && !customKm.value) {
    distanceKey.value = null
  }
}

function onColumnChange(e) {
  const { column, value } = e.detail
  pacePicker.selected[column] = value
}

function onPaceChange(e) {
  pacePicker.selected = e.detail.value
  result.value = null
}

function calculate() {
  if (!distanceKey.value) {
    uni.showToast({ title: '请选择跑步距离', icon: 'none' })
    return
  }
  const [m, s] = pacePicker.selected
  if (m === 0 && s === 0) {
    uni.showToast({ title: '请设置有效配速', icon: 'none' })
    return
  }

  const table = calculateFinishTimeTable({
    distanceKey: distanceKey.value,
    paceMin: Number(pacePicker.ranges[0][m]),
    paceSec: Number(pacePicker.ranges[1][s]),
    strategy: strategy.value,
    interval: interval.value,
    customKm: customKm.value,
  })
  if (!table) {
    uni.showToast({ title: '计算失败，请检查输入', icon: 'none' })
    return
  }
  result.value = table
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

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '完赛时间计算 — 跑研社',
  path: '/pages/finish-time/index',
}))
// #endif

// 分享（H5 截图）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const canvas = await html2canvas(el, {
      useCORS: true,
      scale: 2,
      height: el.scrollHeight,
      windowHeight: el.scrollHeight,
    })
    const link = document.createElement('a')
    link.download = '完赛计划.png'
    link.href = canvas.toDataURL()
    link.click()
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  }
  sharing.value = false
  // #endif
}
</script>

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
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.section-label {
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

/* 距离选择 */
.distance-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.distance-chip {
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx;
  color: #7F8C8D;
}
.distance-chip.active {
  background: #00BCD4;
  border-color: #00BCD4;
  color: #FFF;
}

/* 配速选择器 */
.pace-display {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 16rpx;
  padding: 28rpx 50rpx;
  background: #F0F8FF;
  border-radius: 16rpx;
  border: 2rpx solid #E0E0E0;
}
.pace-display text {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
}
.pace-display .pace-unit {
  font-size: 28rpx;
  color: #7F8C8D;
  font-weight: normal;
}

/* 计算按钮 */
.calculate-btn {
  width: 100%;
  height: 88rpx;
  background: #00BCD4;
  color: #FFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,188,212,0.4);
}

/* 完赛时间卡片 */
.total-time-card {
  background: #E0F7FA;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 24rpx;
}
.total-time-label {
  font-size: 26rpx;
  color: #555;
  display: block;
}
.total-time-value {
  font-size: 52rpx;
  font-weight: bold;
  color: #00BCD4;
  display: block;
  margin-top: 10rpx;
}
.total-time-sub {
  font-size: 24rpx;
  color: #7F8C8D;
  display: block;
  margin-top: 8rpx;
}

/* 策略滑杆 */
.strategy-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.strategy-label {
  font-size: 22rpx;
  color: #7F8C8D;
  white-space: nowrap;
}
slider {
  flex: 1;
}
.strategy-hint {
  font-size: 24rpx;
  color: #00BCD4;
  text-align: center;
  display: block;
  margin-top: 10rpx;
}

/* 间隔单选 */
.interval-options {
  display: flex;
  gap: 30rpx;
}
.interval-radio {
  padding: 12rpx 36rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx;
  color: #7F8C8D;
}
.interval-radio.active {
  background: #00BCD4;
  border-color: #00BCD4;
  color: #FFF;
}

/* 分段表 */
.pace-table-wrapper {
  background: #FFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.table-header {
  display: flex;
  padding: 20rpx 30rpx;
  background: #00BCD4;
  color: #FFF;
  font-size: 28rpx;
  font-weight: bold;
}
.table-body {
  max-height: 700rpx;
  overflow-y: auto;
}
.table-body-expand {
  max-height: none;
  overflow-y: visible;
}
.table-row {
  display: flex;
  padding: 20rpx 30rpx;
  border-bottom: 2rpx solid #F0F0F0;
  font-size: 28rpx;
  color: #2C3E50;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row.total-row {
  background: #E0F7FA;
  font-weight: bold;
}
.col-km {
  width: 30%;
}
.col-time {
  width: 35%;
  text-align: center;
}
.col-pace {
  width: 35%;
  text-align: right;
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
  background: #00BCD4;
  color: #FFF;
}
.btn-home {
  background: #2C3E50;
  color: #FFF;
}
.btn-re-eval {
  background: #ECF0F1;
  color: #2C3E50;
}

/* 自定义距离弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 600rpx;
  background: #FFF;
  border-radius: 24rpx;
  padding: 50rpx 40rpx 40rpx;
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2C3E50;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}
.modal-input-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}
.modal-input {
  width: 300rpx;
  height: 80rpx;
  border: 2rpx solid #00BCD4;
  border-radius: 12rpx;
  font-size: 40rpx;
  text-align: center;
  color: #2C3E50;
  padding: 0 20rpx;
}
.modal-unit {
  font-size: 32rpx;
  color: #2C3E50;
  margin-left: 16rpx;
  font-weight: bold;
}
.modal-hint {
  font-size: 24rpx;
  color: #95A5A6;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}
.modal-buttons {
  display: flex;
  gap: 24rpx;
}
.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-btn-cancel {
  background: #ECF0F1;
  color: #7F8C8D;
}
.modal-btn-confirm {
  background: #00BCD4;
  color: #FFF;
}
</style>
```

- [ ] **Step 2: 启动 H5 开发服务器验证**

```bash
npm run dev:h5
```
预期：页面正常启动，可在浏览器中访问。

- [ ] **Step 3: 提交**

```bash
git add src/pages/finish-time/index.vue
git commit -m "feat(finish-time): add finish time calculation page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---
### Task 5: 端到端验证

**Files:** 无修改，仅在开发环境验证

- [ ] **Step 1: 启动 H5 开发服务器**

```bash
npm run dev:h5
```

- [ ] **Step 2: 验证首页入口**

在浏览器中访问首页，确认"完赛时间计算"（🏁）按钮可点击并跳转到 `/pages/finish-time/index`。

- [ ] **Step 3: 验证输入交互**

1. 选择跑步距离（如半程马拉松）
2. 配速选择器显示默认 5分0秒/公里，可滚动更改分和秒列
3. 点击"计算"按钮

- [ ] **Step 4: 验证结果展示**

1. 确认显示"预计完赛时间"卡片
2. 确认策略滑杆可拖动并重新计算
3. 确认显示间隔可切换（1km / 5km）
4. 确认表格数据正确（公里数、累计时间、配速）
5. 确认尾行高亮显示

- [ ] **Step 5: 验证边界情况**

1. 不选距离直接点击计算 → 提示"请选择跑步距离"
2. 配速设为 0分0秒 点击计算 → 提示"请设置有效配速"
3. 自定义距离输入非法值 → 提示正确范围
4. 选择"自定义"后不输入直接确认 → 弹窗不关闭且有提示

- [ ] **Step 6: 验证配速计算器不受影响**

回到配速计算器页面，确认所有功能正常（计算、策略、间隔、分享）。
