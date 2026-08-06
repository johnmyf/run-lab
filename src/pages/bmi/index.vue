<template>
  <view class="page-container">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- 顶部 Header（teal） -->
    <view class="header">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">体重建议</text>
    </view>

    <view class="content-wrapper">
      <!-- 输入卡片 -->
      <view class="card">
        <view class="input-row">
          <text class="input-label">体重</text>
          <input
            class="input-field"
            type="digit"
            :value="weight"
            placeholder="请输入体重"
            @input="onWeightInput"
          />
          <text class="input-unit">kg</text>
        </view>
        <view class="input-row">
          <text class="input-label">身高</text>
          <input
            class="input-field"
            type="digit"
            :value="height"
            placeholder="请输入身高"
            @input="onHeightInput"
          />
          <text class="input-unit">cm</text>
        </view>
        <view class="input-row">
          <text class="input-label">性别</text>
          <radio-group class="gender-group" @change="onGenderChange">
            <label class="gender-option" v-for="g in GENDERS" :key="g">
              <radio :value="g" :checked="gender === g" color="#1ABC9C" />
              <text class="gender-text">{{ g }}</text>
            </label>
          </radio-group>
        </view>
        <button class="calc-btn" @click="calculate">计算</button>
      </view>

      <!-- 结果卡（计算后显示） -->
      <view class="card" v-if="calculated && adultStatus && runnerLevel">
        <view class="result-row">
          <text class="result-bmi">{{ bmi.toFixed(1) }}</text>
          <text class="result-bmi-unit">BMI</text>
        </view>
        <view class="result-table">
          <view class="result-line">
            <text class="result-label">体重状态:</text>
            <text class="result-value">{{ weightStatusText }}</text>
          </view>
          <view class="result-line">
            <text class="result-label">跑者层级:</text>
            <text class="result-value">{{ runnerLevel.name }}</text>
          </view>
        </view>
      </view>

      <!-- 横轴图形区（计算后显示） -->
      <view class="card" v-if="calculated && adultStatus && runnerLevel">
        <text class="card-title">体重状态</text>
        <HeatmapBar
          :categories="adult"
          :axis="ADULT_AXIS"
          :current-bmi="bmi"
          :height-cm="heightNum"
        />
        <text class="card-title chart-title">跑者层级</text>
        <HeatmapBar
          :categories="runnerLevels[gender]"
          :axis="RUNNER_AXIS"
          :current-bmi="bmi"
          :height-cm="heightNum"
          table-legend
        />
      </view>

      <!-- 说明区（始终显示） -->
      <view class="card">
        <view class="bmi-intro">
          <text class="intro-prefix">说明：</text>
          <view class="intro-content">
            <text
              v-for="(seg, i) in introSegs"
              :key="i"
              :class="{ bold: seg.bold }"
              user-select
            >{{ seg.text }}</text>
          </view>
        </view>
        <text class="understanding-link" @click="goUnderstanding">跑者如何理解 BMI（身体质量指数）</text>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-if="calculated && !sharing">
        <button class="btn btn-share" open-type="share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
        <button class="btn btn-recalc" @click="resetResult">重新计算</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { statusBarHeight } from '@/utils/status-bar'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
import { onShareAppMessage } from '@dcloudio/uni-app'
import bmiData from '@/data/bmi.json'
import { calcBMI, findAdultStatus, findRunnerLevel } from '@/logic/bmi/calculator'
import { parseBold } from '@/logic/bmi/understanding'
import {
  GENDERS, DEFAULT_WEIGHT, DEFAULT_HEIGHT, DEFAULT_GENDER,
  ADULT_AXIS, RUNNER_AXIS, BMI_INTRO, SHARE_PREFIX,
} from '@/logic/bmi/constants'
import HeatmapBar from './components/heatmap-bar.vue'

// ==================== 状态 ====================
const weight = ref(String(DEFAULT_WEIGHT))
const height = ref(String(DEFAULT_HEIGHT))
const gender = ref(DEFAULT_GENDER)
const calculated = ref(false)
const sharing = ref(false)

const bmi = ref(0)
const adultStatus = ref(null)
const runnerLevel = ref(null)
const weightNum = ref(DEFAULT_WEIGHT) // 需减重推算用（体重数值）
const heightNum = ref(DEFAULT_HEIGHT) // 横轴体重推算用（身高数值）

// ==================== 数据引用 ====================
const adult = bmiData.adult
const runnerLevels = bmiData.runnerLevels

/** BMI 说明文案加粗分段 */
const introSegs = computed(() => parseBold(BMI_INTRO))

/** 正常档上临界 BMI（来自数据，即 24.0），用于推算正常临界体重 */
const NORMAL_MAX_BMI = adult.find(c => c.name === '正常')?.max ?? 24

/** 体重状态超出正常范围需减掉的公斤数（向上取整） */
const needLoseKg = computed(() => {
  const name = adultStatus.value?.name
  if (!name || (name !== '偏胖' && name !== '肥胖')) return 0
  const target = NORMAL_MAX_BMI * (heightNum.value / 100) ** 2
  return Math.max(0, Math.ceil(weightNum.value - target))
})

/** 体重状态显示文本（偏胖/肥胖时附加需减重提示） */
const weightStatusText = computed(() => {
  const name = adultStatus.value?.name ?? ''
  return needLoseKg.value > 0 ? `${name}(需减掉${needLoseKg.value}公斤)` : name
})

// ==================== 事件 ====================
function onWeightInput(e) { weight.value = e.detail.value }
function onHeightInput(e) { height.value = e.detail.value }

function onGenderChange(e) {
  gender.value = e.detail.value
  if (calculated.value) doCalculate()
}

function calculate() {
  const w = parseFloat(weight.value)
  const h = parseFloat(height.value)
  if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0) {
    uni.showToast({ title: '请输入有效的体重和身高', icon: 'none' })
    return
  }
  doCalculate(w, h)
}

function doCalculate(w = parseFloat(weight.value), h = parseFloat(height.value)) {
  // 双保险守卫：输入非法（含被清空后的 NaN）时直接返回，不更新任何结果状态
  if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0) return
  bmi.value = calcBMI(w, h)
  adultStatus.value = findAdultStatus(bmi.value, adult)
  runnerLevel.value = findRunnerLevel(bmi.value, gender.value, runnerLevels)
  weightNum.value = w
  heightNum.value = h
  calculated.value = true
}

/** 重新计算：保留输入，仅清除结果 */
function resetResult() {
  calculated.value = false
}

// ==================== 导航与分享 ====================
function goBack() {
  uni.navigateBack()
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goUnderstanding() {
  uni.navigateTo({ url: '/pages/bmi/understanding/index' })
}

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '体重建议 — 跑研匠',
  path: '/pages/bmi/index',
}))
// #endif

async function shareResult() {
  // #ifdef H5
  try {
    uni.showLoading({ title: '生成分享图片...' })
    sharing.value = true
    await new Promise(r => setTimeout(r, 100))
    const pageEl = document.querySelector('.page-container')
    if (!pageEl) {
      uni.hideLoading()
      uni.showToast({ title: '页面元素未找到', icon: 'none' })
      return
    }
    const ok = await captureAndShare(pageEl, { prefix: SHARE_PREFIX })
    if (ok) {
      uni.showToast({ title: '图片已生成', icon: 'success' })
    } else {
      throw new Error('captureAndShare returned false')
    }
  } catch (e) {
    console.error('分享失败:', e)
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  } finally {
    sharing.value = false
    uni.hideLoading()
  }
  // #endif
}
</script>

<style scoped>
.status-bar {
  background: #1ABC9C;
}
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部 Header */
.header {
  background: #1ABC9C;
  height: 160rpx;
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  position: relative;
}
.back-button {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 30rpx;
}

/* 卡片 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.card-title {
  color: #2C3E50;
  font-size: 30rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}
.chart-title {
  margin-top: 40rpx;
}

/* 输入区 */
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
.input-field {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #2C3E50;
}
.input-unit {
  color: #95A5A6;
  font-size: 26rpx;
  margin-left: 16rpx;
  width: 60rpx;
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

/* 计算按钮 */
.calc-btn {
  width: 100%;
  height: 88rpx;
  background: #1ABC9C;
  color: #FFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 44rpx 0 0;
  box-shadow: 0 4rpx 12rpx rgba(26, 188, 156, 0.4);
}

/* 结果卡 */
.result-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.result-bmi {
  color: #1ABC9C;
  font-size: 100rpx;
  font-weight: bold;
}
.result-bmi-unit {
  color: #1ABC9C;
  font-size: 32rpx;
  font-weight: bold;
}
.result-table {
  margin-top: 8rpx;
}
.result-line {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 0;
}
.result-label {
  color: #555;
  font-size: 28rpx;
  width: 170rpx;
  text-align: right;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.result-value {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: bold;
  text-align: left;
  min-width: 200rpx;
}

/* 说明区 */
.bmi-intro {
  color: #555;
  font-size: 26rpx;
  line-height: 1.7;
}
.intro-prefix {
  display: block;
  font-weight: bold;
  color: #2C3E50;
}
.intro-content {
  padding-left: 56rpx;
  margin-top: 8rpx;
}
.bold {
  font-weight: bold;
}
.understanding-link {
  display: inline-block;
  margin-top: 16rpx;
  color: #1ABC9C;
  font-size: 26rpx;
  text-decoration: underline;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}
.btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  text-align: center;
  border: none;
  color: #FFFFFF;
}
.btn-share {
  background: #2C3E50;
}
.btn-home {
  background: #3498DB;
}
.btn-recalc {
  background: #1ABC9C;
}
</style>
