<template>
  <div class="home">
    <header class="header">
      <h1>跑步工具</h1>
    </header>

    <div class="welcome-section">
      <p>欢迎回来，开始今天的跑步之旅！</p>
    </div>

    <h2 class="section-title">功能面板</h2>

    <div class="grid-container">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="grid-item"
        :class="item.colorClass"
        @click="goToPage(item.path)"
      >
        <div class="icon">{{ item.icon }}</div>
        <div class="title">{{ item.title }}</div>
      </div>
    </div>

    <footer class="footer">
      <div class="nav-item active">首页</div>
      <div class="nav-item">我的</div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const menuItems = [
  { id: 1, title: '跑力值计算', icon: '⚡', colorClass: 'blue', path: '/running-power' },
  { id: 2, title: '成绩预测', icon: '🏆', colorClass: 'red', path: '/performance-prediction' },
  { id: 3, title: '心率计算', icon: '❤️', colorClass: 'green', path: '/heart-rate' },
  { id: 4, title: '跑步课表', icon: '📅', colorClass: 'purple', path: '/training-schedule' },
  { id: 5, title: '论坛', icon: '💬', colorClass: 'orange', path: '/forum' },
  { id: 6, title: '成就体系', icon: '🏅', colorClass: 'teal', path: '/achievement' },
  { id: 7, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' },
  { id: 8, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' },
  { id: 9, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' }
]

const goToPage = (path) => {
  if (path) {
    router.push(path)
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  background: #2C3E50;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 30px;
}

.header h1 {
  color: #FFFFFF;
  font-size: 24px;
  font-weight: bold;
}

.welcome-section {
  background: #FFFFFF;
  margin: 20px 15px;
  padding: 18px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.welcome-section p {
  color: #2C3E50;
  font-size: 14px;
}

.section-title {
  color: #2C3E50;
  font-size: 18px;
  font-weight: bold;
  margin: 0 15px 15px 15px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 15px;
}

.grid-item {
  height: 116px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.grid-item .icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.grid-item .title {
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.grid-item.blue { background: #3498DB; }
.grid-item.red { background: #E74C3C; }
.grid-item.green { background: #2ECC71; }
.grid-item.purple { background: #9B59B6; }
.grid-item.orange { background: #F39C12; }
.grid-item.teal { background: #1ABC9C; }
.grid-item.gray {
  background: #95A5A6;
  cursor: not-allowed;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2C3E50;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.nav-item {
  color: #7F8C8D;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.nav-item.active {
  color: #FFFFFF;
}

.nav-item:hover {
  color: #FFFFFF;
}
</style>