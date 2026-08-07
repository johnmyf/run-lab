<template>
  <view class="page-container">
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
              <button class="modal-btn modal-btn-secondary" @click="modalState = 'hidden'">关闭</button>
              <button class="modal-btn modal-btn-primary" @click="goToPrediction">查看成绩预测</button>
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
import { parseTimeToSeconds } from '@/utils/time'
import { DISTANCE_CONFIGS, getPickerRanges, formatPickerTime, MARATHON_303_TIME } from '@/logic/running-power/constants'
import { getVDOT } from '@/logic/running-power/vdot'

// ==================== 状态 ====================

/** 各距离的 picker 状态 */
const distances = reactive(
  DISTANCE_CONFIGS.map(cfg => ({
    ...cfg,
    ranges: getPickerRanges(cfg.rangeCount, cfg.hourRange),
    selected: Array(cfg.rangeCount).fill(0),
    hasValue: false
  }))
)

const modalState = ref('hidden')
const finalVdot = ref(0)

// ==================== 展示 ====================

function getDisplayTime(dist) {
  return formatPickerTime(dist.ranges, dist.selected)
}

function getTimeString(dist) {
  return formatPickerTime(dist.ranges, dist.selected)
}

// ==================== Picker 事件 ====================

function onColumnChange(dist, event) {
  const { column, value } = event.detail
  dist.selected[column] = value
}

function onPickerChange(dist, event) {
  dist.selected = event.detail.value
  dist.hasValue = true
}

// ==================== 操作 ====================

function resetAll() {
  for (const dist of distances) {
    dist.selected = dist.selected.map(() => 0)
    dist.hasValue = false
  }
  modalState.value = 'hidden'
}

function confirm() {
  const pbs = []
  for (const dist of distances) {
    if (!dist.hasValue) continue
    pbs.push({ subject: dist.key, performance: getTimeString(dist) })
  }

  if (pbs.length === 0) {
    modalState.value = 'no-input'
    return
  }

  calculateVDOT(pbs)
}

function fillMarathon303() {
  const marathon = distances.find(d => d.key === '马拉松')
  marathon.selected = [...MARATHON_303_TIME]
  marathon.hasValue = true

  modalState.value = 'hidden'

  const pbs = []
  for (const dist of distances) {
    if (!dist.hasValue) continue
    pbs.push({ subject: dist.key, performance: getTimeString(dist) })
  }

  calculateVDOT(pbs)
}

function calculateVDOT(pbs) {
  const vdots = []

  for (const pb of pbs) {
    const vdot = getVDOT(pb.subject, pbs, vdotMap)
    if (vdot !== null) {
      vdots.push({ subject: pb.subject, vdot })
    }
  }

  if (vdots.length === 0) {
    uni.showToast({ title: '无法计算VDOT', icon: 'none' })
    return
  }

  finalVdot.value = Math.max(...vdots.map(v => v.vdot))
  uni.setStorageSync('vdot', finalVdot.value)
  modalState.value = 'result'
}

function goToPrediction() {
  modalState.value = 'hidden'
  uni.navigateTo({ url: '/pages/performance-prediction/index' })
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  overflow-x: hidden;
}

.content-wrapper {
  /* 使用 padding-box 模拟：用 margin 给子元素留空间 */
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
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
