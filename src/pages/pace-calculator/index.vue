<template>
  <view class="page">
    <view class="header" style="background: #00BCD4;">
      <view class="back-btn" @click="uni.navigateBack()">
        <text class="back-text">←</text>
      </view>
      <text class="header-title">配速计算器</text>
    </view>
    <view class="content">
      <text class="placeholder-icon">⏱️</text>
      <text class="placeholder-text">功能开发中，敬请期待</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  height: 160rpx;
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
.back-text {
  color: #FFFFFF;
  font-size: 40rpx;
}
.header-title {
  color: #FFFFFF;
  font-size: 40rpx;
  font-weight: bold;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}
.placeholder-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}
.placeholder-text {
  color: #95A5A6;
  font-size: 28rpx;
}
</style>
