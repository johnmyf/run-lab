<template>
  <view class="home">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="header">
      <image class="header-icon" src="/static/run-lab-icon.png" mode="aspectFit" />
      <text class="header-title">跑研匠</text>
    </view>

    <view class="welcome-section">
      <text class="welcome-text">欢迎回来，开始今天的跑步之旅！</text>
    </view>

    <text class="section-title">功能面板</text>

    <view class="grid-container">
      <view
        v-for="item in menuItems"
        :key="item.id"
        class="grid-item"
        :class="item.colorClass"
        @click="goToPage(item)"
      >
        <text class="icon">{{ item.icon }}</text>
        <text class="title">{{ item.title }}</text>
      </view>
    </view>

    <!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
    <CustomTabBar active-index="0" />
    <!-- #endif -->
  </view>
</template>

<script setup>
import { statusBarHeight } from '@/utils/status-bar'

// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
import CustomTabBar from '@/custom-tab-bar/index.vue'
// #endif

const menuItems = [
  { id: 1, title: '跑力值计算', icon: '⚡', colorClass: 'blue', path: '/pages/running-power/index' },
  { id: 2, title: '成绩预测', icon: '🏆', colorClass: 'red', path: '/pages/performance-prediction/index' },
  { id: 3, title: '等级查询', icon: '🥇', colorClass: 'orange', path: '/pages/level-query/index' },
  { id: 4, title: '步频步幅计算', icon: '👟', colorClass: 'indigo', path: '/pages/cadence-stride/index' },
  { id: 5, title: '配速计算器', icon: '⏱️', colorClass: 'cyan', path: '/pages/pace-calculator/index' },
  { id: 6, title: '完赛时间计算', icon: '🏁', colorClass: 'pink', path: '/pages/finish-time/index' },
  { id: 7, title: '心率计算', icon: '❤️', colorClass: 'green', path: '/pages/heart-rate/index' },
  { id: 8, title: '体重建议', icon: '⚖️', colorClass: 'teal', path: '/pages/bmi/index' },
  { id: 9, title: '跑步课表', icon: '📅', colorClass: 'purple', path: '/pages/training-schedule/index' }
]

const goToPage = (item) => {
  if (!item.path) {
    uni.showToast({ title: '功能开发中', icon: 'none' })
    return
  }
  // tabBar 页面需要使用 switchTab 跳转
  const tabBarPages = ['/pages/index/index', '/pages/achievement/index']
  if (tabBarPages.includes(item.path)) {
    uni.switchTab({ url: item.path })
  } else {
    uni.navigateTo({ url: item.path })
  }
}
</script>

<style scoped>
.status-bar {
  background: #4DB8A0;
}

.home {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.header {
  background: #4DB8A0;
  height: 160rpx;
  display: flex;
  align-items: center;
  padding: 0 60rpx;
}

.header-title {
  color: #FFFFFF;
  font-size: 48rpx;
  font-weight: bold;
}

.header-icon {
  width: 96rpx;
  height: 96rpx;
  margin-right: 16rpx;
}

.welcome-section {
  background: #FFFFFF;
  margin: 40rpx 30rpx;
  padding: 36rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.welcome-text {
  color: #2C3E50;
  font-size: 28rpx;
}

.section-title {
  color: #2C3E50;
  font-size: 36rpx;
  font-weight: bold;
  margin: 0 30rpx 30rpx 30rpx;
  display: block;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  padding: 0 30rpx;
}

.grid-item {
  height: 232rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.grid-item .icon {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.grid-item .title {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: bold;
  text-align: center;
}

.grid-item.blue { background: #3498DB; }
.grid-item.red { background: #E74C3C; }
.grid-item.green { background: #2ECC71; }
.grid-item.purple { background: #9B59B6; }
.grid-item.teal { background: #1ABC9C; }
.grid-item.orange { background: #F39C12; }
.grid-item.indigo { background: #5C6BC0; }
.grid-item.cyan { background: #00BCD4; }
.grid-item.pink { background: #E91E63; }
</style>
