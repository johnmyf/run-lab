<template>
  <view class="page-container">
    <view class="content">
      <text class="icon-large">📅</text>
      <text class="feature-title">跑步课表</text>
      <text class="feature-desc">正在开发中，敬请期待...</text>

      <view class="coming-soon">
        <text class="pulse-icon">🚧</text>
        <text class="coming-text">功能开发中</text>
      </view>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
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
