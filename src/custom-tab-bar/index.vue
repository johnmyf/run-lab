<template>
  <view class="custom-tab-bar">
    <view
      v-for="(item, index) in tabList"
      :key="item.pagePath"
      class="tab-bar-item"
      :class="{ active: index === activeIndex }"
      @click="switchTab(item)"
    >
      <text class="tab-bar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
// 自定义 tabBar：微信小程序端替代原生 tabBar，放大"首页/我的"字号
// 使用方式：在 tabBar 页面显式引入，并通过 active-index 指定当前高亮项
const props = defineProps({
  activeIndex: {
    type: Number,
    default: 0
  }
})

const tabList = [
  { pagePath: 'pages/index/index', text: '首页' },
  { pagePath: 'pages/achievement/index', text: '我的' }
]

function switchTab(item) {
  const pages = getCurrentPages()
  const currentRoute = pages[pages.length - 1]?.route
  if (currentRoute === item.pagePath) return
  uni.switchTab({ url: '/' + item.pagePath })
}
</script>

<style scoped>
.custom-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  background-color: #2C3E50;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-bar-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
}

.tab-bar-text {
  font-size: 28rpx;
  color: #7F8C8D;
}

.tab-bar-item.active .tab-bar-text {
  color: #FFFFFF;
}
</style>
