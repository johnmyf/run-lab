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
      <view class="action-buttons" v-show="!sharing">
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

// 需要显示的7个subject：与 sheet5-1.json 中的 key 完全对应
const subjects = ['1500米', '3公里', '5公里', '10公里', '15公里', '半程马拉松', '马拉松']

// 从 storage 读取 VDOT 值（跑力值计算页面写入）
const vdotValue = ref(uni.getStorageSync('vdot') || null)
const noVdot = computed(() => vdotValue.value === null)
const sharing = ref(false)

// 生成预测成绩列表
const predictions = computed(() => {
  if (noVdot.value) return []

  const vdot = String(vdotValue.value)
  const data = vdotMap[vdot]
  if (!data) return []

  return subjects.map(subject => ({
    subject,
    // "[跑步]" 显示规则：半程马拉松和马拉松不显示，其他显示
    label: subject + (subject !== '半程马拉松' && subject !== '马拉松' ? '跑步' : ''),
    time: data[subject] ? formatPerformanceTime(data[subject]) : '数据缺失'
  }))
})

// ==================== 训练说明数据 ====================
const README_CONTENT = {
  easy: { title: '轻松跑', text: '又叫E跑，日常有氧慢跑。体感轻松，呼吸均匀，可以边跑边聊天，能连续说出15字以上的句子，打有氧基础用。' },
  long: { title: '长距离慢跑', text: '又叫L跑或LSD，有氧跑的进阶，时间控制在90~150分钟，其它要求跟轻松跑一致，作用：让身体习惯长时间运动，增强耐力，同时磨炼心理。' },
  marathon: { title: '马拉松配速跑', text: '又叫节奏跑或M跑，比赛前模拟比赛节奏，熟悉比赛时的速度和体感，帮自己建立信心。训练作用不大，但赛前练几次很有必要。' },
  threshold: { title: '乳酸门槛跑', text: '又叫T跑，作用是提高身体清除乳酸的能力，让你在较快速度下坚持更久，腿不容易酸胀。体感是"舒适的难受"，比轻松跑累很多，但还能勉强说几个词，不能完整聊天。每次跑20~40分钟。' },
  interval: { title: '间歇跑', text: '又叫I跑，作用是大幅提升最大摄氧量，让你跑得更快、肺活量更大。做法：快跑几分钟（如3分钟），然后慢跑或走同样时间休息，重复多组。体感非常喘，基本说不出话。' },
  repeat: { title: '重复跑', text: '又叫R跑，作用是提高速度、步频和跑步效率，让你跑起来更省力。做法：短距离冲刺（如200米或400米），用最快速度跑完，然后完全休息（走路或站住直到心跳平复），再跑下一组。体感是全力爆发，但休息时间长，不会太痛苦。' }
}

// 训练配速类型配置：顺序、标题、对应字段
const TRAINING_CONFIG = [
  { type: 'easy', label: '轻松跑配速范围', field: 'EL1KMPace', isRange: true },
  { type: 'long', label: '长距离慢跑配速范围', field: 'EL1KMPace', isRange: true },
  { type: 'marathon', label: '马拉松配速跑配速', field: 'M1KMPace' },
  { type: 'threshold', label: '乳酸门槛跑配速', field: 'T1KMPace' },
  // 间歇跑系列
  { type: 'i400', label: '400米间歇跑用时', field: 'I400MPace' },
  { type: 'i800', label: '800米间歇跑用时', field: 'I1KMPace', formatter: 'i800' },
  { type: 'i1000', label: '1000米间歇跑用时及配速', field: 'I1KMPace' },
  { type: 'i1200', label: '1200米间歇跑用时', field: 'I1200MPace', formatter: 'i1200' },
  { type: 'i1600', label: '1.6公里间歇跑用时', field: 'I1.6KMPace', formatter: 'i1600' }
]

// 重复跑优先级（从高到低）
const REPEAT_PRIORITY = [
  { type: 'repeat', key: 'R800MPace', label: '800米重复跑用时', distance: 800 },
  { type: 'repeat', key: 'R600MPace', label: '600米重复跑用时', distance: 600 },
  { type: 'repeat', key: 'R400MPace', label: '400米重复跑用时', distance: 400 },
  { type: 'repeat', key: 'R200MPace', label: '200米重复跑用时', distance: 200 }
]

/**
 * 将 "M:SS" 格式转换为总秒数
 */
function paceToSeconds(pace) {
  if (!pace || pace === 0) return 0
  const parts = String(pace).split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * 将总秒数转换为 "M:SS" 格式（M 无前导零）
 */
function secondsToPace(totalSecs) {
  const m = Math.floor(totalSecs / 60)
  const s = Math.round(totalSecs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * 格式化范围值 {from, to} 为 "M:SS ~ M:SS"
 */
function formatRange(value) {
  if (!value || value === 0) return ''
  return `${value.from} ~ ${value.to}`
}

// 各间歇跑类型的格式化函数
const INTERVAL_FORMATTERS = {
  i800(value) {
    // 800m 用时 = 1km 配速 × 0.8，后跟配速
    const eightHundredSecs = paceToSeconds(value) * 0.8
    return `${secondsToPace(eightHundredSecs)} (配速:${value}/km)`
  },
  i1200(value) {
    // 1200m 用时直接显示，后跟配速(×0.834)
    const perKmSecs = paceToSeconds(value) * 0.834
    return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
  },
  i1600(value) {
    // 1.6km 用时直接显示，后跟配速(×0.625)
    const perKmSecs = paceToSeconds(value) * 0.625
    return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
  }
}

/**
 * 格式化重复跑配速（转换为1000米配速）
 */
function formatRepeatPace(value, distance) {
  const secs = paceToSeconds(value)
  const perKmSecs = secs * (1000 / distance)
  return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
}

// 生成训练配速列表
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
      display = value
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

// 生成训练说明列表
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
