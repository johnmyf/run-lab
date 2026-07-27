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
          <picker
            mode="selector"
            :range="ageRange"
            :value="pickerIndex"
            @change="onAgeChange"
          >
            <view class="picker-display" :class="{ 'picker-empty': !age }">
              <text v-if="age">{{ age }}岁</text>
              <text v-else>请选择年龄</text>
            </view>
          </picker>
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
      </view>

      <!-- 区域2：估算结果卡片（有数据时显示） -->
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

      <!-- 区域3：训练区间卡片（有数据时显示） -->
      <view class="card" v-if="calculated">
        <text class="card-title">心率训练区间</text>
        <view
          v-for="(zone, index) in zonesWithRanges"
          :key="index"
          class="zone-item"
        >
          <view class="zone-header">
            <view class="zone-header-left">
              <text class="zone-name">{{ zone.name }}</text>
              <text class="zone-percent">{{ Math.round(zone.range[0] * 100) }}-{{ Math.round(zone.range[1] * 100) }}%</text>
            </view>
            <view class="zone-range">
              <text class="zone-range-value">{{ zone.computedRange.from }} - {{ zone.computedRange.to }}</text>
              <text class="zone-range-unit">次/分钟</text>
            </view>
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

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="calculated && !sharing">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
// #ifdef H5
import html2canvas from 'html2canvas'
// #endif
import { TRAINING_ZONES, METHODS } from '@/logic/heart-rate/constants'
import { calcHeartRates, calcZoneRange } from '@/logic/heart-rate/calculator'

// ==================== 常量 ====================

const ageRange = Array.from({ length: 90 }, (_, i) => i + 10)

/** picker 选中索引：初始定位到 45 岁(index=35)，选择后跟随当前值 */
const pickerIndex = computed(() => age.value === null ? 35 : age.value - 10)

// ==================== 状态 ====================

const age = ref(null)
const gender = ref('男')
const calculated = ref(false)
const selectedIndex = ref(0)
const maxHRResults = ref([])
const sharing = ref(false)

// ==================== 派生 ====================

const zonesWithRanges = computed(() =>
  TRAINING_ZONES.map(zone => ({
    ...zone,
    computedRange: calcZoneRange(currentMaxHR.value, zone.range[0], zone.range[1])
  }))
)

const currentMaxHR = computed(() => {
  if (!calculated.value || !maxHRResults.value.length) return 0
  return maxHRResults.value[selectedIndex.value]?.value ?? 0
})

// ==================== 自动计算 ====================

/** 执行完整计算（年龄/性别变更时） */
function doCalculate() {
  if (age.value === null) {
    calculated.value = false
    return
  }
  maxHRResults.value = calcHeartRates(Number(age.value), gender.value)
  selectedIndex.value = 0
  calculated.value = true
}

// 年龄变更 → 全部重新计算
watch(age, () => {
  doCalculate()
})

// 性别变更 → 全部重新计算
watch(gender, () => {
  doCalculate()
})

// ==================== 事件处理 ====================

function onAgeChange(event) {
  age.value = ageRange[event.detail.value]
}

function onGenderChange(event) {
  gender.value = event.detail.value
}

function onMethodChange(event) {
  selectedIndex.value = Number(event.detail.value)
  // zonesWithRanges 是 computed，自动重算
}

// ==================== 分享与导航 ====================

function goBack() {
  uni.navigateBack()
}

async function shareResult() {
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中打开使用分享功能', icon: 'none' })
  return
  // #endif

  try {
    uni.showLoading({ title: '生成分享图片...' })

    sharing.value = true
    await new Promise(resolve => setTimeout(resolve, 100))

    const pageEl = document.querySelector('.page-container')
    if (!pageEl) {
      sharing.value = false
      uni.hideLoading()
      uni.showToast({ title: '页面元素未找到', icon: 'none' })
      return
    }

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f5f5'
    })

    sharing.value = false

    const imgData = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `心率计算.png`
    link.href = imgData
    link.click()

    uni.hideLoading()
    uni.showToast({ title: '图片已生成', icon: 'success' })
  } catch (e) {
    sharing.value = false
    console.error('截图生成失败:', e)
    uni.hideLoading()
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

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

.picker-display {
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

.picker-display.picker-empty {
  color: #bbb;
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

.zone-header-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
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
  align-self: flex-start;
}

.zone-range {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  flex-shrink: 0;
}

.zone-range-value {
  color: #2ECC71;
  font-size: 52rpx;
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

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  margin-top: 30rpx;
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
</style>
