<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { motionPresetApi } from '../api/motion'

const loading = ref(false)
const presets = ref<any[]>([])
const popularPresets = ref<any[]>([])
const latestPresets = ref<any[]>([])
const statistics = ref<any>({})
const message = ref('')
const searchKeyword = ref('')
const selectedTaskType = ref('')

// 加载预置动作列表
const loadPresets = async () => {
  try {
    loading.value = true
    const response = await motionPresetApi.list({ pageNum: 1, pageSize: 20 })
    if (response.code === 200) {
      presets.value = response.data?.records || []
      message.value = `✅ 加载预置动作成功，共 ${presets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载预置动作失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 按类型加载
const loadByType = async (taskType: string) => {
  try {
    loading.value = true
    selectedTaskType.value = taskType
    const response = await motionPresetApi.listByType(taskType, { pageNum: 1, pageSize: 20 })
    if (response.code === 200) {
      presets.value = response.data?.records || []
      message.value = `✅ 加载类型 ${getTaskTypeText(taskType)} 的预置动作成功，共 ${presets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('按类型加载失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 加载热门预置动作
const loadPopular = async () => {
  try {
    loading.value = true
    const response = await motionPresetApi.popular(10)
    if (response.code === 200) {
      popularPresets.value = response.data || []
      message.value = `✅ 加载热门预置动作成功，共 ${popularPresets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载热门预置动作失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 加载最新预置动作
const loadLatest = async () => {
  try {
    loading.value = true
    const response = await motionPresetApi.latest(10)
    if (response.code === 200) {
      latestPresets.value = response.data || []
      message.value = `✅ 加载最新预置动作成功，共 ${latestPresets.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载最新预置动作失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    loading.value = true
    const response = await motionPresetApi.statisticsByType()
    if (response.code === 200) {
      statistics.value = response.data || {}
      message.value = '✅ 加载统计数据成功'
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 搜索预置动作
const searchPresets = async () => {
  if (!searchKeyword.value.trim()) {
    message.value = '⚠️ 请输入搜索关键词'
    return
  }

  try {
    loading.value = true
    const response = await motionPresetApi.search(searchKeyword.value, { pageNum: 1, pageSize: 20 })
    if (response.code === 200) {
      presets.value = response.data?.records || []
      message.value = `✅ 搜索成功，找到 ${presets.value.length} 条结果`
    } else {
      message.value = '❌ 搜索失败：' + response.msg
    }
  } catch (error: any) {
    console.error('搜索预置动作失败:', error)
    message.value = '❌ 搜索失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = async (id: number) => {
  try {
    loading.value = true
    const response = await motionPresetApi.detail(id)
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

onMounted(() => {
  loadPresets()
  loadStatistics()
})
</script>

<template>
  <div class="container">
    <h1>⚡ 预置动作管理测试</h1>

    <!-- 消息提示 -->
    <div v-if="message" class="message" :class="{ error: message.includes('❌'), warning: message.includes('⚠️') }">
      {{ message }}
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="输入关键词搜索预置动作..."
        @keyup.enter="searchPresets"
      />
      <button @click="searchPresets" :disabled="loading">🔍 搜索</button>
    </div>

    <!-- 操作按钮组 -->
    <div class="actions">
      <button @click="loadPresets" :disabled="loading">
        🔄 加载全部
      </button>
      <button @click="loadByType('1')" :disabled="loading">
        🎥 视频动捕
      </button>
      <button @click="loadByType('2')" :disabled="loading">
        📝 文本生成
      </button>
      <button @click="loadByType('3')" :disabled="loading">
        🎨 模型渲染
      </button>
      <button @click="loadPopular" :disabled="loading">
        🔥 热门预置
      </button>
      <button @click="loadLatest" :disabled="loading">
        ⏰ 最新预置
      </button>
      <button @click="loadStatistics" :disabled="loading">
        📊 统计数据
      </button>
    </div>

    <!-- 统计数据 -->
    <div v-if="Object.keys(statistics).length > 0" class="statistics">
      <h3>📊 预置动作统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总数</div>
          <div class="stat-value">{{ statistics.total || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">视频动捕</div>
          <div class="stat-value">{{ statistics.video || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">文本生成</div>
          <div class="stat-value">{{ statistics.text || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">模型渲染</div>
          <div class="stat-value">{{ statistics.render || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 预置动作列表 -->
    <div class="presets-section">
      <h3>📦 预置动作列表 <span v-if="selectedTaskType">({{ getTaskTypeText(selectedTaskType) }})</span></h3>
      <div v-if="presets.length === 0" class="empty">暂无数据</div>
      <div v-else class="preset-list">
        <div v-for="preset in presets" :key="preset.id" class="preset-card">
          <div class="preset-header">
            <span class="preset-id">ID: {{ preset.id }}</span>
            <span class="preset-type">{{ getTaskTypeText(preset.taskType) }}</span>
          </div>
          <div class="preset-body">
            <p><strong>动作资产 ID:</strong> {{ preset.assetId }}</p>
            <p><strong>资产名称:</strong> {{ preset.assetName || '-' }}</p>
            <p><strong>可见性:</strong> {{ preset.visibility === '1' ? '公开' : '私有' }}</p>
            <p><strong>创建时间:</strong> {{ preset.createTime }}</p>
          </div>
          <div class="preset-actions">
            <button @click="viewDetail(preset.id)" :disabled="loading">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门预置 -->
    <div v-if="popularPresets.length > 0" class="popular-section">
      <h3>🔥 热门预置动作</h3>
      <div class="preset-list">
        <div v-for="preset in popularPresets" :key="preset.id" class="preset-card small">
          <div class="preset-header">
            <span class="preset-id">ID: {{ preset.id }}</span>
            <span class="preset-type">{{ getTaskTypeText(preset.taskType) }}</span>
          </div>
          <div class="preset-body">
            <p><strong>资产名称:</strong> {{ preset.assetName || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新预置 -->
    <div v-if="latestPresets.length > 0" class="latest-section">
      <h3>⏰ 最新预置动作</h3>
      <div class="preset-list">
        <div v-for="preset in latestPresets" :key="preset.id" class="preset-card small">
          <div class="preset-header">
            <span class="preset-id">ID: {{ preset.id }}</span>
            <span class="preset-type">{{ getTaskTypeText(preset.taskType) }}</span>
          </div>
          <div class="preset-body">
            <p><strong>资产名称:</strong> {{ preset.assetName || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 接口说明 -->
    <div class="info-section">
      <h3>📝 接口说明</h3>
      <ul>
        <li><code>GET /web/motion/preset/list</code> - 获取公开的预置动作列表</li>
        <li><code>GET /web/motion/preset/detail/{id}</code> - 获取预置动作详情</li>
        <li><code>GET /web/motion/preset/listByType/{taskType}</code> - 按类型获取预置动作</li>
        <li><code>GET /web/motion/preset/popular</code> - 获取热门预置动作</li>
        <li><code>GET /web/motion/preset/latest</code> - 获取最新预置动作</li>
        <li><code>GET /web/motion/preset/statisticsByType</code> - 按类型统计预置动作</li>
        <li><code>GET /web/motion/preset/search</code> - 搜索预置动作</li>
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

.message.warning {
  background: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-section input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.search-section button {
  padding: 12px 24px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.search-section button:hover {
  background: #357ae8;
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

.statistics {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #4285f4;
}

.presets-section,
.popular-section,
.latest-section {
  margin-bottom: 30px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.preset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.preset-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s;
}

.preset-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preset-card.small {
  padding: 10px;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.preset-id {
  font-weight: bold;
  color: #333;
}

.preset-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.preset-body {
  margin-bottom: 10px;
}

.preset-body p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.preset-actions button {
  width: 100%;
  padding: 8px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
}

.preset-actions button:hover {
  background: #357ae8;
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
