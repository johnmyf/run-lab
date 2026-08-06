<template>
  <view class="heatmap-bar">
    <!-- 交界值标签（临界 BMI + 体重两行） -->
    <view class="boundary-labels">
      <view
        v-for="(b, i) in boundaries"
        :key="i"
        class="boundary-label"
        :style="{ left: boundaryPositions[i] + '%' }"
      >
        <text class="boundary-bmi">{{ b.bmi }}</text>
        <text class="boundary-weight">{{ b.weightKg }}kg</text>
      </view>
    </view>

    <!-- 黑色三角形（当前 BMI 精确比例定位） -->
    <view class="marker-wrap" :style="{ left: markerPos + '%' }">
      <view class="marker-triangle"></view>
    </view>

    <!-- 彩色分段条 -->
    <view class="bar">
      <view
        v-for="(seg, i) in segments"
        :key="i"
        class="bar-segment"
        :style="{ width: segWidth(seg) + '%', background: seg.cat.color }"
      ></view>
    </view>

    <!-- 图例表格（长名称防截断，跑者层级用） -->
    <view v-if="tableLegend" class="legend-table">
      <view v-for="(seg, i) in segments" :key="i" class="legend-row">
        <view class="legend-swatch" :style="{ background: seg.cat.color }"></view>
        <text class="legend-name">{{ seg.cat.name }}</text>
      </view>
    </view>

    <!-- 分类名标签（短名称，体重状态用） -->
    <view v-else class="cat-labels">
      <text
        v-for="(seg, i) in segments"
        :key="i"
        class="cat-label"
        :style="{ width: segWidth(seg) + '%' }"
      >{{ seg.cat.name }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getSegments, getBoundaryWeights, getMarkerPosition } from '@/logic/bmi/calculator'

const props = defineProps({
  categories: { type: Array, required: true }, // [{ name, min, max, color, visible }]，显示顺序
  axis: { type: Array, required: true },       // [min, max]
  currentBmi: { type: Number, required: true },
  heightCm: { type: Number, required: true },
  /** true 时用下方图例表格（色块+完整名称）替代分段下的分类名标签，避免长名称截断 */
  tableLegend: { type: Boolean, default: false },
})

const axisMin = computed(() => props.axis[0])
const axisMax = computed(() => props.axis[1])

/** 过滤隐藏档（visible === false 不显示，如「需注意身体健康」） */
const visibleCategories = computed(() =>
  props.categories.filter(c => c.visible !== false)
)

const segments = computed(() => getSegments(visibleCategories.value, axisMin.value, axisMax.value))
const boundaries = computed(() => getBoundaryWeights(props.heightCm, visibleCategories.value))
const boundaryPositions = computed(() =>
  boundaries.value.map(b => getMarkerPosition(b.bmi, axisMin.value, axisMax.value))
)
const markerPos = computed(() => getMarkerPosition(props.currentBmi, axisMin.value, axisMax.value))

function segWidth(seg) {
  return ((seg.end - seg.start) / (axisMax.value - axisMin.value)) * 100
}
</script>

<style scoped>
.heatmap-bar {
  position: relative;
}

/* 交界值标签 */
.boundary-labels {
  position: relative;
  height: 72rpx;
}
.boundary-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.boundary-bmi {
  font-size: 24rpx;
  color: #555;
  font-weight: bold;
  line-height: 1.2;
}
.boundary-weight {
  font-size: 20rpx;
  color: #999;
  line-height: 1.4;
}

/* 黑色三角形（用 border 画，双平台可用） */
.marker-wrap {
  position: absolute;
  top: 72rpx;
  transform: translateX(-50%);
  z-index: 2;
}
.marker-triangle {
  width: 0;
  height: 0;
  border-left: 14rpx solid transparent;
  border-right: 14rpx solid transparent;
  border-top: 20rpx solid #000000;
}

/* 分段条 */
.bar {
  display: flex;
  height: 40rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-top: 10rpx;
}
.bar-segment {
  height: 100%;
}

/* 分类名 */
.cat-labels {
  display: flex;
  margin-top: 12rpx;
}
.cat-label {
  font-size: 22rpx;
  color: #555;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图例表格（2 列：色块 + 完整名称） */
.legend-table {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  overflow: hidden;
}
.legend-row {
  display: flex;
  align-items: center;
  width: 50%;
  padding: 12rpx 20rpx;
  box-sizing: content-box;
}
.legend-swatch {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  margin-right: 14rpx;
  flex-shrink: 0;
}
.legend-name {
  font-size: 24rpx;
  color: #555;
  white-space: nowrap;
}
</style>
