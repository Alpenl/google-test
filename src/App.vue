<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="app">
    <nav class="nav-menu">
      <div class="nav-container">
        <h2 class="nav-title">🧪 MoMax API 测试工具</h2>
        <div class="nav-links">
          <button @click="router.push('/')" :class="{ active: $route.path === '/' }">
            🔐 社交登录
          </button>
          <button @click="router.push('/motion-asset')" :class="{ active: $route.path === '/motion-asset' }">
            🎬 动作资产
          </button>
          <button @click="router.push('/motion-preset')" :class="{ active: $route.path === '/motion-preset' }">
            ⚡ 预置动作
          </button>
          <button @click="router.push('/motion-task')" :class="{ active: $route.path === '/motion-task' }">
            🎯 动作任务
          </button>
          <button @click="router.push('/motion-image3d')" :class="{ active: $route.path === '/motion-image3d' }">
            🖼️ 图片转3D
          </button>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-menu {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-title {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.nav-links {
  display: flex;
  gap: 10px;
}

.nav-links button {
  padding: 10px 20px;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-links button:hover {
  background: #f9f9f9;
  border-color: #4285f4;
  color: #4285f4;
}

.nav-links button.active {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

.main-content {
  padding: 0;
}
</style>
