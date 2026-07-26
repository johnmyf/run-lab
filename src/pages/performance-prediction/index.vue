<template>
  <view class="page-container">
    <!-- 顶部 Header -->
    <view class="header">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">成绩预测</text>
    </view>

    <view class="content-wrapper">
      <!-- VDOT 显示卡片 -->
      <view class="vdot-card">
        <text class="vdot-label">你的跑力值VDOT为:</text>
        <text class="vdot-value">{{ vdotValue ?? '--' }}</text>
      </view>

      <!-- 近期成绩预测卡片 -->
      <view class="prediction-card">
        <text class="section-title">近期成绩预测</text>

        <!-- 无VDOT提示 -->
        <view v-if="noVdot" class="no-vdot-tip">
          <text class="tip-icon">📊</text>
          <text class="tip-text">还未计算VDOT跑力值，请先前往跑力值计算页面进行评估</text>
          <button class="btn btn-primary btn-goto" @click="goToRunningPower">前往计算</button>
        </view>

        <!-- 成绩列表 -->
        <view v-else class="prediction-list">
          <view class="prediction-row" v-for="item in predictions" :key="item.subject">
            <text class="prediction-label">{{ item.label }}</text>
            <text class="prediction-time">{{ item.time }}</text>
          </view>
        </view>
      </view>

      <!-- 训练配速建议卡片（建设中） -->
      <view class="pace-card">
        <text class="section-title">训练配速建议</text>
        <view class="pace-placeholder">
          <text class="placeholder-icon">🏃</text>
          <text class="placeholder-text">训练配速建议功能开发中，敬请期待...</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
        <button class="btn btn-re-eval" @click="goToRunningPower">重新评估</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import vdotMap from '@/data/sheet5-1.json'

// 需要显示的7个subject：与 sheet5-1.json 中的 key 完全对应
const subjects = ['1500米', '3公里', '5公里', '10公里', '15公里', '半程马拉松', '马拉松']

// 从 storage 读取 VDOT 值（跑力值计算页面写入）
const vdotValue = ref(uni.getStorageSync('vdot') || null)
const noVdot = computed(() => vdotValue.value === null)

// 生成预测成绩列表
const predictions = computed(() => {
  if (noVdot.value) return []

  const vdot = String(vdotValue.value)
  const data = vdotMap[vdot]
  if (!data) return []

  return subjects.map(subject => ({
    subject,
    // "[跑步]" 显示规则：半程马拉松和马拉松不显示，其他显示
    label: subject + (subject !== '半程马拉松' && subject !== '马拉松' ? '[跑步]' : ''),
    time: data[subject] ? formatPerformanceTime(data[subject]) : '数据缺失'
  }))
})

/**
 * 将 "H:MM:SS" 格式转换为中文显示
 * 如 "0:30:40" → "30分40秒"
 * 如 "1:31:35" → "1小时31分35秒"
 */
function formatPerformanceTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length !== 3) return timeStr

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parseInt(parts[2], 10)

  let result = ''
  if (hours > 0) {
    result += `${hours}小时`
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}分`
  }
  result += `${seconds}秒`
  return result
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 分享
function shareResult() {
  uni.showToast({ title: '分享功能暂未开放', icon: 'none' })
}

// 返回首页（首页为 tabBar 页面，需用 switchTab）
function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

// 前往跑力值计算页面
function goToRunningPower() {
  uni.navigateTo({ url: '/pages/running-power/index' })
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* ==================== Header ==================== */
.header {
  background: #E74C3C;
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

/* ==================== Content ==================== */
.content-wrapper {
  padding: 30rpx;
}

/* ==================== VDOT 卡片 ==================== */
.vdot-card {
  background: linear-gradient(135deg, #E74C3C, #C0392B);
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(231, 76, 60, 0.3);
}

.vdot-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
  display: block;
  margin-bottom: 16rpx;
}

.vdot-value {
  color: #FFFFFF;
  font-size: 100rpx;
  font-weight: bold;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
}

/* ==================== 预测卡片 ==================== */
.prediction-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-title {
  color: #2C3E50;
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.prediction-list {
  padding-bottom: 10rpx;
}

.prediction-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.prediction-row:last-child {
  border-bottom: none;
}

.prediction-label {
  color: #555;
  font-size: 28rpx;
}

.prediction-time {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: bold;
}

/* ==================== 无 VDOT 提示 ==================== */
.no-vdot-tip {
  padding: 50rpx 0;
  text-align: center;
}

.tip-icon {
  font-size: 72rpx;
  display: block;
  margin-bottom: 24rpx;
}

.tip-text {
  color: #999;
  font-size: 28rpx;
  display: block;
  margin-bottom: 36rpx;
  line-height: 1.6;
}

/* ==================== 训练配速建议占位 ==================== */
.pace-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.pace-placeholder {
  text-align: center;
  padding: 50rpx 0;
}

.placeholder-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.placeholder-text {
  color: #999;
  font-size: 28rpx;
}

/* ==================== 操作按钮 ==================== */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

/* 通用按钮样式 */
.btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  text-align: center;
  border: none;
  color: #FFFFFF;
}

.btn-primary {
  background: #E74C3C;
}

.btn-share {
  background: #2C3E50;
}

.btn-home {
  background: #3498DB;
}

.btn-re-eval {
  background: #E74C3C;
}

.btn-goto {
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
  color: #FFFFFF;
  background: #E74C3C;
  display: inline-block;
  padding: 0 48rpx;
  width: auto;
}
</style>
