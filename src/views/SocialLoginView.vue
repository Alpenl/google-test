<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { authApi } from '../api/auth'

interface AuthUser {
  userId?: number
  username?: string
  nickName?: string
  email?: string
  avatar?: string
  userType?: string
}

const loading = ref(false)
const loginResult = ref<string>('')
const userInfo = ref<AuthUser | null>(null)

// 邮箱登录状态
const email = ref('')
const emailCode = ref('')
const sendLoading = ref(false)
const sendCountdown = ref(0)
const emailMessage = ref('')
let countdownTimer: number | undefined

const countdownText = computed(() =>
  sendCountdown.value > 0 ? `${sendCountdown.value}s 后可重发` : '发送验证码'
)

const startCountdown = () => {
  sendCountdown.value = 60
  countdownTimer = window.setInterval(() => {
    if (sendCountdown.value <= 1) {
      clearInterval(countdownTimer)
      countdownTimer = undefined
      sendCountdown.value = 0
    } else {
      sendCountdown.value -= 1
    }
  }, 1000)
}

const handleGoogleLogin = async () => {
  try {
    loading.value = true
    loginResult.value = '正在跳转到 Google 授权页面...'

    const domain = window.location.origin
    const response = await authApi.getSocialBindUrl('google', domain)

    if (response.data) {
      loginResult.value = '跳转成功！正在打开授权页面...'
      window.location.href = response.data
    } else {
      loginResult.value = '获取授权 URL 失败：' + response.msg
    }
  } catch (error: any) {
    console.error('Google 登录失败:', error)
    loginResult.value = '登录失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

const handleSendEmailCode = async () => {
  const emailValue = email.value.trim()
  if (!emailValue) {
    emailMessage.value = '请输入邮箱地址'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailValue)) {
    emailMessage.value = '邮箱格式不正确'
    return
  }

  try {
    sendLoading.value = true
    emailMessage.value = '发送中...'
    const redirectUrl = window.location.origin
    const res = await authApi.sendEmailCode(emailValue, redirectUrl)
    emailMessage.value = `验证码已发送，${res.data.expiresIn / 60}分钟内有效`
    startCountdown()
  } catch (error: any) {
    console.error('发送邮箱验证码失败:', error)
    emailMessage.value = '发送失败：' + (error.message || error.toString())
  } finally {
    sendLoading.value = false
  }
}

const handleEmailLogin = async () => {
  const emailValue = email.value.trim()
  const codeValue = emailCode.value.trim()
  if (!emailValue || !codeValue) {
    loginResult.value = '请输入邮箱和验证码'
    return
  }
  try {
    loading.value = true
    loginResult.value = '正在验证验证码...'
    const res = await authApi.emailLogin(emailValue, codeValue)
    userInfo.value = res.data.user
    loginResult.value = '✅ 邮箱登录成功！'
    localStorage.setItem('access_token', res.data.access_token)
    window.history.replaceState({}, document.title, '/')
  } catch (error: any) {
    console.error('邮箱登录失败:', error)
    loginResult.value = '❌ 登录失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

const handleSocialCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const source = urlParams.get('source')

  if (code && state && source) {
    try {
      loading.value = true
      loginResult.value = '正在处理社交登录回调...'

      const response = await authApi.socialLogin(source, code, state)

      if (response.code === 200 && response.data) {
        loginResult.value = '✅ 登录成功！'
        userInfo.value = response.data.user
        localStorage.setItem('access_token', response.data.access_token)
        window.history.replaceState({}, document.title, '/')
      } else {
        loginResult.value = '❌ 登录失败：' + response.msg
      }
    } catch (error: any) {
      console.error('处理登录回调失败:', error)
      loginResult.value = '❌ 登录失败：' + (error.message || error.toString())
    } finally {
      loading.value = false
    }
  }
}

const handleEmailLinkToken = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const emailParam = urlParams.get('email')
  const expire = urlParams.get('expire_in')
  const isNewUser = urlParams.get('is_new_user')
  const verified = urlParams.get('verified')

  if (token) {
    localStorage.setItem('access_token', token)
    userInfo.value = {
      email: emailParam || '未知邮箱',
      nickName: emailParam || '邮箱用户'
    }
    loginResult.value =
      verified === 'true'
        ? '✅ 邮件验证成功并已登录'
        : '✅ 登录成功（邮件链接）'
    if (expire) {
      loginResult.value += `，有效期 ${expire} 秒`
    }
    if (isNewUser) {
      loginResult.value += isNewUser === 'true' ? '，新注册用户' : ''
    }
    // 清理 URL 参数
    window.history.replaceState({}, document.title, '/')
  }
}

const handleLogout = () => {
  localStorage.removeItem('access_token')
  userInfo.value = null
  loginResult.value = ''
  emailMessage.value = ''
}

onMounted(() => {
  handleEmailLinkToken()
  handleSocialCallback()
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="container">
    <h1>MoMax 普通用户登录测试</h1>

    <div class="login-section">
      <div v-if="!userInfo" class="login-grid">
        <!-- Google 登录 -->
        <div class="card">
          <h2>使用 Google 登录</h2>
          <p class="desc">跳转 Google 授权后自动回调</p>
          <button @click="handleGoogleLogin" :disabled="loading" class="google-btn">
            <svg
              v-if="!loading"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 48 48"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span v-if="loading">处理中...</span>
            <span v-else>使用 Google 账号登录</span>
          </button>
        </div>

        <!-- 邮箱登录 -->
        <div class="card">
          <h2>使用邮箱验证码登录</h2>
          <p class="desc">支持新用户自动注册</p>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-group code-row">
            <div class="flex-1">
              <label>验证码</label>
              <input v-model="emailCode" type="text" maxlength="6" placeholder="6位数字验证码" />
            </div>
            <button
              class="send-btn"
              :disabled="sendLoading || sendCountdown > 0"
              @click="handleSendEmailCode"
            >
              {{ sendLoading ? '发送中...' : countdownText }}
            </button>
          </div>
          <p class="hint">{{ emailMessage }}</p>
          <button @click="handleEmailLogin" :disabled="loading" class="login-btn">
            {{ loading ? '登录中...' : '邮箱登录/注册' }}
          </button>
        </div>
      </div>

      <div v-else class="user-info">
        <h2>✅ 登录成功</h2>
        <div class="info-card">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" class="avatar" />
          <div class="info-text">
            <p><strong>用户 ID:</strong> {{ userInfo.userId ?? '未知' }}</p>
            <p><strong>用户名:</strong> {{ userInfo.username || userInfo.email || '—' }}</p>
            <p><strong>昵称:</strong> {{ userInfo.nickName || '—' }}</p>
            <p><strong>邮箱:</strong> {{ userInfo.email || '—' }}</p>
          </div>
        </div>
        <p v-if="loginResult" class="result-message">{{ loginResult }}</p>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>

      <p v-if="!userInfo && loginResult" class="result-message" :class="{ error: loginResult.includes('❌') }">
        {{ loginResult }}
      </p>
    </div>

    <div class="info-section">
      <h3>📝 测试说明</h3>
      <ul>
        <li>Google 登录：点击按钮跳转授权，回调后自动登录。</li>
        <li>邮箱登录：输入邮箱获取 6 位验证码，5 分钟内输入完成登录；新用户自动注册。</li>
        <li>邮件内的验证链接会携带 token 回跳，页面会自动写入本地存储。</li>
        <li>后端接口基址：<code>http://localhost:8000/web/auth/</code></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 900px;
  margin: 50px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.login-section {
  background: #f9f9f9;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.login-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.desc {
  color: #666;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 14px;
  color: #444;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.code-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.flex-1 {
  flex: 1;
}

.google-btn,
.login-btn,
.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.google-btn:hover,
.login-btn:hover,
.send-btn:hover {
  border-color: #4285f4;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
}

.google-btn:disabled,
.login-btn:disabled,
.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.login-btn {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.login-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.send-btn {
  min-width: 120px;
}

.hint {
  font-size: 13px;
  color: #666;
  min-height: 18px;
}

.result-message {
  font-size: 15px;
  color: #2a9d8f;
  text-align: center;
  margin-top: 10px;
}

.result-message.error {
  color: #e63946;
}

.user-info {
  text-align: center;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  justify-content: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.info-text {
  text-align: left;
  line-height: 1.6;
}

.logout-btn {
  padding: 10px 20px;
  background: #e63946;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.logout-btn:hover {
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
  line-height: 1.8;
}
</style>
