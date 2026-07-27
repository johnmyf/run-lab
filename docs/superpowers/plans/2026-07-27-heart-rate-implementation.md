# 心率计算功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将心率计算页面从"开发中"占位改造为完整的最大心率估算 + 训练区间计算功能。

**Architecture:** 按项目既有模式，业务逻辑分离到 `src/logic/heart-rate/`，页面组件 `src/pages/heart-rate/index.vue` 只负责 UI 和状态管理。

**Tech Stack:** uni-app 3.0 (Vue 3, Composition API), rpx 单位, 无额外依赖。

## 全局约束

- 使用 uni-app 跨平台组件 `<view>` / `<text>` / `<input>` / `<radio>` / `<radio-group>` / `<label>`
- 使用 `rpx` 单位，不使用 `px`
- header 色值 `#2ECC71`（绿色，与九宫格一致）
- `navigationStyle: "custom"` 已在 pages.json 配置好
- 页面导航使用 `uni.navigateTo` 跳入、`uni.navigateBack()` 返回
- 所有计算使用 `Math.round()` 取整

---

### Task 1: 创建训练区间与方法说明常量

**Files:**
- Create: `src/logic/heart-rate/constants.js`

**Interfaces:**
- Produces: `TRAINING_ZONES` — 5 个心率区间的配置数组
- Produces: `METHOD_INFO` — 3 个计算方法的名称/说明/公式字符串

- [ ] **Step 1: 创建 constants.js 文件**

```js
/**
 * 心率计算模块 — 常量配置
 * @module logic/heart-rate/constants
 */

/** 训练心率区间配置 */
export const TRAINING_ZONES = [
  {
    name: '热身区',
    range: [0.5, 0.6],
    desc: '用于热身和恢复, 如快走。',
    training: '轻松跑(E跑)的下限、跑前热身、跑后放松。'
  },
  {
    name: '燃脂区',
    range: [0.6, 0.7],
    desc: '基础有氧训练, 高效燃烧脂肪 如慢跑。',
    training: '轻松跑(E跑)的主体区间。'
  },
  {
    name: '有氧耐力区',
    range: [0.7, 0.8],
    desc: '锻炼心肺功能, 提高肌肉使用氧气的能力。',
    training: '长距离慢跑(L跑/LSD)、马拉松配速跑(M跑)。'
  },
  {
    name: '乳酸阈区',
    range: [0.8, 0.9],
    desc: '提高乳酸阈值, 增大最大摄氧量, 增强速度。',
    training: '乳酸门槛跑(T跑)。'
  },
  {
    name: '无氧区',
    range: [0.9, 1.0],
    desc: '短时间高强度运动, 提高爆发力。',
    training: '间歇跑(I跑)、重复跑(R跑)。'
  }
]

/** 三种估算方法的名称、说明文案、公式模板 */
export const METHODS = [
  {
    name: '传统公式',
    formula: '220 - 年龄',
    desc: '最常用的简单公式, 适用于一般人群。'
  },
  {
    name: 'Tanaka公式',
    formula: '208 - 0.7×年龄',
    desc: '研究表明更适合成年人, 特别是老年人。'
  },
  {
    name: 'Gulati公式',
    formula: '208 - 0.7×年龄(男性) / 206 - 0.88×年龄(女性)',
    desc: '考虑性别差异, 尤其适合女性。'
  }
]

/** 年龄输入限制 */
export const AGE_MIN = 10
export const AGE_MAX = 99
```

- [ ] **Step 2: 验证文件创建成功**

查看文件是否存在且语法正确。

- [ ] **Step 3: 提交**

```bash
git add src/logic/heart-rate/constants.js
git commit -m "feat: 添加心率计算常量配置（训练区间、方法说明）"
```

---

### Task 2: 创建心率计算函数

**Files:**
- Create: `src/logic/heart-rate/calculator.js`

**Interfaces:**
- Consumes: `AGE_MIN`, `AGE_MAX` from `constants.js`
- Produces: `calcHeartRates(age, gender)` → `Array<{name, formula, value}>`

- [ ] **Step 1: 创建 calculator.js**

```js
/**
 * 心率计算模块 — 计算函数
 * @module logic/heart-rate/calculator
 */

import { AGE_MIN, AGE_MAX } from './constants'

/**
 * 验证年龄输入是否有效
 * @param {number|string} age
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAge(age) {
  const num = Number(age)
  if (!age && age !== 0) {
    return { valid: false, message: '请输入年龄' }
  }
  if (!Number.isInteger(num) || num < AGE_MIN || num > AGE_MAX) {
    return { valid: false, message: `年龄需在 ${AGE_MIN}-${AGE_MAX} 岁之间` }
  }
  return { valid: true }
}

/**
 * 计算三种最大心率估算值
 * @param {number} age - 年龄 (10-99)
 * @param {'男'|'女'} gender - 性别
 * @returns {Array<{name: string, formula: string, value: number}>}
 */
export function calcHeartRates(age, gender) {
  return [
    {
      name: '传统公式',
      formula: '220 - 年龄',
      value: 220 - age
    },
    {
      name: 'Tanaka公式',
      formula: '208 - 0.7×年龄',
      value: Math.round(208 - 0.7 * age)
    },
    {
      name: 'Gulati公式',
      formula: gender === '男' ? '208 - 0.7×年龄' : '206 - 0.88×年龄',
      value: Math.round(gender === '男' ? 208 - 0.7 * age : 206 - 0.88 * age)
    }
  ]
}

/**
 * 根据最大心率计算指定区间的范围
 * @param {number} maxHR - 最大心率
 * @param {number} lower - 下限百分比 (如 0.5)
 * @param {number} upper - 上限百分比 (如 0.6)
 * @returns {{ from: number, to: number }}
 */
export function calcZoneRange(maxHR, lower, upper) {
  return {
    from: Math.round(maxHR * lower),
    to: Math.round(maxHR * upper)
  }
}
```

- [ ] **Step 2: 验证文件创建成功**

查看文件是否存在且语法正确。

- [ ] **Step 3: 提交**

```bash
git add src/logic/heart-rate/calculator.js
git commit -m "feat: 添加心率计算公式函数"
```

---

### Task 3: 实现心率计算页面组件

**Files:**
- Modify: `src/pages/heart-rate/index.vue`（完全替换，从占位页改为完整功能页）

**Interfaces:**
- Consumes: `TRAINING_ZONES`, `METHODS` from `logic/heart-rate/constants`
- Consumes: `validateAge`, `calcHeartRates`, `calcZoneRange` from `logic/heart-rate/calculator`
- Navigation: `uni.navigateBack()` for back button

- [ ] **Step 1: 实现页面 template 模板**

用以下结构替换原有 template：

```html
<template>
  <view class="page-container">
    <!-- 顶部 Header -->
    <view class="header" style="background: #2ECC71;">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">心率计算</text>
    </view>

    <view class="content-wrapper">
      <!-- 区域1：输入卡片 -->
      <view class="card">
        <view class="input-row">
          <text class="input-label">年龄</text>
          <input
            class="age-input"
            type="number"
            :maxlength="2"
            placeholder="输入年龄 (10-99)"
            v-model="age"
          />
        </view>

        <view class="input-row">
          <text class="input-label">性别</text>
          <radio-group class="gender-group" @change="onGenderChange">
            <label class="gender-option">
              <radio value="男" :checked="gender === '男'" color="#2ECC71" />
              <text class="gender-text">男</text>
            </label>
            <label class="gender-option">
              <radio value="女" :checked="gender === '女'" color="#2ECC71" />
              <text class="gender-text">女</text>
            </label>
          </radio-group>
        </view>

        <button class="btn btn-calculate" @click="onCalculate">计算</button>
      </view>

      <!-- 区域2：估算结果卡片（计算后显示） -->
      <view class="card" v-if="calculated">
        <text class="card-title">最大心率估算结果</text>
        <radio-group @change="onMethodChange">
          <label
            v-for="(hr, index) in maxHRResults"
            :key="index"
            class="method-option"
          >
            <radio
              :value="String(index)"
              :checked="selectedIndex === index"
              color="#2ECC71"
            />
            <view class="method-content">
              <text class="method-name">{{ hr.name }}</text>
              <text class="method-formula">{{ hr.formula }}</text>
              <text class="method-value">最大心率: {{ hr.value }} 次/分钟</text>
            </view>
          </label>
        </radio-group>
      </view>

      <!-- 区域3：训练区间卡片（计算后显示） -->
      <view class="card" v-if="calculated">
        <text class="card-title">心率训练区间</text>
        <view
          v-for="(zone, index) in TRAINING_ZONES"
          :key="index"
          class="zone-item"
        >
          <view class="zone-header">
            <text class="zone-name">{{ zone.name }}</text>
            <text class="zone-percent">{{ Math.round(zone.range[0] * 100) }}-{{ Math.round(zone.range[1] * 100) }}%</text>
          </view>
          <view class="zone-range">
            <text class="zone-range-value">
              {{ calcZoneRange(currentMaxHR, zone.range[0], zone.range[1]).from }} - {{ calcZoneRange(currentMaxHR, zone.range[0], zone.range[1]).to }}
            </text>
            <text class="zone-range-unit">次/分钟</text>
          </view>
          <text class="zone-desc">{{ zone.desc }}</text>
          <text class="zone-training">对应训练：{{ zone.training }}</text>
        </view>
      </view>

      <!-- 区域4：计算方法说明（始终显示） -->
      <view class="card">
        <text class="card-title">计算方法说明</text>
        <view class="method-info" v-for="(method, index) in METHODS" :key="index">
          <view class="separator" v-if="index > 0">---</view>
          <text class="method-info-name">{{ method.name }}</text>
          <text class="method-info-formula">{{ method.formula }}</text>
          <text class="method-info-desc">{{ method.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
```

- [ ] **Step 2: 实现页面 script 逻辑**

```js
<script setup>
import { ref, computed } from 'vue'
import { TRAINING_ZONES, METHODS } from '@/logic/heart-rate/constants'
import { validateAge, calcHeartRates, calcZoneRange } from '@/logic/heart-rate/calculator'

// ==================== 状态 ====================

const age = ref('')
const gender = ref('男')
const calculated = ref(false)
const selectedIndex = ref(0)
const maxHRResults = ref([])

// ==================== 派生 ====================

const currentMaxHR = computed(() => {
  if (!calculated.value || !maxHRResults.value.length) return 0
  return maxHRResults.value[selectedIndex.value]?.value ?? 0
})

// ==================== 事件处理 ====================

function onGenderChange(event) {
  gender.value = event.detail.value
}

function onMethodChange(event) {
  selectedIndex.value = Number(event.detail.value)
}

function onCalculate() {
  const validation = validateAge(age.value)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  maxHRResults.value = calcHeartRates(Number(age.value), gender.value)
  selectedIndex.value = 0
  calculated.value = true
}

function goBack() {
  uni.navigateBack()
}
</script>
```

- [ ] **Step 3: 实现页面样式**

```css
<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  overflow-x: hidden;
}

.header {
  height: 160rpx;
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  position: relative;
}

.back-button {
  font-size: 56rpx;
  color: #FFFFFF;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.back-arrow {
  color: #FFFFFF;
  font-size: 56rpx;
}

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #FFFFFF;
  font-size: 40rpx;
  font-weight: bold;
  white-space: nowrap;
}

.content-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 160rpx);
  padding-bottom: 40rpx;
}

/* 卡片通用 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 30rpx 30rpx 0 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  color: #2C3E50;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  display: block;
}

/* 区域1：输入 */
.input-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.input-row:last-of-type {
  border-bottom: none;
}

.input-label {
  color: #2C3E50;
  font-size: 30rpx;
  font-weight: 500;
  width: 140rpx;
  flex-shrink: 0;
}

.age-input {
  flex: 1;
  height: 72rpx;
  background: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #2C3E50;
}

.gender-group {
  display: flex;
  gap: 40rpx;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.gender-text {
  font-size: 28rpx;
  color: #2C3E50;
}

.btn-calculate {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #2ECC71;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 16rpx;
  margin-top: 30rpx;
  border: none;
  text-align: center;
}

/* 区域2：估算结果 */
.method-option {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.method-option:last-child {
  border-bottom: none;
}

.method-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-left: 16rpx;
}

.method-name {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: bold;
}

.method-formula {
  color: #95A5A6;
  font-size: 24rpx;
}

.method-value {
  color: #2ECC71;
  font-size: 32rpx;
  font-weight: bold;
}

/* 区域3：训练区间 */
.zone-item {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.zone-item:last-child {
  margin-bottom: 0;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.zone-name {
  color: #2C3E50;
  font-size: 30rpx;
  font-weight: bold;
}

.zone-percent {
  color: #2ECC71;
  font-size: 26rpx;
  background: rgba(46, 204, 113, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.zone-range {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.zone-range-value {
  color: #2ECC71;
  font-size: 48rpx;
  font-weight: bold;
}

.zone-range-unit {
  color: #666;
  font-size: 26rpx;
}

.zone-desc {
  color: #555;
  font-size: 26rpx;
  line-height: 1.6;
  display: block;
}

.zone-training {
  color: #888;
  font-size: 24rpx;
  line-height: 1.6;
  display: block;
  margin-top: 6rpx;
}

/* 区域4：方法说明 */
.method-info {
  margin-bottom: 20rpx;
}

.method-info:last-child {
  margin-bottom: 0;
}

.separator {
  color: #ddd;
  font-size: 24rpx;
  text-align: center;
  margin: 16rpx 0;
  display: block;
}

.method-info-name {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.method-info-formula {
  color: #2ECC71;
  font-size: 26rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.method-info-desc {
  color: #666;
  font-size: 26rpx;
  line-height: 1.6;
  display: block;
}
</style>
```

- [ ] **Step 4: 组合完整页面文件**

将 template、script、style 三个部分组合成完整的 `src/pages/heart-rate/index.vue`。

注意事项：
- `v-model="age"` 在 uni-app 的 `<input>` 上使用字符串绑定
- 确保 `calcZoneRange` 在 template 中使用时是纯函数调用（每次渲染计算）
- `radio` 的 `value` 使用字符串索引以兼容 uni-app

- [ ] **Step 5: 构建验证**

运行 H5 构建检查是否有语法/模块解析错误：

```bash
npm run build:h5 2>&1 | tail -20
```

预期输出为构建成功（无报错）。

- [ ] **Step 6: 提交**

```bash
git add src/pages/heart-rate/index.vue
git commit -m "feat: 实现心率计算页面完整功能"
```
