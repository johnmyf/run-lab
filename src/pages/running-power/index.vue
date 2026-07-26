<template>
  <view class="page-container">
    <!-- 顶部 Header -->
    <view class="header" style="background: #3498DB;">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">跑力值计算</text>
    </view>

    <view class="content-wrapper">
      <!-- 描述文字 -->
      <view class="desc-section">
        <text class="desc-text">输入近期(最好是3个月内) 5公里、10公里、15公里、半程马拉松、马拉松 各项的最快跑步成绩(输入越多越准)，从而推算出你的跑力值(VDOT)，我们再据此推算出你近期可达到的理论成绩，以及训练要求。</text>
      </view>

      <!-- 输入区域 -->
      <view class="input-section">
        <view class="input-row" v-for="dist in distances" :key="dist.key">
          <text class="input-label">{{ dist.label }}</text>
          <picker
            mode="multiSelector"
            :range="dist.ranges"
            :value="dist.selected"
            @change="onPickerChange(dist, $event)"
            @columnchange="onColumnChange(dist, $event)"
          >
            <view class="picker-display" :class="{ 'picker-empty': !dist.hasValue }">
              <text v-if="dist.hasValue">{{ getDisplayTime(dist) }}</text>
              <text v-else>请选择</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 按钮区域 -->
      <view class="button-row">
        <button class="btn btn-reset" @click="resetAll">重置</button>
        <button class="btn btn-confirm" @click="confirm">确定</button>
      </view>

      <!-- 自定义弹窗 -->
      <view class="modal-overlay" v-if="modalState !== 'hidden'" @touchmove.prevent>
        <view class="modal-content">
          <!-- 未输入提示 -->
          <template v-if="modalState === 'no-input'">
            <view class="modal-icon">⚠️</view>
            <text class="modal-title">提示</text>
            <text class="modal-body">请输入最少一项的有效成绩</text>
            <view class="modal-buttons">
              <button class="modal-btn modal-btn-secondary" @click="modalState = 'hidden'">好的</button>
              <button class="modal-btn modal-btn-primary" @click="fillMarathon303">填入全马破三</button>
            </view>
          </template>

          <!-- 计算结果 -->
          <template v-if="modalState === 'result'">
            <view class="modal-icon">🎯</view>
            <text class="modal-title">计算出你的跑力值(VDOT)</text>
            <text class="modal-result">{{ finalVdot }}</text>
            <view class="modal-buttons">
              <button class="modal-btn modal-btn-primary" @click="modalState = 'hidden'">关闭</button>
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import vdotMap from '@/data/sheet5-1.json'

// 生成数字范围数组
const range60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const rangeH2 = ['0', '1']
const rangeH3 = ['0', '1', '2']
const rangeH4 = ['0', '1', '2', '3']
const rangeH7 = ['0', '1', '2', '3', '4', '5', '6']

const distances = reactive([
  {
    key: '5公里',
    label: '5公里最佳成绩:',
    ranges: [[...range60], [...range60]],
    selected: [0, 0],
    hasValue: false,
    formatFn: (indices) => `${range60[indices[0]]}:${range60[indices[1]]}`
  },
  {
    key: '10公里',
    label: '10公里最佳成绩:',
    ranges: [[...rangeH2], [...range60], [...range60]],
    selected: [0, 0, 0],
    hasValue: false,
    formatFn: (indices) => `${rangeH2[indices[0]]}:${range60[indices[1]]}:${range60[indices[2]]}`
  },
  {
    key: '15公里',
    label: '15公里最佳成绩:',
    ranges: [[...rangeH3], [...range60], [...range60]],
    selected: [0, 0, 0],
    hasValue: false,
    formatFn: (indices) => `${rangeH3[indices[0]]}:${range60[indices[1]]}:${range60[indices[2]]}`
  },
  {
    key: '半程马拉松',
    label: '半程马拉松最佳成绩:',
    ranges: [[...rangeH4], [...range60], [...range60]],
    selected: [0, 0, 0],
    hasValue: false,
    formatFn: (indices) => `${rangeH4[indices[0]]}:${range60[indices[1]]}:${range60[indices[2]]}`
  },
  {
    key: '马拉松',
    label: '马拉松最佳成绩:',
    ranges: [[...rangeH7], [...range60], [...range60]],
    selected: [0, 0, 0],
    hasValue: false,
    formatFn: (indices) => `${rangeH7[indices[0]]}:${range60[indices[1]]}:${range60[indices[2]]}`
  }
])

const modalState = ref('hidden')
const finalVdot = ref(0)

// 获取展示文本
function getDisplayTime(dist) {
  return dist.formatFn(dist.selected)
}

// 获取时间字符串（用于计算）
function getTimeString(dist) {
  return dist.formatFn(dist.selected)
}

// picker 列滚动
function onColumnChange(dist, event) {
  const { column, value } = event.detail
  dist.selected[column] = value
}

// picker 确认选择
function onPickerChange(dist, event) {
  dist.selected = event.detail.value
  dist.hasValue = true
}

// 时间字符串转总秒数
function getSeconds(timeStr) {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return 0
}

// 计算单个科目的 VDOT 值
function getVDOT(subject, performances) {
  const pb = performances.pbs.find(p => p.subject === subject)
  if (!pb) return null

  const totalSeconds = getSeconds(pb.performance)
  const MIN_VDOT = 30
  const MAX_VDOT = 85

  for (let v = MIN_VDOT; v <= MAX_VDOT; v++) {
    const baseTime = vdotMap[String(v)]?.[subject]
    if (!baseTime) continue
    const baseSeconds = getSeconds(baseTime)
    if (totalSeconds > baseSeconds) {
      return Math.max(v - 1, MIN_VDOT)
    }
  }
  return MAX_VDOT
}

// 重置
function resetAll() {
  for (const dist of distances) {
    dist.selected = dist.selected.map(() => 0)
    dist.hasValue = false
  }
  modalState.value = 'hidden'
}

// 确定
function confirm() {
  const pbs = []
  for (const dist of distances) {
    if (!dist.hasValue) continue
    pbs.push({
      subject: dist.key,
      performance: getTimeString(dist)
    })
  }

  // 检查是否至少输入一项
  if (pbs.length === 0) {
    modalState.value = 'no-input'
    return
  }

  calculateVDOT(pbs)
}

// 填入全马破三
function fillMarathon303() {
  // 设置马拉松为 2:58:47
  const marathon = distances.find(d => d.key === '马拉松')
  marathon.selected = [2, 58, 47]
  marathon.hasValue = true

  modalState.value = 'hidden'

  const pbs = []
  for (const dist of distances) {
    if (!dist.hasValue) continue
    pbs.push({
      subject: dist.key,
      performance: getTimeString(dist)
    })
  }

  calculateVDOT(pbs)
}

// 计算 VDOT
function calculateVDOT(pbs) {
  const performances = { pbs }
  const vdots = []

  for (const pb of pbs) {
    const vdot = getVDOT(pb.subject, performances)
    if (vdot !== null) {
      vdots.push({ subject: pb.subject, vdot })
    }
  }

  if (vdots.length === 0) {
    uni.showToast({ title: '无法计算VDOT', icon: 'none' })
    return
  }

  finalVdot.value = Math.max(...vdots.map(v => v.vdot))
  modalState.value = 'result'
}

// 返回上一页
function goBack() {
  uni.navigateBack()
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
  /* 使用 padding-box 模拟：用 margin 给子元素留空间 */
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 160rpx);
}

/* 所有带 padding 的卡片和内边距容器，都不设 width: 100%
   block 元素天然 100% 宽度，content-box 下加 padding 不会溢出 */

/* 描述文字 */
.desc-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 30rpx 30rpx 30rpx 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.desc-text {
  color: #555;
  font-size: 28rpx;
  line-height: 1.8;
  word-wrap: break-word;
}

/* 输入区域 */
.input-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin: 0 30rpx 30rpx 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.input-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.input-row:last-child {
  border-bottom: none;
}

.input-label {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: 500;
  flex-shrink: 0;
  width: 280rpx;
  white-space: nowrap;
}

.picker-display {
  background: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  width: 200rpx;
  text-align: center;
  color: #2C3E50;
  font-size: 26rpx;
  flex-shrink: 0;
  margin-left: auto;
}

.picker-display.picker-empty {
  color: #bbb;
}

/* 按钮区域 */
.button-row {
  display: flex;
  gap: 30rpx;
  margin: 0 30rpx 40rpx 30rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  border: none;
}

.btn-reset {
  background: #ecf0f1;
  color: #7F8C8D;
}

.btn-confirm {
  background: #3498DB;
  color: #FFFFFF;
}

/* 弹窗遮罩 */
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
  z-index: 999;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 50rpx 40rpx 30rpx;
  width: 580rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.modal-title {
  color: #2C3E50;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  text-align: center;
}

.modal-body {
  color: #666;
  font-size: 30rpx;
  margin-bottom: 40rpx;
  text-align: center;
  line-height: 1.6;
}

.modal-result {
  color: #3498DB;
  font-size: 100rpx;
  font-weight: bold;
  margin: 20rpx 0 40rpx;
  text-shadow: 0 4rpx 8rpx rgba(52, 152, 219, 0.2);
}

.modal-buttons {
  display: flex;
  gap: 20rpx;
  width: 100%;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  text-align: center;
  border: none;
}

.modal-btn-primary {
  background: #3498DB;
  color: #FFFFFF;
}

.modal-btn-secondary {
  background: #ecf0f1;
  color: #7F8C8D;
}
</style>
