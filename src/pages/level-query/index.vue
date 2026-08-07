<template>
  <view class="page-container">
    <!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
    <SharePoster ref="posterRef" title="等级查询" color="#F39C12" :content="posterContent" />
    <!-- #endif -->
    <view class="content-wrapper">
      <!-- 项目 -->
      <view class="section">
        <text class="section-label">项目</text>
        <view class="chip-options">
          <view
            v-for="p in PROJECTS"
            :key="p"
            class="chip"
            :class="{ active: project === p }"
            @click="selectProject(p)"
          >
            <text>{{ p }}</text>
          </view>
        </view>
      </view>

      <!-- 性别 -->
      <view class="section">
        <text class="section-label">性别</text>
        <view class="chip-options">
          <view
            v-for="g in GENDERS"
            :key="g"
            class="chip"
            :class="{ active: gender === g }"
            @click="selectGender(g)"
          >
            <text>{{ g }}</text>
          </view>
        </view>
      </view>

      <!-- 最好成绩 -->
      <view class="section">
        <text class="section-label">最好成绩</text>
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

      <!-- 年龄 -->
      <view class="section">
        <text class="section-label">年龄</text>
        <picker mode="selector" :range="AGE_RANGE" :value="ageIndex" @change="onAgeChange">
          <view class="age-display">
            <text>{{ AGE_RANGE[ageIndex] }}岁</text>
          </view>
        </picker>
      </view>

      <button class="query-btn" @click="query">查询</button>

      <!-- 结果区（查询后显示） -->
      <view v-if="hasQuery" class="result-card">
        <text class="result-label">你的级别</text>
        <text class="result-value">{{ resultDisplay }}</text>
      </view>

      <!-- 附录：等级标准表（参考附录，与主内容区分隔） -->
      <text class="appendix-title">附录：等级标准表</text>

      <!-- 表格区（无论是否查询都显示，跟随所选 项目+性别） -->
      <view class="table-card">
        <text class="table-title">专业运动员等级标准</text>
        <view class="table-header-row">
          <text class="col-level">级别</text>
          <text class="col-time">成绩</text>
        </view>
        <view :class="['table-body', { 'table-body-expand': sharing }]">
          <view class="table-row" v-for="row in proTable" :key="row.level">
            <text class="col-level">{{ row.level }}</text>
            <text class="col-time">{{ row.time }}</text>
          </view>
        </view>
      </view>

      <view class="table-card">
        <text class="table-title">大众等级标准</text>
        <view class="table-header-row">
          <text class="col-age">年龄组</text>
          <text class="col-level-time">大众精英</text>
          <text class="col-level-time">大众一级</text>
          <text class="col-level-time">大众二级</text>
        </view>
        <view :class="['table-body', { 'table-body-expand': sharing }]">
          <view class="table-row" v-for="ageGroup in AGE_GROUPS" :key="ageGroup">
            <text class="col-age">{{ ageGroup }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众精英') }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众一级') }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众二级') }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="!sharing">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
import SharePoster from '@/components/share-poster.vue'
// #endif
import { onShareAppMessage } from '@dcloudio/uni-app'
import levelData from '@/data/level.json'
import {
  PROJECTS, GENDERS, AGE_GROUPS, AGE_RANGE,
  HOUR_RANGE, MIN_SEC_RANGE, NO_LEVEL_TEXT,
  getLevelDisplayName,
} from '@/logic/level-query/constants'
import { queryLevel } from '@/logic/level-query/calculator'

// ==================== 选择器状态 ====================

const project = ref('马拉松')
const gender = ref('男子')

const timePicker = reactive({
  ranges: [HOUR_RANGE, MIN_SEC_RANGE, MIN_SEC_RANGE],
  selected: [3, 0, 0], // 默认 3:00:00
})

const ageIndex = ref(AGE_RANGE.indexOf('30')) // 默认 30 岁
const sharing = ref(false)

// ==================== 查询状态 ====================

const resultLevel = ref(null) // 达标级别 key；null 表示无达标
const hasQuery = ref(false)

const resultDisplay = computed(() =>
  resultLevel.value ? getLevelDisplayName(resultLevel.value) : NO_LEVEL_TEXT
)

// ==================== 分享海报内容（小程序端） ====================

const posterRef = ref(null)
const posterContent = computed(() => {
  if (!hasQuery.value) return []
  const [h, m, s] = timePicker.selected
  const timeStr = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return [
    { label: '项目', value: project.value },
    { label: '组别', value: gender.value },
    { label: '年龄', value: `${AGE_RANGE[ageIndex.value]} 岁` },
    { label: '成绩', value: timeStr },
    { label: '等级', value: resultDisplay.value },
  ]
})

// ==================== 表格数据 ====================

/** 专业表：由高到低显示（国际健将 → 三级运动员） */
const proTable = computed(() => {
  const pro = levelData[project.value]?.[gender.value]?.['专业'] || {}
  const order = ['国际健将', '运动健将', '一级运动员', '二级运动员', '三级运动员']
  return order.map(level => ({
    level,
    time: pro[level] || '—'
  }))
})

function massTime(ageGroup, level) {
  return levelData[project.value]?.[gender.value]?.['大众']?.[level]?.[ageGroup] || '—'
}

// ==================== 方法 ====================

function selectProject(p) {
  project.value = p
  resultLevel.value = null
  hasQuery.value = false
}

function selectGender(g) {
  gender.value = g
  resultLevel.value = null
  hasQuery.value = false
}

function onColumnChange(e) {
  const { column, value } = e.detail
  timePicker.selected[column] = value
}

function onTimeChange(e) {
  timePicker.selected = e.detail.value
}

function onAgeChange(e) {
  ageIndex.value = e.detail.value
}

function query() {
  const [h, m, s] = timePicker.selected
  const totalSeconds = h * 3600 + m * 60 + s
  if (totalSeconds <= 0) {
    uni.showToast({ title: '请设置有效成绩', icon: 'none' })
    return
  }
  const age = Number(AGE_RANGE[ageIndex.value])
  resultLevel.value = queryLevel(
    { project: project.value, gender: gender.value, age, totalSeconds },
    levelData
  )
  hasQuery.value = true
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
onShareAppMessage(() => ({
  title: '等级查询 — 跑研匠',
  path: '/pages/level-query/index',
}))
// #endif

// 分享（H5 截图 + 二维码）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '等级查询', title: '等级查询', color: '#F39C12' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif

  // #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
  if (!hasQuery.value) {
    uni.showToast({ title: '请先查询', icon: 'none' })
    return
  }
  await posterRef.value.share()
  // #endif
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}
.content-wrapper {
  padding: 30rpx;
}

/* 卡片区 */
.section {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.section-label {
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

/* chips */
.chip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.chip {
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx;
  color: #7F8C8D;
}
.chip.active {
  background: #F39C12;
  border-color: #F39C12;
  color: #FFF;
}

/* 时间/年龄显示 */
.time-display,
.age-display {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  padding: 28rpx 50rpx;
  background: #FFF7EB;
  border-radius: 16rpx;
  border: 2rpx solid #E8D8C0;
}
.time-display text,
.age-display text {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
}

/* 查询按钮 */
.query-btn {
  width: 100%;
  height: 88rpx;
  background: #F39C12;
  color: #FFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 44rpx 0 56rpx;
  box-shadow: 0 4rpx 12rpx rgba(243, 156, 18, 0.4);
}

/* 结果卡 */
.result-card {
  background: linear-gradient(135deg, #F39C12, #E67E22);
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 80rpx;
  box-shadow: 0 4rpx 16rpx rgba(243, 156, 18, 0.3);
}
.result-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26rpx;
  display: block;
  margin-bottom: 12rpx;
}
.result-value {
  color: #FFF;
  font-size: 48rpx;
  font-weight: bold;
  display: block;
}

/* 附录标题 */
.appendix-title {
  font-size: 26rpx;
  color: #95A5A6;
  display: block;
  margin: 30rpx 0 24rpx;
  padding-left: 8rpx;
}

/* 表格卡 */
.table-card {
  background: #FFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 30rpx;
}
.table-title {
  font-size: 30rpx;
  color: #2C3E50;
  font-weight: bold;
  padding: 24rpx 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
  display: block;
}
.table-header-row {
  display: flex;
  padding: 18rpx 30rpx;
  background: #F39C12;
  color: #FFF;
  font-size: 26rpx;
  font-weight: bold;
}
.table-body {
  max-height: 700rpx;
  overflow-y: auto;
}
.table-body-expand {
  max-height: none;
  overflow-y: visible;
}
.table-row {
  display: flex;
  padding: 18rpx 30rpx;
  border-bottom: 2rpx solid #F0F0F0;
  font-size: 26rpx;
  color: #2C3E50;
}
.table-row:last-child {
  border-bottom: none;
}
.col-level {
  width: 50%;
}
.col-time {
  width: 50%;
  text-align: right;
}
.col-age {
  width: 40%;
}
.col-level-time {
  width: 20%;
  text-align: center;
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
  background: #F39C12;
  color: #FFF;
}
.btn-home {
  background: #2C3E50;
  color: #FFF;
}
</style>
