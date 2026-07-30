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
        <text class="section-subtitle">注: 下限为现阶段理应达到的成绩，上限为现阶段可挑战成绩</text>

        <!-- 无VDOT提示 -->
        <view v-if="noVdot" class="no-vdot-tip">
          <text class="tip-icon">📊</text>
          <text class="tip-text">还没有估算VDOT跑力值，请先前往跑力值计算页面进行评估</text>
          <button class="btn btn-primary btn-goto" @click="goToRunningPower">前往计算</button>
        </view>

        <!-- 成绩列表 -->
        <view v-else class="prediction-list">
          <view class="prediction-row" v-for="item in predictions" :key="item.subject">
            <text class="prediction-label">{{ item.label }}</text>
            <view class="prediction-values">
              <text class="prediction-range">{{ item.upperTime }} ~ {{ item.lowerTime }}</text>
              <text class="prediction-pace" v-if="item.lowerPace">配速: {{ item.upperPace }} ~ {{ item.lowerPace }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 训练配速建议卡片 -->
      <view v-if="!noVdot" class="pace-card">
        <text class="section-title">训练配速建议</text>
        <view class="pace-list">
          <view class="pace-item" v-for="item in trainingPaces" :key="item.type">
            <text class="pace-label">{{ item.label }}:</text>
            <text class="pace-value">{{ item.display }}</text>
          </view>
        </view>

        <!-- 训练说明分隔线 -->
        <view class="readme-divider"></view>

        <!-- 训练说明 -->
        <view class="readme-list">
          <view class="readme-item" v-for="item in trainingReadme" :key="item.type">
            <text class="readme-title">{{ item.title }}</text>
            <text class="readme-text">{{ item.text }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="!sharing && !noVdot">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
        <button class="btn btn-re-eval" @click="goToRunningPower">重新评估</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
// #ifdef H5
import html2canvas from 'html2canvas'
// #endif
import vdotMap from '@/data/sheet5-1.json'
import trainingPacesData from '@/data/sheet5-2.json'
import { parseTimeToSeconds, secondsToTimeStr, secondsToPaceStr } from '@/utils/time'
import { SUBJECTS, DISTANCE_KM, TRAINING_CONFIG, REPEAT_PRIORITY, README_CONTENT, getSubjectLabel } from '@/logic/performance-prediction/constants'
import { formatRange, INTERVAL_FORMATTERS, formatRepeatPace, formatPaceStr } from '@/logic/performance-prediction/formatters'

// ==================== 状态 ====================

/** 从 storage 读取 VDOT 值（跑力值计算页面写入） */
const vdotValue = ref(uni.getStorageSync('vdot') || null)
const noVdot = computed(() => vdotValue.value === null)
const sharing = ref(false)

// ==================== 成绩预测 ====================

/** 生成预测成绩列表（含范围 + 配速） */
const predictions = computed(() => {
  if (noVdot.value) return []

  const vdot = Number(vdotValue.value)
  const data = vdotMap[String(vdot)]
  const nextData = vdotMap[String(vdot + 1)]
  if (!data) return []

  return SUBJECTS.map(subject => {
    const lowerTimeStr = data[subject]
    if (!lowerTimeStr) return { subject, label: getSubjectLabel(subject), lowerTime: '数据缺失', upperTime: '', lowerPace: '', upperPace: '' }

    const lowerSecs = parseTimeToSeconds(lowerTimeStr)
    const lowerTime = secondsToTimeStr(lowerSecs)

    // 上限 = vdot+1 的成绩 - 1 秒（若无则与下限相同）
    let upperTime, upperSecs
    if (nextData && nextData[subject]) {
      upperSecs = parseTimeToSeconds(nextData[subject]) - 1
      upperTime = secondsToTimeStr(upperSecs)
    } else {
      upperSecs = lowerSecs
      upperTime = lowerTime
    }

    // 配速 = 时间(秒) / 距离(公里)
    const distKm = DISTANCE_KM[subject]
    const lowerPace = distKm ? secondsToPaceStr(lowerSecs / distKm) : ''
    const upperPace = distKm ? secondsToPaceStr(upperSecs / distKm) : ''

    return {
      subject,
      label: getSubjectLabel(subject),
      lowerTime,
      upperTime,
      lowerPace,
      upperPace
    }
  })
})

// ==================== 训练配速建议 ====================

/** 生成训练配速列表 */
const trainingPaces = computed(() => {
  if (noVdot.value) return []
  const vdot = String(vdotValue.value)
  const subjects = trainingPacesData[vdot]?.training_subjects
  if (!subjects) return []

  const items = []

  // 固定训练类型（按配置顺序）
  for (const config of TRAINING_CONFIG) {
    const value = subjects[config.field]
    if (!value || value === 0) continue

    let display
    if (config.isRange) {
      display = formatRange(value)
    } else if (config.formatter && INTERVAL_FORMATTERS[config.formatter]) {
      display = INTERVAL_FORMATTERS[config.formatter](value)
    } else {
      display = formatPaceStr(value)
    }

    items.push({ type: config.type, label: config.label, display })
  }

  // 重复跑（按优先级选择第一个非零值）
  for (const rp of REPEAT_PRIORITY) {
    const value = subjects[rp.key]
    if (!value || value === 0) continue
    items.push({
      type: rp.type,
      label: rp.label,
      display: formatRepeatPace(value, rp.distance)
    })
    break
  }

  return items
})

/** 生成训练说明列表 */
const trainingReadme = computed(() => {
  if (!trainingPaces.value.length) return []
  const types = trainingPaces.value.map(i => i.type)
  const readmeItems = []

  // 固定顺序：轻松跑 → 长距离 → 马拉松 → 乳酸门槛 → 间歇跑 → 重复跑
  if (types.includes('easy')) readmeItems.push({ ...README_CONTENT.easy, type: 'easy' })
  if (types.includes('long')) readmeItems.push({ ...README_CONTENT.long, type: 'long' })
  if (types.includes('marathon')) readmeItems.push({ ...README_CONTENT.marathon, type: 'marathon' })
  if (types.includes('threshold')) readmeItems.push({ ...README_CONTENT.threshold, type: 'threshold' })
  // 只要有任一 I 系列类型，就显示间歇跑说明
  if (types.some(t => t.startsWith('i'))) readmeItems.push({ ...README_CONTENT.interval, type: 'interval' })
  if (types.includes('repeat')) readmeItems.push({ ...README_CONTENT.repeat, type: 'repeat' })

  return readmeItems
})

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 分享成绩（生成图片并下载）
async function shareResult() {
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中打开使用分享功能', icon: 'none' })
  return
  // #endif

  try {
    uni.showLoading({ title: '生成分享图片...' })

    // 隐藏按钮后再截图
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
    link.download = `成绩预测_VDOT${vdotValue.value}.png`
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
  margin-bottom: 8rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-subtitle {
  display: block;
  color: #999;
  font-size: 24rpx;
  margin-top: -8rpx;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.prediction-list {
  padding-bottom: 10rpx;
}

.prediction-row {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.prediction-row:last-child {
  border-bottom: none;
}

.prediction-label {
  flex: 1;
  display: flex;
  align-items: center;
  color: #2C3E50;
  font-size: 34rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.prediction-values {
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.prediction-range {
  color: #E74C3C;
  font-size: 30rpx;
  font-weight: bold;
}

.prediction-pace {
  color: #999;
  font-size: 24rpx;
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

/* ==================== 训练配速建议 ==================== */
.pace-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.pace-list {
  padding-bottom: 10rpx;
}

.pace-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.pace-item:last-of-type {
  border-bottom: none;
}

.pace-label {
  color: #555;
  font-size: 28rpx;
}

.pace-value {
  color: #E74C3C;
  font-size: 28rpx;
  font-weight: bold;
}

/* 训练说明分隔线 */
.readme-divider {
  height: 2rpx;
  background: #e8e8e8;
  margin: 24rpx 0 20rpx;
}

/* 训练说明列表 */
.readme-list {
  padding-top: 10rpx;
}

.readme-item {
  padding: 16rpx 0;
}

.readme-item + .readme-item {
  border-top: 2rpx dashed #f0f0f0;
  margin-top: 8rpx;
  padding-top: 24rpx;
}

.readme-title {
  color: #2C3E50;
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.readme-text {
  color: #777;
  font-size: 24rpx;
  line-height: 1.7;
  display: block;
}

/* ==================== 操作按钮 ==================== */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

/* 通用按钮样式 */
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
