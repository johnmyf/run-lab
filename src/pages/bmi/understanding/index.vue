<template>
  <view class="page-container">
    <!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
    <SharePoster ref="posterRef" title="跑者如何理解 BMI" color="#1ABC9C" :blocks="posterBlocks" />
    <!-- #endif -->
    <view class="content-wrapper">
      <view class="doc-card" :class="{ 'doc-card-expand': sharing }">
        <template v-for="(sec, i) in UNDERSTANDING_SECTIONS" :key="i">
          <view v-if="sec.type === 'h2'" class="h2">{{ sec.text }}</view>
          <view v-else-if="sec.type === 'h3'" class="h3">{{ sec.text }}</view>
          <view v-else-if="sec.type === 'p'" class="p">
            <text
              v-for="(s, j) in parseBold(sec.text)"
              :key="j"
              :class="{ bold: s.bold }"
              user-select
            >{{ s.text }}</text>
          </view>
          <view v-else-if="sec.type === 'table'" class="tbl">
            <view class="tbl-row tbl-header">
              <text v-for="(h, j) in sec.headers" :key="j" class="tbl-cell tbl-header-cell">{{ h }}</text>
            </view>
            <view v-for="(row, j) in sec.rows" :key="j" class="tbl-row">
              <text v-for="(cell, k) in row" :key="k" class="tbl-cell">{{ cell }}</text>
            </view>
          </view>
          <view v-else-if="sec.type === 'list'" class="list">
            <view v-for="(item, j) in sec.items" :key="j" class="list-item">
              <text class="list-dot">•</text>
              <text class="list-text">
                <text
                  v-for="(s, k) in parseBold(item)"
                  :key="k"
                  :class="{ bold: s.bold }"
                >{{ s.text }}</text>
              </text>
            </view>
          </view>
          <view v-else-if="sec.type === 'divider'" class="divider"></view>
        </template>
      </view>

      <view class="action-buttons" v-if="!sharing">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
import SharePoster from '@/components/share-poster.vue'
// #endif
import { onShareAppMessage } from '@dcloudio/uni-app'
import { UNDERSTANDING_SECTIONS, UNDERSTANDING_SHARE_PREFIX, parseBold } from '@/logic/bmi/understanding'

const sharing = ref(false)

// 分享海报内容（小程序端）：取文档各章节标题
const posterRef = ref(null)
const posterBlocks = computed(() => {
  const list = []
  for (const sec of UNDERSTANDING_SECTIONS) {
    if (sec.type === 'h2' || sec.type === 'h3') {
      list.push({ type: 'text', text: sec.text, fontSize: 30, color: '#2C3E50', bold: true })
    } else if (sec.type === 'p') {
      list.push({ type: 'text', text: sec.text.replace(/\*\*/g, ''), fontSize: 26, color: '#555555' })
    } else if (sec.type === 'table') {
      list.push({
        type: 'table',
        title: (sec.headers || []).join(' / '),
        headerBg: '#1ABC9C',
        headers: (sec.headers || []).map(h => ({ text: h })),
        rows: (sec.rows || []).map(row => ({ cells: row })),
      })
    } else if (sec.type === 'divider') {
      list.push({ type: 'divider' })
    }
    // list 类型跳过（项目符号列表，海报不渲染；SharePoster 高度保护会兜底超限内容）
  }
  return list
})

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
onShareAppMessage(() => ({
  title: '跑者如何理解 BMI — 跑研匠',
  path: '/pages/bmi/understanding/index',
}))
// #endif

async function shareResult() {
  // #ifdef H5
  try {
    uni.showLoading({ title: '生成分享图片...' })
    sharing.value = true
    await new Promise(r => setTimeout(r, 100))
    const pageEl = document.querySelector('.page-container')
    if (!pageEl) {
      uni.hideLoading()
      uni.showToast({ title: '页面元素未找到', icon: 'none' })
      return
    }
    const ok = await captureAndShare(pageEl, { prefix: UNDERSTANDING_SHARE_PREFIX, title: '跑者如何理解 BMI', color: '#1ABC9C' })
    // 先关闭 loading，避免与后续 showToast 共用弹窗产生冲突（showLoading 需与 hideLoading 配对）
    uni.hideLoading()
    if (ok) {
      uni.showToast({ title: '图片已生成', icon: 'success' })
    } else {
      uni.showToast({ title: '分享生成失败', icon: 'none' })
    }
  } catch (e) {
    console.error('分享失败:', e)
    uni.hideLoading()
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif

  // #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
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

.doc-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.doc-card-expand {
  max-height: none;
  overflow: visible;
}

.h2 {
  font-size: 34rpx;
  font-weight: bold;
  color: #1ABC9C;
  margin: 36rpx 0 16rpx;
  line-height: 1.4;
}
.h3 {
  font-size: 30rpx;
  font-weight: bold;
  color: #2C3E50;
  margin: 24rpx 0 12rpx;
  line-height: 1.4;
}
.p {
  font-size: 28rpx;
  color: #555;
  line-height: 1.7;
  margin: 8rpx 0;
}
.bold {
  font-weight: bold;
  color: #2C3E50;
}

.tbl {
  display: flex;
  flex-direction: column;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  overflow: hidden;
  margin: 12rpx 0;
}
.tbl-row {
  display: flex;
  border-bottom: 2rpx solid #f0f0f0;
}
.tbl-row:last-child {
  border-bottom: none;
}
.tbl-header {
  background: #E8F8F5;
}
.tbl-cell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #555;
  padding: 12rpx 8rpx;
}
.tbl-header-cell {
  font-weight: bold;
  color: #2C3E50;
}

.list {
  margin: 8rpx 0;
}
.list-item {
  display: flex;
  align-items: flex-start;
  margin: 8rpx 0;
}
.list-dot {
  color: #1ABC9C;
  font-size: 28rpx;
  margin-right: 12rpx;
  line-height: 1.6;
}
.list-text {
  flex: 1;
  font-size: 27rpx;
  color: #555;
  line-height: 1.7;
}

.divider {
  height: 2rpx;
  background: #e8e8e8;
  margin: 28rpx 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}
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
.btn-share {
  background: #2C3E50;
}
.btn-home {
  background: #3498DB;
}
</style>
