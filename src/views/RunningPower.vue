<template>
  <div class="page-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <span>←</span>
      </div>
      <h1 class="page-title">跑力值计算</h1>
    </div>

    <div class="content">
      <div class="icon-large">⚡</div>
      <h2 class="feature-title">跑力值计算</h2>
      <p class="feature-desc">正在开发中，敬请期待...</p>

      <div class="coming-soon">
        <div class="pulse">🚧</div>
        <p>功能开发中</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #3498DB;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: relative;
}

.back-button {
  font-size: 28px;
  color: #FFFFFF;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.back-button:hover {
  transform: scale(1.1);
}

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
}

.icon-large {
  font-size: 80px;
  margin-bottom: 30px;
}

.feature-title {
  color: #2C3E50;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.feature-desc {
  color: #7F8C8D;
  font-size: 16px;
  margin-bottom: 40px;
}

.coming-soon {
  text-align: center;
}

.coming-soon .pulse {
  font-size: 60px;
  animation: pulse 2s ease-in-out infinite;
}

.coming-soon p {
  color: #7F8C8D;
  font-size: 18px;
  margin-top: 20px;
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