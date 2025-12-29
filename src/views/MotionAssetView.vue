<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { motionAssetApi } from '../api/motion'

const loading = ref(false)
const activeTab = ref<'my' | 'public'>('my')
const myAssets = ref<any[]>([])
const publicAssets = ref<any[]>([])
const message = ref('')
const isLoggedIn = ref(false)

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('access_token')
  isLoggedIn.value = !!token
  return !!token
}

// 加载我的资产
const loadMyAssets = async () => {
  try {
    loading.value = true
    const response = await motionAssetApi.list({ pageNum: 1, pageSize: 10 })
    if (response.code === 200) {
      myAssets.value = response.data?.records || []
      message.value = `✅ 加载我的资产成功，共 ${myAssets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载我的资产失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 加载公开资产
const loadPublicAssets = async () => {
  try {
    loading.value = true
    const response = await motionAssetApi.list({
      pageNum: 1,
      pageSize: 10,
      visibility: '1' // 查询公开资产
    })
    if (response.code === 200) {
      publicAssets.value = response.data?.records || []
      message.value = `✅ 加载公开资产成功，共 ${publicAssets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载公开资产失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 更新可见性
const updateVisibility = async (id: number, visibility: string) => {
  try {
    loading.value = true
    const response = await motionAssetApi.updateVisibility(id, visibility)
    if (response.code === 200) {
      message.value = '✅ 更新可见性成功'
      loadMyAssets()
    } else {
      message.value = '❌ 更新失败：' + response.msg
    }
  } catch (error: any) {
    console.error('更新可见性失败:', error)
    message.value = '❌ 更新失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 删除资产
const deleteAsset = async (id: number) => {
  if (!confirm('确定要删除该资产吗？')) return

  try {
    loading.value = true
    const response = await motionAssetApi.delete(id)
    if (response.code === 200) {
      message.value = '✅ 删除成功'
      loadMyAssets()
    } else {
      message.value = '❌ 删除失败：' + response.msg
    }
  } catch (error: any) {
    console.error('删除资产失败:', error)
    message.value = '❌ 删除失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = async (id: number) => {
  try {
    loading.value = true
    const response = await motionAssetApi.detail(id)
    if (response.code === 200) {
      alert(JSON.stringify(response.data, null, 2))
      message.value = '✅ 获取详情成功'
    } else {
      message.value = '❌ 获取详情失败：' + response.msg
    }
  } catch (error: any) {
    console.error('获取详情失败:', error)
    message.value = '❌ 获取详情失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 获取任务类型文本
const getTaskTypeText = (type: string) => {
  const map: any = { '1': '视频动捕', '2': '文本生成', '3': '模型渲染' }
  return map[type] || '未知'
}

// 获取可见性文本
const getVisibilityText = (visibility: string) => {
  return visibility === '1' ? '公开' : '私有'
}

onMounted(() => {
  checkLoginStatus()
  if (isLoggedIn.value) {
    loadPublicAssets()
  }
})
</script>

<template>
  <div class="container">
    <h1>🎬 动作资产管理测试</h1>

    <!-- 登录状态提示 -->
    <div class="login-status">
      <div v-if="isLoggedIn" class="status-card logged-in">
        <span class="status-icon">✅</span>
        <span>已登录</span>
      </div>
      <div v-else class="status-card logged-out">
        <span class="status-icon">⚠️</span>
        <span>未登录 - 请先前往<router-link to="/social-login">登录页面</router-link>登录</span>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message" :class="{ error: message.includes('❌') }">
      {{ message }}
    </div>

    <!-- 标签页切换 -->
    <div class="tabs">
      <button
        @click="activeTab = 'my'"
        :class="{ active: activeTab === 'my' }"
      >
        我的资产
      </button>
      <button
        @click="activeTab = 'public'"
        :class="{ active: activeTab === 'public' }"
      >
        公开资产
      </button>
    </div>

    <!-- 操作按钮组 -->
    <div class="actions">
      <button @click="loadMyAssets" :disabled="loading">
        🔄 加载我的资产
      </button>
      <button @click="loadPublicAssets" :disabled="loading">
        🌐 加载公开资产
      </button>
    </div>

    <!-- 我的资产列表 -->
    <div v-if="activeTab === 'my'" class="assets-section">
      <h3>📦 我的资产列表</h3>
      <div v-if="myAssets.length === 0" class="empty">暂无数据</div>
      <div v-else class="asset-list">
        <div v-for="asset in myAssets" :key="asset.id" class="asset-card">
          <div class="asset-header">
            <span class="asset-id">ID: {{ asset.id }}</span>
            <span class="asset-type">{{ getTaskTypeText(asset.taskType) }}</span>
            <span class="asset-visibility">{{ getVisibilityText(asset.visibility) }}</span>
          </div>
          <div class="asset-body">
            <p><strong>资产名称:</strong> {{ asset.assetName || '-' }}</p>
            <p><strong>资产编号:</strong> {{ asset.assetNo || '-' }}</p>
            <p><strong>描述:</strong> {{ asset.description || '-' }}</p>
            <p><strong>创建时间:</strong> {{ asset.createTime }}</p>
          </div>
          <div class="asset-actions">
            <button @click="viewDetail(asset.id)" :disabled="loading">
              查看详情
            </button>
            <button
              @click="updateVisibility(asset.id, asset.visibility === '1' ? '0' : '1')"
              :disabled="loading"
            >
              {{ asset.visibility === '1' ? '设为私有' : '设为公开' }}
            </button>
            <button @click="deleteAsset(asset.id)" :disabled="loading" class="delete-btn">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 公开资产列表 -->
    <div v-if="activeTab === 'public'" class="assets-section">
      <h3>🌐 公开资产列表</h3>
      <div v-if="publicAssets.length === 0" class="empty">暂无数据</div>
      <div v-else class="asset-list">
        <div v-for="asset in publicAssets" :key="asset.id" class="asset-card">
          <div class="asset-header">
            <span class="asset-id">ID: {{ asset.id }}</span>
            <span class="asset-type">{{ getTaskTypeText(asset.taskType) }}</span>
          </div>
          <div class="asset-body">
            <p><strong>资产名称:</strong> {{ asset.assetName || '-' }}</p>
            <p><strong>资产编号:</strong> {{ asset.assetNo || '-' }}</p>
            <p><strong>用户 ID:</strong> {{ asset.userId }}</p>
            <p><strong>创建时间:</strong> {{ asset.createTime }}</p>
          </div>
          <div class="asset-actions">
            <button @click="viewDetail(asset.id)" :disabled="loading">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 接口说明 -->
    <div class="info-section">
      <h3>📝 接口说明</h3>
      <ul>
        <li><code>GET /web/motion/asset/list</code> - 统一查询资产（未登录查公开，已登录查个人）</li>
        <li><code>GET /web/motion/asset/list?visibility=1</code> - 查询公开资产</li>
        <li><code>GET /web/motion/asset/detail/{id}</code> - 查询资产详情</li>
        <li><code>PUT /web/motion/asset/updateVisibility/{id}/{visibility}</code> - 更新可见性（需登录）</li>
        <li><code>DELETE /web/motion/asset/delete/{id}</code> - 删除资产（需登录）</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.login-status {
  margin-bottom: 20px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 10px;
  font-weight: 500;
}

.status-card.logged-in {
  background: #d1e7dd;
  color: #0f5132;
  border: 1px solid #badbcc;
}

.status-card.logged-out {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffe69c;
}

.status-icon {
  font-size: 20px;
}

.status-card a {
  color: #0d6efd;
  text-decoration: underline;
}

.message {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 5px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.tabs button.active {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.actions button {
  padding: 10px 20px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.actions button:hover {
  background: #357ae8;
}

.actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.assets-section {
  margin-bottom: 30px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.asset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.asset-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s;
}

.asset-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.asset-id {
  font-weight: bold;
  color: #333;
}

.asset-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.asset-visibility {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.asset-body {
  margin-bottom: 10px;
}

.asset-body p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.asset-actions {
  display: flex;
  gap: 10px;
}

.asset-actions button {
  flex: 1;
  padding: 8px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
}

.asset-actions button:hover {
  background: #357ae8;
}

.asset-actions button.delete-btn {
  background: #e63946;
}

.asset-actions button.delete-btn:hover {
  background: #d62828;
}

.info-section {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-section ul {
  margin-top: 10px;
  line-height: 2;
}

.info-section code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
</style>
