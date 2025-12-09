<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { motionTaskApi, type CreateVideoTaskBo } from '../api/motion'
import { ossApi, type SysOssUploadVo } from '../api/oss'

const loading = ref(false)
const message = ref('')
const taskNo = ref('')
const taskStatus = ref<any>(null)
const isLoggedIn = ref(false)

// 视频上传相关状态
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadedVideo = ref<SysOssUploadVo | null>(null)
const videoPreviewUrl = ref('')
const videoFileRef = ref<HTMLInputElement | null>(null)

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('access_token')
  isLoggedIn.value = !!token
  return !!token
}

// 创建任务表单
const videoForm = ref({
  videoOssId: '' as string | number,
  cameraMode: '0' // 0-动态 1-静态
})

const textForm = ref({
  textPrompt: '一个人在跳舞',
  duration: 5.0
})

// 计算是否可以创建视频动捕任务
const canCreateVideoTask = computed(() => {
  return !!videoForm.value.videoOssId && !loading.value && !isUploading.value
})

// 选择视频文件
const selectVideoFile = () => {
  videoFileRef.value?.click()
}

// 处理视频文件选择
const handleVideoFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 验证文件类型
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  if (!allowedTypes.includes(file.type)) {
    message.value = '❌ 请上传 MP4、MOV、AVI 或 WebM 格式的视频文件'
    return
  }

  // 验证文件大小 (最大 500MB)
  const maxSize = 500 * 1024 * 1024
  if (file.size > maxSize) {
    message.value = '❌ 视频文件大小不能超过 500MB'
    return
  }

  // 开始上传
  await uploadVideo(file)

  // 清除 input 值，允许重新选择相同文件
  target.value = ''
}

// 上传视频
const uploadVideo = async (file: File) => {
  try {
    isUploading.value = true
    uploadProgress.value = 0
    message.value = '📤 正在上传视频...'

    // 创建本地预览
    videoPreviewUrl.value = URL.createObjectURL(file)

    // 使用直传 API 上传
    const result = await ossApi.directUpload(
      file,
      { moduleName: 'momax/video' },
      (percent) => {
        uploadProgress.value = percent
      }
    )

    uploadedVideo.value = result
    videoForm.value.videoOssId = result.ossId
    message.value = `✅ 视频上传成功！文件名: ${result.originalName || result.fileName}`

  } catch (error: any) {
    console.error('上传视频失败:', error)
    message.value = '❌ 上传失败：' + (error.message || error.toString())
    // 清除状态
    videoPreviewUrl.value = ''
    uploadedVideo.value = null
    videoForm.value.videoOssId = ''
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 移除已上传的视频
const removeVideo = () => {
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value)
  }
  videoPreviewUrl.value = ''
  uploadedVideo.value = null
  videoForm.value.videoOssId = ''
  message.value = ''
}

// 创建视频动捕任务
const createVideoTask = async () => {
  if (!videoForm.value.videoOssId) {
    message.value = '❌ 请先上传视频文件'
    return
  }

  try {
    loading.value = true
    const params: CreateVideoTaskBo = {
      videoOssId: videoForm.value.videoOssId,
      cameraMode: videoForm.value.cameraMode
    }
    const response = await motionTaskApi.createVideo(params)
    if (response.code === 200) {
      taskNo.value = response.data
      message.value = `✅ 视频动捕任务创建成功，任务编号: ${response.data}`
      // 创建成功后清除视频
      removeVideo()
    } else {
      message.value = '❌ 创建失败：' + response.msg
    }
  } catch (error: any) {
    console.error('创建视频动捕任务失败:', error)
    message.value = '❌ 创建失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

// 创建文本生成任务
const createTextTask = async () => {
  try {
    loading.value = true
    const response = await motionTaskApi.createText(textForm.value)
    if (response.code === 200) {
      taskNo.value = response.data
      message.value = `✅ 文本生成任务创建成功，任务编号: ${response.data}`
    } else {
      message.value = '❌ 创建失败：' + response.msg
    }
  } catch (error: any) {
    console.error('创建文本生成任务失败:', error)
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
    const response = await motionTaskApi.status(taskNo.value)
    if (response.code === 200) {
      taskStatus.value = response.data
      message.value = '✅ 查询成功'
    } else {
      message.value = '❌ 查询失败：' + response.msg
      taskStatus.value = null
    }
  } catch (error: any) {
    console.error('查询任务状态失败:', error)
    message.value = '❌ 查询失败：' + (error.message || error.toString())
    taskStatus.value = null
  } finally {
    loading.value = false
  }
}

// 获取任务类型文本
const getTaskTypeText = (type: string) => {
  const map: any = { '1': '视频动捕', '2': '文本生成', '3': '模型渲染' }
  return map[type] || '未知'
}

// 获取任务状态文本
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

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <div class="container">
    <h1>🎯 动作任务管理测试</h1>

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

    <!-- 创建任务表单 -->
    <div class="forms-section">
      <h3>➕ 创建任务</h3>

      <div class="forms-grid">
        <!-- 视频动捕任务 -->
        <div class="form-card">
          <h4>🎥 视频动捕任务</h4>

          <!-- 隐藏的文件输入 -->
          <input
            ref="videoFileRef"
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
            style="display: none"
            @change="handleVideoFileChange"
          />

          <!-- 视频上传区域 -->
          <div class="upload-section">
            <div v-if="!uploadedVideo" class="upload-area" @click="selectVideoFile">
              <div v-if="isUploading" class="uploading">
                <div class="upload-icon">📤</div>
                <div class="upload-text">正在上传... {{ uploadProgress }}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>
              <div v-else class="upload-placeholder">
                <div class="upload-icon">📁</div>
                <div class="upload-text">点击选择视频文件</div>
                <div class="upload-hint">支持 MP4、MOV、AVI、WebM 格式，最大 500MB</div>
              </div>
            </div>

            <!-- 已上传视频预览 -->
            <div v-else class="video-preview">
              <video
                v-if="videoPreviewUrl"
                :src="videoPreviewUrl"
                controls
                class="preview-video"
              ></video>
              <div class="video-info">
                <span class="video-name">{{ uploadedVideo.originalName || uploadedVideo.fileName }}</span>
                <button class="remove-btn" @click="removeVideo" title="移除视频">✕</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>相机模式:</label>
            <select v-model="videoForm.cameraMode">
              <option value="0">动态相机</option>
              <option value="1">静态相机</option>
            </select>
          </div>
          <button
            @click="createVideoTask"
            :disabled="!canCreateVideoTask"
            class="create-btn"
          >
            {{ isUploading ? '上传中...' : '创建视频动捕任务' }}
          </button>
        </div>

        <!-- 文本生成任务 -->
        <div class="form-card">
          <h4>📝 文本生成任务</h4>
          <div class="form-group">
            <label>文本提示:</label>
            <textarea v-model="textForm.textPrompt" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>时长（秒）:</label>
            <input v-model.number="textForm.duration" type="number" step="0.1" />
          </div>
          <button @click="createTextTask" :disabled="loading" class="create-btn">
            创建文本生成任务
          </button>
        </div>
      </div>
    </div>

    <!-- 查询任务状态 -->
    <div class="form-section">
      <h3>🔍 查询任务状态</h3>
      <div class="form-group">
        <label>任务编号:</label>
        <input v-model="taskNo" type="text" placeholder="输入任务编号查询" />
      </div>
      <button @click="queryTaskStatus" :disabled="loading" class="submit-btn">
        查询任务状态
      </button>
    </div>

    <!-- 任务详情 -->
    <div v-if="taskStatus" class="task-detail">
      <h3>📋 任务详情</h3>
      <div class="detail-card">
        <div class="detail-row">
          <span class="label">任务编号:</span>
          <span class="value">{{ taskStatus.taskNo }}</span>
        </div>
        <div class="detail-row">
          <span class="label">任务类型:</span>
          <span class="value task-type">{{ getTaskTypeText(taskStatus.taskType) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">任务状态:</span>
          <span class="value task-status" :class="`status-${taskStatus.taskStatus}`">
            {{ getTaskStatusText(taskStatus.taskStatus) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">用户 ID:</span>
          <span class="value">{{ taskStatus.userId }}</span>
        </div>
        <div v-if="taskStatus.errorMsg" class="detail-row">
          <span class="label">错误信息:</span>
          <span class="value error-msg">{{ taskStatus.errorMsg }}</span>
        </div>
        <div class="detail-row">
          <span class="label">创建时间:</span>
          <span class="value">{{ taskStatus.createTime }}</span>
        </div>
        <div v-if="taskStatus.updateTime" class="detail-row">
          <span class="label">更新时间:</span>
          <span class="value">{{ taskStatus.updateTime }}</span>
        </div>
      </div>
    </div>

    <!-- 接口说明 -->
    <div class="info-section">
      <h3>📝 接口说明</h3>
      <ul>
        <li><code>POST /resource/oss/getPresignedUrl</code> - 获取预签名上传URL</li>
        <li><code>PUT {presignedUrl}</code> - 直传视频到OSS</li>
        <li><code>POST /resource/oss/confirmDirectUpload</code> - 确认上传完成</li>
        <li><code>POST /web/motion/task/createVideo</code> - 创建视频动捕任务（需登录）</li>
        <li><code>POST /web/motion/task/createText</code> - 创建文本生成任务（需登录）</li>
        <li><code>GET /web/motion/task/status/{taskNo}</code> - 查询任务状态（需登录）</li>
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

.forms-section,
.form-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.form-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
}

.form-card h4 {
  margin: 0 0 15px 0;
  color: #4285f4;
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

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

/* 视频上传区域样式 */
.upload-section {
  margin-bottom: 15px;
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

.uploading .upload-text {
  color: #4285f4;
  font-weight: bold;
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

.video-preview {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.preview-video {
  width: 100%;
  max-height: 200px;
  display: block;
}

.video-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
}

.video-name {
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

.create-btn,
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

.create-btn:hover,
.submit-btn:hover {
  background: #357ae8;
}

.create-btn:disabled,
.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.task-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
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

.error-msg {
  color: #dc3545;
  font-weight: bold;
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
