<template>
  <view class="app-container">
    <!-- uni-app 自动根据 pages.json 渲染当前页面 -->
  </view>
</template>

<script setup>
</script>

<style>
/* 全局样式 — 替代原 style.css */
/* 注意：微信小程序 WXSS 不支持通配符选择器 *，用 page（小程序根元素）+ body（H5 根元素）替代 */
page,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* #ifdef H5 */
/* 放大 H5 端原生 tabBar 文字字号（与微信小程序自定义 tabBar 一致） */
.uni-tabbar__label {
  font-size: 28rpx !important;
}
/* #endif */
</style>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>
