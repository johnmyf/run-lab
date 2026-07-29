<template>
  <view class="page-container">
    <view class="header">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">完赛时间计算</text>
    </view>

    <view class="content">
      <text class="icon-large">🏁</text>
      <text class="feature-title">完赛时间计算</text>
      <text class="feature-desc">正在开发中，敬请期待...</text>

      <view class="coming-soon">
        <text class="pulse-icon">🚧</text>
        <text class="coming-text">功能开发中</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #E91E63;
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

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160rpx);
  padding: 60rpx 40rpx;
}

.icon-large {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  animation: pulse 2s ease-in-out infinite;
}

.feature-title {
  color: #2C3E50;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.feature-desc {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 40rpx;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9f9f9;
  padding: 40rpx 60rpx;
  border-radius: 16rpx;
}

.pulse-icon {
  font-size: 64rpx;
  animation: pulse 2s ease-in-out infinite;
}

.coming-text {
  color: #bbb;
  font-size: 24rpx;
  margin-top: 16rpx;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
