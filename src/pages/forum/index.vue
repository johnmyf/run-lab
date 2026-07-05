<template>
  <view class="page-container">
    <view class="header">
      <view class="back-button" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">论坛</text>
    </view>

    <view class="content">
      <text class="icon-large">💬</text>
      <text class="feature-title">论坛</text>
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
  background: #F39C12;
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
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160rpx);
  padding: 80rpx 40rpx;
}

.icon-large {
  font-size: 160rpx;
  margin-bottom: 60rpx;
}

.feature-title {
  color: #2C3E50;
  font-size: 56rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.feature-desc {
  color: #7F8C8D;
  font-size: 32rpx;
  margin-bottom: 80rpx;
}

.coming-soon {
  text-align: center;
}

.pulse-icon {
  font-size: 120rpx;
  animation: pulse 2s ease-in-out infinite;
}

.coming-text {
  color: #7F8C8D;
  font-size: 36rpx;
  margin-top: 40rpx;
  display: block;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
