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
              placeholder="请输入距离（公里）"
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

      <!-- 期望完成时间 -->
      <view class="section">
        <text class="section-label">期望完成时间</text>
        <picker
          mode="multiSelector"
          :range="timePicker.ranges"
          :value="timePicker.selected"
          @columnchange="onColumnChange"
          @change="onTimeChange"
        >
          <view class="time-display">
            <text>{{ timePicker.ranges[0][timePicker.selected[0]] }}时</text>
            <text>{{ timePicker.ranges[1][timePicker.selected[1]] }}分</text>
            <text>{{ timePicker.ranges[2][timePicker.selected[2]] }}秒</text>
          </view>
        </picker>
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
import { ref, reactive, computed } from 'vue'
// #ifdef H5
import html2canvas from 'html2canvas'
// #endif
import {
  DISTANCE_CONFIGS, INTERVAL_OPTIONS, STRATEGY_CONFIG,
  HOUR_RANGE, MIN_SEC_RANGE,
} from '@/logic/pace-calculator/constants'
import { calculatePaceTable, formatPace, formatTime } from '@/logic/pace-calculator/calculator'

// ==================== 时间选择器状态（reactive，参照跑力值页模式） ====================

const timePicker = reactive({
  ranges: [HOUR_RANGE, MIN_SEC_RANGE, MIN_SEC_RANGE],
  selected: [0, 30, 0],  // 默认 0时30分0秒
})

// ==================== 其他状态 ====================

const distanceKey = ref(null)
const customKm = ref(null)        // 自定义距离（公里）
const customKmInput = ref('')     // 输入框绑定值
const showCustomModal = ref(false)
const strategy = ref(0)
const interval = ref(1)
const result = ref(null)
const sharing = ref(false)

// 距离选项：预设 + 自定义
const distanceOptions = computed(() => [
  ...DISTANCE_CONFIGS,
  { key: 'custom', label: customKm.value ? `自定义(${customKm.value.toFixed(1)}km)` : '自定义' },
])

const hasResult = computed(() => result.value !== null && result.value.rows?.length > 0)

// 策略提示：显示首末段实际配速差比例
const strategyHint = computed(() => {
  const S = strategy.value
  if (S === 0) return '匀速 — 全程配速一致'
  const r = S / 500  // 段间变化率 = S%/5段
  // 第1段到第5段累计变化：(1+r)^4 - 1
  const totalDiff = Math.round(Math.abs((Math.pow(1 + r, 4) - 1) * 100))
  if (S < 0) return `前慢后快 — 后段快 ${totalDiff}%，逐段加速`
  return `前快后慢 — 后段慢 ${totalDiff}%，逐段降速`
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
  timePicker.selected[column] = value
}

function onTimeChange(e) {
  timePicker.selected = e.detail.value
  result.value = null
}

function calculate() {
  if (!distanceKey.value) {
    uni.showToast({ title: '请选择跑步距离', icon: 'none' })
    return
  }
  const [h, m, s] = timePicker.selected
  const totalSecs = h * 3600 + m * 60 + s
  if (totalSecs <= 0) {
    uni.showToast({ title: '请设置有效时间', icon: 'none' })
    return
  }

  const table = calculatePaceTable({
    distanceKey: distanceKey.value,
    hours: h,
    minutes: m,
    seconds: s,
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
  title: '配速计算器 — 跑研社',
  path: '/pages/pace-calculator/index',
}))
// #endif

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
}
.distance-chip.active {
  background: #00BCD4;
  border-color: #00BCD4;
  color: #FFF;
}

/* 时间选择器 */
.time-display {
  display: flex;
  justify-content: center;
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
