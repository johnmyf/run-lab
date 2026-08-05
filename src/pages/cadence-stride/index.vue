<template>
  <view class="page-container">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- 顶栏 #5C6BC0 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack">
        <text>←</text>
      </view>
      <text class="header-title">步频步幅计算</text>
    </view>

    <view class="content-wrapper">
      <!-- 计算项（三选一） -->
      <view class="section">
        <text class="section-label">计算项</text>
        <view class="mode-options">
          <view
            v-for="m in MODE_OPTIONS"
            :key="m.key"
            class="mode-option"
            :class="{ active: mode === m.key }"
            @click="selectMode(m.key)"
          >
            <text class="mode-radio">{{ mode === m.key ? '●' : '○' }}</text>
            <text class="mode-label">{{ m.label }}</text>
          </view>
        </view>
        <text class="section-hint">{{ HINT_TEXT }}</text>
      </view>

      <!-- 输入项（随模式隐藏其一） -->
      <view class="section">
        <text class="section-label">输入项</text>

        <!-- 步频（数值选择器 130~260，间隔 1） -->
        <view class="input-row" v-if="mode !== 'cadence'">
          <text class="input-label">步频</text>
          <picker
            mode="selector"
            :range="CADENCE_RANGE"
            :value="cadenceIndex"
            @change="onCadenceChange"
          >
            <view class="num-display">
              <text class="num-value">{{ CADENCE_RANGE[cadenceIndex] }}</text>
            </view>
          </picker>
          <text class="input-unit">{{ CADENCE_UNIT }}</text>
        </view>

        <!-- 步幅（数值选择器：整数部分 0~2 + 百分位，范围随整数动态限定） -->
        <view class="input-row" v-if="mode !== 'stride'">
          <text class="input-label">步幅</text>
          <picker
            mode="multiSelector"
            :range="stridePicker.ranges"
            :value="stridePicker.selected"
            @columnchange="onStrideColumnChange"
            @change="onStrideChange"
          >
            <view class="pace-display">
              <text class="pace-num">{{ stridePicker.ranges[0][stridePicker.selected[0]] }}</text>
              <text class="pace-dot">.</text>
              <text class="pace-num">{{ stridePicker.ranges[1][stridePicker.selected[1]] }}</text>
            </view>
          </picker>
          <text class="input-unit">{{ STRIDE_UNIT }}</text>
        </view>

        <!-- 配速 -->
        <view class="input-row" v-if="mode !== 'pace'">
          <text class="input-label">配速</text>
          <picker
            mode="multiSelector"
            :range="pacePicker.ranges"
            :value="pacePicker.selected"
            @columnchange="onColumnChange"
            @change="onPaceChange"
          >
            <view class="pace-display">
              <view class="pace-col">
                <text class="pace-num">{{ pacePicker.ranges[0][pacePicker.selected[0]] }}</text>
                <text class="pace-label">分</text>
              </view>
              <view class="pace-col">
                <text class="pace-num">{{ pacePicker.ranges[1][pacePicker.selected[1]] }}</text>
                <text class="pace-label">秒</text>
              </view>
              <text class="pace-suffix">{{ PACE_UNIT }}</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 结果区（实时，无需按钮；表格行，结果在最下且突出） -->
      <view v-if="hasResult" class="result-card">
        <view
          v-for="(row, i) in result.rows"
          :key="i"
          class="result-row"
          :class="{ 'result-row-result': row.highlight }"
        >
          <text class="result-label">{{ row.label }}</text>
          <text class="result-colon">：</text>
          <text class="result-value">{{ row.value }}</text>
        </view>
      </view>

      <!-- 附录 -->
      <text class="appendix-title">附录：步频 · 步幅 · 配速</text>
      <view class="appendix-card">
        <view class="appendix-section" v-for="(sec, i) in APPENDIX" :key="i">
          <text class="appendix-sec-title">{{ sec.title }}</text>
          <text class="appendix-sec-line" v-for="(line, j) in sec.lines" :key="j">{{ line }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="!sharing">
        <button class="btn btn-share" open-type="share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { statusBarHeight } from '@/utils/status-bar'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
import { nextTick } from 'vue'
// #endif
import { onShareAppMessage } from '@dcloudio/uni-app'
import {
  MODE_OPTIONS, CADENCE_RANGE, DEFAULT_CADENCE,
  STRIDE_WHOLE_RANGE, STRIDE_DECI_RANGES, DEFAULT_STRIDE,
  PACE_MIN_RANGE, PACE_SEC_RANGE, DEFAULT_PACE,
  CADENCE_UNIT, STRIDE_UNIT, PACE_UNIT, HINT_TEXT, APPENDIX,
} from '@/logic/cadence-stride/constants'
import { computeResult } from '@/logic/cadence-stride/calculator'

// ==================== 状态 ====================

const mode = ref('pace')          // 默认：由步频和步幅计算配速
const cadenceIndex = ref(CADENCE_RANGE.indexOf(DEFAULT_CADENCE))  // 默认步频 180

// 步幅双列选择器：整数部分 0~2 + 百分位（范围随整数部分动态限定，默认 1.00）
const stridePicker = reactive({
  ranges: [STRIDE_WHOLE_RANGE, STRIDE_DECI_RANGES['1']],
  selected: [...DEFAULT_STRIDE],
})

const pacePicker = reactive({
  ranges: [PACE_MIN_RANGE, PACE_SEC_RANGE],
  // DEFAULT_PACE 是「分/秒」值，需转为 range 索引（分钟列 2~19，索引≠值）
  selected: [PACE_MIN_RANGE.indexOf(String(DEFAULT_PACE[0])), DEFAULT_PACE[1]],
})

const sharing = ref(false)

// ==================== 实时结果（computed 派生，输入即算） ====================

const cadence = computed(() => Number(CADENCE_RANGE[cadenceIndex.value]))

const stride = computed(() => {
  const whole = Number(stridePicker.ranges[0][stridePicker.selected[0]])
  const deci = Number(stridePicker.ranges[1][stridePicker.selected[1]])
  return whole + deci / 100
})

const result = computed(() => {
  const [mIdx, sIdx] = pacePicker.selected
  const paceSeconds = Number(pacePicker.ranges[0][mIdx]) * 60 + Number(pacePicker.ranges[1][sIdx])
  return computeResult({
    mode: mode.value,
    cadence: cadence.value,
    stride: stride.value,
    paceSeconds,
  })
})

const hasResult = computed(() => result.value !== null)

// ==================== 方法 ====================

function selectMode(key) {
  mode.value = key
}

function onCadenceChange(e) {
  cadenceIndex.value = e.detail.value
}

function onStrideColumnChange(e) {
  const { column, value } = e.detail
  if (column === 0) {
    // 整数部分变化 → 切换百分位范围，百分位重置为最低合法值
    stridePicker.ranges[1] = STRIDE_DECI_RANGES[STRIDE_WHOLE_RANGE[value]]
    stridePicker.selected = [value, 0]
  } else {
    stridePicker.selected[1] = value
  }
}

function onStrideChange(e) {
  stridePicker.selected = e.detail.value
  stridePicker.ranges[1] = STRIDE_DECI_RANGES[STRIDE_WHOLE_RANGE[e.detail.value[0]]]
}

function onColumnChange(e) {
  const { column, value } = e.detail
  pacePicker.selected[column] = value
}

function onPaceChange(e) {
  pacePicker.selected = e.detail.value
}

function navigateBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '步频步幅计算 — 跑研社',
  path: '/pages/cadence-stride/index',
}))
// #endif

// 分享（H5 截图 + 二维码，参照完赛时间计算页面）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '步频步幅' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif
}
</script>

<style scoped>
.status-bar {
  background: #5C6BC0;
}

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
  background: #5C6BC0;
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.section-label {
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}
.section-hint {
  font-size: 22rpx;
  color: #95A5A6;
  display: block;
  margin-top: 16rpx;
}

/* 计算项单选行 */
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.mode-option {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #E0E0E0;
}
.mode-option.active {
  background: #E8EAF6;
  border-color: #5C6BC0;
}
.mode-radio {
  font-size: 28rpx;
  color: #5C6BC0;
}
.mode-label {
  font-size: 28rpx;
  color: #2C3E50;
}
.mode-option.active .mode-label {
  color: #3F51B5;
  font-weight: bold;
}

/* 输入行 */
.input-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
}
.input-label {
  width: 100rpx;
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
}
.num-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx 30rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 12rpx;
}
.num-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
  min-width: 48rpx;
  text-align: center;
}
.input-unit {
  width: 130rpx;
  font-size: 26rpx;
  color: #7F8C8D;
}

/* 配速选择器 */
.pace-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: baseline;
  padding: 16rpx 30rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 12rpx;
}
.pace-col {
  display: inline-flex;
  align-items: baseline;
  min-width: 100rpx;
}
.pace-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
  min-width: 48rpx;
  text-align: center;
}
.pace-label {
  font-size: 26rpx;
  color: #2C3E50;
  margin-left: 4rpx;
}
.pace-suffix {
  font-size: 24rpx;
  color: #95A5A6;
  margin-left: 8rpx;
}
.pace-dot {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
  margin: 0 4rpx;
}

/* 结果卡（实时，表格行；上下留白间隔较原 30rpx 加大 100% → 60rpx） */
.result-card {
  background: #E8EAF6;
  border-radius: 16rpx;
  padding: 0 30rpx;
  margin: 60rpx 0;
}
.result-row {
  display: flex;
  align-items: baseline;
  padding: 24rpx 0;
  border-bottom: 2rpx solid rgba(92, 107, 192, 0.14);
}
.result-row:last-child {
  border-bottom: none;
}
.result-label {
  font-size: 28rpx;
  color: #2C3E50;
  flex-shrink: 0;
}
.result-colon {
  font-size: 28rpx;
  color: #2C3E50;
  margin: 0 8rpx;
}
.result-value {
  font-size: 28rpx;
  color: #2C3E50;
}
.result-row-result .result-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #5C6BC0;
}

/* 附录 */
.appendix-title {
  font-size: 26rpx;
  color: #95A5A6;
  display: block;
  margin: 30rpx 0 24rpx;
  padding-left: 8rpx;
}
.appendix-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.appendix-section {
  margin-bottom: 30rpx;
}
.appendix-section:last-child {
  margin-bottom: 0;
}
/* 第 2~5 板块上方行分隔（对应需求「---」；首个板块「1. 步频」不设） */
.appendix-section + .appendix-section {
  border-top: 2rpx solid #f0f0f0;
  padding-top: 24rpx;
}
.appendix-sec-title {
  font-size: 28rpx;
  color: #5C6BC0;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}
.appendix-sec-line {
  font-size: 24rpx;
  color: #555;
  line-height: 1.7;
  display: block;
  margin-bottom: 8rpx;
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
  background: #5C6BC0;
  color: #FFF;
}
.btn-home {
  background: #2C3E50;
  color: #FFF;
}
</style>
