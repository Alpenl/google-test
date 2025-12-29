<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { motionImage3dApi, type CreateImage3DTaskBo } from '../api/motion'
import { ossApi, type SysOssUploadVo } from '../api/oss'

const loading = ref(false)
const message = ref('')
const taskNo = ref('')
const taskStatus = ref<any>(null)
const taskList = ref<any[]>([])
const isLoggedIn = ref(false)

// 图片上传相关状态
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadedImage = ref<SysOssUploadVo | null>(null)
const imagePreviewUrl = ref('')
const imageFileRef = ref<HTMLInputElement | null>(null)

// 提交表单
const submitForm = ref({
  imageOssId: '' as string | number,
  meshProvider: 'hunyuan3d',
  remark: ''
})

// 列表查询
const listQuery = ref({
  pageNum: 1,
  pageSize: 10,
  status: ''
})

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('access_token')
  isLoggedIn.value = !!token
  return !!token
}

const canSubmit = computed(() => {
  return !!submitForm.value.imageOssId && !loading.value && !isUploading.value
})

// 选择图片文件
const selectImageFile = () => {
  imageFileRef.value?.click()
}

// 处理图片文件选择
const handleImageFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.value = '❌ 请上传 JPG/PNG/WebP 格式的图片'
    return
  }

  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    message.value = '❌ 图片文件大小不能超过 20MB'
    return
  }

  await uploadImage(file)
  target.value = ''
}

// 上传图片
const uploadImage = async (file: File) => {
  try {
    isUploading.value = true
    uploadProgress.value = 0
    message.value = '📤 正在上传图片...'

    imagePreviewUrl.value = URL.createObjectURL(file)

    const result = await ossApi.directUpload(
      file,
      { moduleName: 'momax-image3d', directoryPath: '/momax/image3d/input' },
      (percent) => {
        uploadProgress.value = percent
      }
    )

    uploadedImage.value = result
    submitForm.value.imageOssId = result.ossId
    message.value = `✅ 图片上传成功！文件名: ${result.originalName || result.fileName}`
  } catch (error: any) {
    console.error('上传图片失败:', error)
    message.value = '❌ 上传失败：' + (error.message || error.toString())
    clearImage()
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 清理图片
const clearImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = ''
  uploadedImage.value = null
  submitForm.value.imageOssId = ''
}

// 提交任务
const submitTask = async () => {
  if (!submitForm.value.imageOssId) {
    message.value = '❌ 请先上传图片文件'
    return
  }

  try {
    loading.value = true
    const params: CreateImage3DTaskBo = {
      imageOssId: submitForm.value.imageOssId,
      meshProvider: submitForm.value.meshProvider || undefined,
      remark: submitForm.value.remark || undefined
    }
    const response = await motionImage3dApi.submit(params)
    if (response.code === 200) {
      taskNo.value = response.data
      message.value = `✅ 图片转3D任务创建成功，任务编号: ${response.data}`
      clearImage()
    } else {
      message.value = '❌ 创建失败：' + response.msg
    }
  } catch (error: any) {
    console.error('提交任务失败:', error)
    message.value = '❌ 创建失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 查询任务状态
const queryTaskStatus = async () => {
  if (!taskNo.value) {
    message.value = '❌ 请输入任务编号'
    return
  }

  try {
    loading.value = true
    const response = await motionImage3dApi.progress(taskNo.value)
    if (response.code === 200) {
      taskStatus.value = response.data
      message.value = '✅ 查询成功'
    } else {
      message.value = '❌ 查询失败：' + response.msg
      taskStatus.value = null
    }
  } catch (error: any) {
    console.error('查询任务失败:', error)
    message.value = '❌ 查询失败：' + (error.message || error.toString())
    taskStatus.value = null
  } finally {
    loading.value = false
  }
}

// 取消任务
const cancelTask = async () => {
  if (!taskNo.value) {
    message.value = '❌ 请输入任务编号'
    return
  }

  try {
    loading.value = true
    const response = await motionImage3dApi.cancel(taskNo.value)
    if (response.code === 200) {
      message.value = '✅ 取消任务成功'
    } else {
      message.value = '❌ 取消失败：' + response.msg
    }
  } catch (error: any) {
    console.error('取消任务失败:', error)
    message.value = '❌ 取消失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 重试任务
const retryTask = async () => {
  if (!taskNo.value) {
    message.value = '❌ 请输入任务编号'
    return
  }

  try {
    loading.value = true
    const response = await motionImage3dApi.retry(taskNo.value)
    if (response.code === 200) {
      taskNo.value = response.data
      message.value = `✅ 重试成功，新任务编号: ${response.data}`
    } else {
      message.value = '❌ 重试失败：' + response.msg
    }
  } catch (error: any) {
    console.error('重试任务失败:', error)
    message.value = '❌ 重试失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 查询任务列表
const loadTaskList = async () => {
  try {
    loading.value = true
    const response = await motionImage3dApi.pageTasks({
      pageNum: listQuery.value.pageNum,
      pageSize: listQuery.value.pageSize,
      status: listQuery.value.status || undefined
    })
    if (response.code === 200) {
      taskList.value = response.data?.records || []
      message.value = `✅ 加载任务列表成功，共 ${taskList.value.length} 条`
    } else {
      message.value = '❌ 加载失败：' + response.msg
    }
  } catch (error: any) {
    console.error('加载任务列表失败:', error)
    message.value = '❌ 加载失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

const getTaskStatusText = (status: string) => {
  const map: any = {
    '0': '待处理',
    '1': '处理中',
    '2': '已完成',
    '3': '失败',
    '4': '已取消'
  }
  return map[status] || '未知'
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <div class="container">
    <h1>🖼️ 图片转3D任务测试</h1>

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

    <!-- 提交任务 -->
    <div class="form-section">
      <h3>📤 提交图片转3D任务</h3>
      <div class="upload-section">
        <input ref="imageFileRef" type="file" accept="image/*" @change="handleImageFileChange" class="hidden-input" />

        <div v-if="!uploadedImage" class="upload-area" @click="selectImageFile">
          <div class="upload-icon">🖼️</div>
          <div class="upload-text" :class="{ uploading: isUploading }">
            {{ isUploading ? '正在上传...' : '点击上传图片' }}
          </div>
          <div class="upload-hint">支持 JPG/PNG/WebP，最大 20MB</div>
          <div v-if="isUploading" class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>

        <div v-else class="image-preview">
          <img :src="imagePreviewUrl" alt="preview" class="preview-image" />
          <div class="image-info">
            <span class="image-name">{{ uploadedImage?.originalName || uploadedImage?.fileName }}</span>
            <button class="remove-btn" @click="clearImage">×</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>网格生成服务商</label>
        <select v-model="submitForm.meshProvider">
          <option value="hunyuan3d">hunyuan3d</option>
          <option value="rodin">rodin</option>
        </select>
      </div>
      <div class="form-group">
        <label>备注（可选）</label>
        <textarea v-model="submitForm.remark" rows="3" placeholder="输入备注信息"></textarea>
      </div>

      <button class="submit-btn" @click="submitTask" :disabled="!canSubmit">
        🚀 提交任务
      </button>
    </div>

    <!-- 查询/操作 -->
    <div class="form-section">
      <h3>🔍 查询与操作任务</h3>
      <div class="form-group">
        <label>任务编号</label>
        <input v-model="taskNo" placeholder="请输入任务编号" />
      </div>
      <div class="actions">
        <button class="action-btn" @click="queryTaskStatus" :disabled="loading">查询进度</button>
        <button class="action-btn" @click="cancelTask" :disabled="loading">取消任务</button>
        <button class="action-btn" @click="retryTask" :disabled="loading">重试任务</button>
      </div>
    </div>

    <!-- 任务详情 -->
    <div v-if="taskStatus" class="task-detail">
      <h3>📊 任务详情</h3>
      <div class="detail-card">
        <div class="detail-row">
          <span class="label">任务编号:</span>
          <span class="value">{{ taskStatus.taskNo }}</span>
        </div>
        <div class="detail-row">
          <span class="label">任务状态:</span>
          <span class="value task-status" :class="'status-' + taskStatus.status">
            {{ getTaskStatusText(taskStatus.status) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">进度:</span>
          <span class="value">{{ taskStatus.progress }}%</span>
        </div>
        <div class="detail-row">
          <span class="label">阶段:</span>
          <span class="value">{{ taskStatus.stage || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">消息:</span>
          <span class="value">{{ taskStatus.message || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">创建时间:</span>
          <span class="value">{{ taskStatus.createTime || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="form-section">
      <h3>📄 任务列表</h3>
      <div class="list-filters">
        <div class="form-group">
          <label>状态筛选</label>
          <select v-model="listQuery.status">
            <option value="">全部</option>
            <option value="0">待处理</option>
            <option value="1">处理中</option>
            <option value="2">已完成</option>
            <option value="3">失败</option>
            <option value="4">已取消</option>
          </select>
        </div>
        <div class="form-group">
          <label>每页数量</label>
          <input v-model.number="listQuery.pageSize" type="number" min="1" max="50" />
        </div>
        <button class="action-btn" @click="loadTaskList" :disabled="loading">加载列表</button>
      </div>
      <div v-if="taskList.length === 0" class="empty">暂无数据</div>
      <div v-else class="task-list">
        <div v-for="task in taskList" :key="task.id" class="task-card">
          <div class="task-card-header">
            <span class="task-no">{{ task.taskNo }}</span>
            <span class="task-status" :class="'status-' + task.status">
              {{ getTaskStatusText(task.status) }}
            </span>
          </div>
          <div class="task-card-body">
            <p><strong>进度:</strong> {{ task.progress }}%</p>
            <p><strong>创建时间:</strong> {{ task.createTime || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 接口说明 -->
    <div class="info-section">
      <h3>📝 接口说明</h3>
      <ul>
        <li><code>POST /resource/oss/getPresignedUrl</code> - 获取预签名上传URL</li>
        <li><code>PUT {presignedUrl}</code> - 直传图片到OSS</li>
        <li><code>POST /resource/oss/confirmDirectUpload</code> - 确认上传完成</li>
        <li><code>POST /web/motion/image3d/submit</code> - 提交图片转3D任务（需登录）</li>
        <li><code>GET /web/motion/image3d/progress/{taskNo}</code> - 查询任务进度（需登录）</li>
        <li><code>POST /web/motion/image3d/cancel/{taskNo}</code> - 取消任务（需登录）</li>
        <li><code>POST /web/motion/image3d/retry/{taskNo}</code> - 重试任务（需登录）</li>
        <li><code>GET /web/motion/image3d/pageTasks</code> - 查询任务列表（需登录）</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1000px;
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

.form-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}

.upload-section {
  margin-bottom: 15px;
}

.hidden-input {
  display: none;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #4285f4;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4285f4;
  border-radius: 3px;
  transition: width 0.3s;
}

.image-preview {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.preview-image {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.image-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
}

.image-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  transition: background 0.3s;
}

.remove-btn:hover {
  background: #ff7875;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #357ae8;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  padding: 10px 16px;
  border-radius: 5px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: #4285f4;
  color: #4285f4;
}

.task-detail {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.detail-card {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  font-weight: bold;
  color: #666;
}

.detail-row .value {
  color: #333;
}

.task-status {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
}

.status-0 {
  background: #fff3cd;
  color: #856404;
}

.status-1 {
  background: #cfe2ff;
  color: #084298;
}

.status-2 {
  background: #d1e7dd;
  color: #0f5132;
}

.status-3 {
  background: #f8d7da;
  color: #842029;
}

.status-4 {
  background: #e2e3e5;
  color: #41464b;
}

.list-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: end;
  margin-bottom: 15px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.task-list {
  display: grid;
  gap: 12px;
}

.task-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px 15px;
  background: #fafafa;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-no {
  font-weight: bold;
  color: #333;
}

.task-card-body p {
  margin: 4px 0;
  color: #555;
  font-size: 13px;
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
