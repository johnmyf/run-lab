<template>
  <view class="page-container">
    <!-- 顶栏 #00BCD4 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack">
        <text>←</text>
      </view>
      <text class="header-title">配速计算器</text>
    </view>

    <view class="content-wrapper">
      <!-- 输入区 -->
      <view class="section distance-section">
        <text class="section-label">选择跑步距离</text>
        <view class="distance-options">
          <view
            v-for="d in DISTANCE_CONFIGS"
            :key="d.key"
            class="distance-chip"
            :class="{ active: distanceKey === d.key }"
            @click="selectDistance(d.key)"
          >
            <text>{{ d.label }}</text>
          </view>
        </view>
      </view>

      <view class="section time-section">
        <text class="section-label">期望完成时间</text>
        <view class="time-picker-row">
          <!-- 三列 picker: 时/分/秒 -->
          <picker
            mode="multiSelector"
            :range="[HOUR_RANGE, MIN_SEC_RANGE, MIN_SEC_RANGE]"
            :value="[hoursIdx, minutesIdx, secondsIdx]"
            @change="onTimeChange"
          >
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

        <!-- 配速表格 -->
        <view class="pace-table-wrapper">
          <view class="pace-table">
            <view class="table-header">
              <text class="col-km">公里</text>
              <text class="col-time">时间</text>
              <text class="col-pace">配速</text>
            </view>
            <scroll-view scroll-y class="table-body">
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
const minutesIdx = ref(30)  // 默认30分
const secondsIdx = ref(0)
const strategy = ref(0)
const interval = ref(1)
const result = ref(null)
const sharing = ref(false)

const hasResult = computed(() => result.value !== null && result.value.rows?.length > 0)

// 策略提示
const strategyHint = computed(() => {
  const perSegment = Math.abs(strategy.value / 5)
  if (strategy.value === 0) return '匀速 — 全程配速一致'
  if (strategy.value < 0) return `前慢后快 — 段间变化 ${perSegment}%/段，逐步加速`
  return `前快后慢 — 段间变化 ${perSegment}%/段，逐步减速`
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
  const totalSecs = hoursIdx.value * 3600 + minutesIdx.value * 60 + secondsIdx.value
  if (totalSecs <= 0) {
    uni.showToast({ title: '请设置有效时间', icon: 'none' })
    return
  }

  const table = calculatePaceTable({
    distanceKey: distanceKey.value,
    hours: HOUR_RANGE[hoursIdx.value],
    minutes: MIN_SEC_RANGE[minutesIdx.value],
    seconds: MIN_SEC_RANGE[secondsIdx.value],
    strategy: strategy.value,
    interval: interval.value,
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

// 小程序分享
onShareAppMessage(() => {
  return {
    title: '配速计算器 — 跑研社',
    path: '/pages/pace-calculator/index',
  }
})

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

/* 距离选择 - 胶囊按钮 */
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
  transition: all 0.2s;
}
.distance-chip.active {
  background: #00BCD4;
  border-color: #00BCD4;
  color: #FFF;
}

/* 时间选择器 */
.time-picker-row {
  display: flex;
  justify-content: center;
}
.time-display {
  display: flex;
  gap: 30rpx;
  padding: 28rpx 50rpx;
  background: #F0F8FF;
  border-radius: 16rpx;
  border: 2rpx solid #E0E0E0;
}
.time-display text {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
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

/* 平均配速 */
.avg-pace-card {
  background: #E0F7FA;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 24rpx;
}
.avg-pace-label {
  font-size: 26rpx;
  color: #555;
  display: block;
}
.avg-pace-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #00BCD4;
  display: block;
  margin-top: 10rpx;
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

/* 配速表格 */
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
</style>
