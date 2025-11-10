<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi } from '../api/auth'

const loading = ref(false)
const loginResult = ref<string>('')
const userInfo = ref<any>(null)

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

const handleSocialCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const source = urlParams.get('source')

  if (code && state && source) {
    try {
      loading.value = true
      loginResult.value = '正在处理登录回调...'

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

const handleLogout = () => {
  localStorage.removeItem('access_token')
  userInfo.value = null
  loginResult.value = ''
}

onMounted(() => {
  handleSocialCallback()
})
</script>

<template>
  <div class="container">
    <h1>MoMax 普通用户 Google 登录测试</h1>

    <div class="login-section">
      <div v-if="!userInfo" class="login-box">
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
        <p v-if="loginResult" class="result-message" :class="{ error: loginResult.includes('❌') }">
          {{ loginResult }}
        </p>
      </div>

      <div v-else class="user-info">
        <h2>✅ 登录成功！</h2>
        <div class="info-card">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" class="avatar" />
          <div class="info-text">
            <p><strong>用户 ID:</strong> {{ userInfo.userId }}</p>
            <p><strong>用户名:</strong> {{ userInfo.username }}</p>
            <p><strong>昵称:</strong> {{ userInfo.nickName }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </div>

    <div class="info-section">
      <h3>📝 测试说明</h3>
      <ul>
        <li>点击"使用 Google 账号登录"按钮</li>
        <li>将跳转到 Google 授权页面</li>
        <li>授权成功后会自动跳转回来并显示用户信息</li>
        <li>后端接口地址: <code>http://localhost:8080/web/auth/</code></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
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

.login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.google-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  font-size: 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.google-btn:hover {
  border-color: #4285f4;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
}

.google-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.result-message {
  font-size: 16px;
  color: #2a9d8f;
  text-align: center;
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
