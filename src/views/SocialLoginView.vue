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

// 邮箱注册状态
const regEmail = ref('')
const regCode = ref('')
const regPassword = ref('')
const regSendLoading = ref(false)
const regSendCountdown = ref(0)
const regMessage = ref('')
let regCountdownTimer: number | undefined

// 邮箱登录状态
const loginEmail = ref('')
const loginCode = ref('')
const loginPassword = ref('')
const loginSendLoading = ref(false)
const loginSendCountdown = ref(0)
const loginMessage = ref('')
let loginCountdownTimer: number | undefined

// 凭证修改状态（登录后使用）
const credUserName = ref('')
const credOldPassword = ref('')
const credNewPassword = ref('')
const credMessage = ref('')
const credLoading = ref(false)

// 忘记密码状态
const resetEmail = ref('')
const resetCode = ref('')
const resetNewPassword = ref('')
const resetMessage = ref('')
const resetSendLoading = ref(false)
const resetSendCountdown = ref(0)
let resetCountdownTimer: number | undefined
const resetCountdownText = computed(() =>
  resetSendCountdown.value > 0 ? `${resetSendCountdown.value}s 后可重发` : '发送验证码'
)

const regCountdownText = computed(() =>
  regSendCountdown.value > 0 ? `${regSendCountdown.value}s 后可重发` : '发送验证码'
)
const loginCountdownText = computed(() =>
  loginSendCountdown.value > 0 ? `${loginSendCountdown.value}s 后可重发` : '发送验证码'
)

const startCountdown = (isRegister: boolean) => {
  const setter = (val: number) => {
    if (isRegister) regSendCountdown.value = val
    else loginSendCountdown.value = val
  }
  const getter = () => (isRegister ? regSendCountdown.value : loginSendCountdown.value)
  setter(60)
  const id = window.setInterval(() => {
    if (getter() <= 1) {
      clearInterval(isRegister ? regCountdownTimer : loginCountdownTimer)
      setter(0)
    } else {
      setter(getter() - 1)
    }
  }, 1000)
  if (isRegister) regCountdownTimer = id
  else loginCountdownTimer = id
}
const startResetCountdown = () => {
  resetSendCountdown.value = 60
  resetCountdownTimer = window.setInterval(() => {
    if (resetSendCountdown.value <= 1) {
      clearInterval(resetCountdownTimer)
      resetCountdownTimer = undefined
      resetSendCountdown.value = 0
    } else {
      resetSendCountdown.value -= 1
    }
  }, 1000)
}

const handleGoogleLogin = async () => {
  try {
    loading.value = true
    loginResult.value = '正在跳转到 Google 授权页面...'

    const domain = window.location.origin
    const response = await authApi.getSocialBindUrl('google', domain)

    const bindUrl = response.data
    if (bindUrl) {
      loginResult.value = '跳转成功！正在打开授权页面...'
      window.location.href = bindUrl
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

type SendScene = 'register' | 'login' | 'reset'

const handleSendEmailCode = async (scene: SendScene) => {
  const emailValue =
    scene === 'register' ? regEmail.value.trim() : scene === 'login' ? loginEmail.value.trim() : resetEmail.value.trim()
  const setMessage =
    scene === 'register'
      ? (msg: string) => (regMessage.value = msg)
      : scene === 'login'
        ? (msg: string) => (loginMessage.value = msg)
        : (msg: string) => (resetMessage.value = msg)
  const setLoading =
    scene === 'register'
      ? (val: boolean) => (regSendLoading.value = val)
      : scene === 'login'
        ? (val: boolean) => (loginSendLoading.value = val)
        : (val: boolean) => (resetSendLoading.value = val)

  if (!emailValue) {
    setMessage('请输入邮箱地址')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailValue)) {
    setMessage('邮箱格式不正确')
    return
  }

  try {
    setLoading(true)
    setMessage('发送中...')
    const redirectUrl = window.location.origin
    const res = await authApi.sendEmailCode(emailValue, redirectUrl)
    const expires = res.data.expiresIn
    setMessage(`验证码已发送，${expires / 60}分钟内有效`)
    if (scene === 'reset') {
      startResetCountdown()
    } else {
      startCountdown(scene === 'register')
    }
  } catch (error: any) {
    console.error('发送邮箱验证码失败:', error)
    setMessage('发送失败：' + (error.message || error.toString()))
  } finally {
    setLoading(false)
  }
}

const handleRegister = async () => {
  const emailValue = regEmail.value.trim()
  const codeValue = regCode.value.trim()
  const passwordValue = regPassword.value.trim()
  if (!emailValue) {
    regMessage.value = '请输入邮箱'
    return
  }
  if (!codeValue) {
    regMessage.value = '请输入验证码'
    return
  }
  try {
    loading.value = true
    loginResult.value = '正在注册...'
    const payload: { email: string; code: string; password?: string } = { email: emailValue, code: codeValue }
    if (passwordValue) payload.password = passwordValue
    const res = await authApi.emailLogin(payload)
    const loginData = res.data
    userInfo.value = loginData.user
    loginResult.value = '✅ 注册并登录成功！'
    localStorage.setItem('access_token', loginData.access_token)
    window.history.replaceState({}, document.title, '/')
  } catch (error: any) {
    console.error('注册失败:', error)
    loginResult.value = '❌ 注册失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

const handleEmailLogin = async () => {
  const emailValue = loginEmail.value.trim()
  const codeValue = loginCode.value.trim()
  const passwordValue = loginPassword.value.trim()
  if (!emailValue) {
    loginMessage.value = '请输入邮箱'
    return
  }
  if (!codeValue && !passwordValue) {
    loginMessage.value = '请输入验证码或密码'
    return
  }
  try {
    loading.value = true
    loginResult.value = '正在登录...'
    const payload: { email: string; code?: string; password?: string } = { email: emailValue }
    if (codeValue) payload.code = codeValue
    if (passwordValue) payload.password = passwordValue
    const res = await authApi.emailLogin(payload)
    const loginData = res.data
    userInfo.value = loginData.user
    loginResult.value = '✅ 登录成功！'
    localStorage.setItem('access_token', loginData.access_token)
    window.history.replaceState({}, document.title, '/')
  } catch (error: any) {
    console.error('邮箱登录失败:', error)
    loginResult.value = '❌ 登录失败：' + (error.message || error.toString())
  } finally {
    loading.value = false
  }
}

const handleUpdateCredential = async () => {
  if (!userInfo.value) {
    credMessage.value = '请先登录'
    return
  }
  const newUserName = credUserName.value.trim()
  const oldPassword = credOldPassword.value.trim()
  const newPassword = credNewPassword.value.trim()
  if (!newUserName && !newPassword) {
    credMessage.value = '请填写新用户名或新密码'
    return
  }
  if (newPassword && !oldPassword) {
    credMessage.value = '请输入旧密码以修改密码'
    return
  }
  try {
    credLoading.value = true
    const payload: { userName?: string; oldPassword?: string; newPassword?: string } = {}
    if (newUserName) payload.userName = newUserName
    if (newPassword) {
      payload.newPassword = newPassword
      payload.oldPassword = oldPassword
    }
    const res = await authApi.updateCredential(payload)
    credMessage.value = res.msg || '更新成功'
    if (newUserName && userInfo.value) {
      userInfo.value.username = newUserName
    }
    credOldPassword.value = ''
    credNewPassword.value = ''
    window.location.reload()
  } catch (error: any) {
    console.error('修改凭证失败:', error)
    credMessage.value = '❌ ' + (error.message || error.toString())
  } finally {
    credLoading.value = false
  }
}

const handleResetPassword = async () => {
  const emailValue = resetEmail.value.trim()
  const codeValue = resetCode.value.trim()
  const newPwdValue = resetNewPassword.value.trim()
  if (!emailValue) {
    resetMessage.value = '请输入邮箱'
    return
  }
  if (!codeValue) {
    resetMessage.value = '请输入验证码'
    return
  }
  if (!newPwdValue) {
    resetMessage.value = '请输入新密码'
    return
  }
  try {
    credLoading.value = true
    const res = await authApi.resetPassword({ email: emailValue, code: codeValue, newPassword: newPwdValue })
    resetMessage.value = res.msg || '重置成功，请重新登录'
    resetCode.value = ''
    resetNewPassword.value = ''
    window.location.reload()
  } catch (error: any) {
    console.error('重置密码失败:', error)
    resetMessage.value = '❌ ' + (error.message || error.toString())
  } finally {
    credLoading.value = false
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

      const loginData = response.data
      if (loginData) {
        loginResult.value = '✅ 登录成功！'
        userInfo.value = loginData.user
        localStorage.setItem('access_token', loginData.access_token)
        window.history.replaceState({}, document.title, '/')
      } else {
        loginResult.value = '❌ 登录失败：' + (response.msg || '未获取到登录信息')
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
  regMessage.value = ''
  regPassword.value = ''
  regCode.value = ''
  regEmail.value = ''
  loginMessage.value = ''
  loginPassword.value = ''
  loginCode.value = ''
  loginEmail.value = ''
  credUserName.value = ''
  credOldPassword.value = ''
  credNewPassword.value = ''
  credMessage.value = ''
}

onMounted(() => {
  handleEmailLinkToken()
  handleSocialCallback()
})

onBeforeUnmount(() => {
  if (regCountdownTimer) {
    clearInterval(regCountdownTimer)
  }
  if (loginCountdownTimer) {
    clearInterval(loginCountdownTimer)
  }
  if (resetCountdownTimer) {
    clearInterval(resetCountdownTimer)
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

        <!-- 邮箱注册 -->
        <div class="card">
          <h2>邮箱注册</h2>
          <p class="desc">邮箱 + 验证码完成注册，可选设置密码</p>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="regEmail" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-group code-row">
            <div class="flex-1">
              <label>验证码</label>
              <input v-model="regCode" type="text" maxlength="6" placeholder="6位数字验证码" />
            </div>
              <button
                class="send-btn"
                :disabled="regSendLoading || regSendCountdown > 0"
                @click="handleSendEmailCode('register')"
              >
                {{ regSendLoading ? '发送中...' : regCountdownText }}
              </button>
          </div>
          <div class="form-group">
            <label>密码（可选）</label>
            <input
              v-model="regPassword"
              type="password"
              placeholder="设置后下次可直接用密码登录（6-30位）"
            />
          </div>
          <p class="hint">{{ regMessage }}</p>
          <button @click="handleRegister" :disabled="loading" class="login-btn">
            {{ loading ? '处理中...' : '注册并登录' }}
          </button>
        </div>

        <!-- 邮箱登录 -->
        <div class="card">
          <h2>邮箱登录</h2>
          <p class="desc">邮箱 + 密码 或 邮箱 + 验证码均可登录</p>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="loginEmail" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-group">
            <label>密码（可选）</label>
            <input
              v-model="loginPassword"
              type="password"
              placeholder="可直接用邮箱+密码登录"
            />
          </div>
          <div class="form-group code-row">
            <div class="flex-1">
              <label>验证码（可选）</label>
              <input v-model="loginCode" type="text" maxlength="6" placeholder="6位数字验证码" />
            </div>
              <button
                class="send-btn"
                :disabled="loginSendLoading || loginSendCountdown > 0"
                @click="handleSendEmailCode('login')"
              >
                {{ loginSendLoading ? '发送中...' : loginCountdownText }}
              </button>
            </div>
          <p class="hint">{{ loginMessage }}</p>
          <button @click="handleEmailLogin" :disabled="loading" class="login-btn">
            {{ loading ? '登录中...' : '登录' }}
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

        <div class="card" style="margin-top: 12px">
          <h3>忘记密码（邮箱验证码重置）</h3>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="resetEmail" type="email" placeholder="请输入注册邮箱" />
          </div>
          <div class="form-group code-row">
            <div class="flex-1">
              <label>验证码</label>
              <input v-model="resetCode" type="text" maxlength="6" placeholder="6位数字验证码" />
            </div>
            <button
              class="send-btn"
              :disabled="resetSendLoading || resetSendCountdown > 0"
              @click="handleSendEmailCode('reset')"
            >
              {{ resetSendLoading ? '发送中...' : resetCountdownText }}
            </button>
          </div>
          <div class="form-group">
            <label>新密码（6-30位）</label>
            <input v-model="resetNewPassword" type="password" placeholder="输入新密码" />
          </div>
          <p class="hint">{{ resetMessage }}</p>
          <button @click="handleResetPassword" :disabled="credLoading" class="login-btn">
            {{ credLoading ? '提交中...' : '重置密码' }}
          </button>
        </div>

        <div class="card" style="margin-top: 12px">
          <h3>修改用户名 / 密码</h3>
          <div class="form-group">
            <label>新用户名（可选）</label>
            <input v-model="credUserName" type="text" placeholder="不修改可留空" />
          </div>
          <div class="form-group">
            <label>旧密码（修改密码时必填）</label>
            <input v-model="credOldPassword" type="password" placeholder="修改密码时填写" />
          </div>
          <div class="form-group">
            <label>新密码（可选，6-30位）</label>
            <input v-model="credNewPassword" type="password" placeholder="不修改可留空" />
          </div>
          <p class="hint">{{ credMessage }}</p>
          <div class="button-row">
            <button @click="handleUpdateCredential" :disabled="credLoading" class="login-btn">
              {{ credLoading ? '提交中...' : '保存修改' }}
            </button>
            <button @click="handleLogout" class="logout-btn" style="margin-left: 8px">退出登录</button>
          </div>
        </div>
      </div>

      <p v-if="!userInfo && loginResult" class="result-message" :class="{ error: loginResult.includes('❌') }">
        {{ loginResult }}
      </p>
    </div>

    <div class="info-section">
      <h3>📝 测试说明</h3>
      <ul>
        <li>Google 登录：点击按钮跳转授权，回调后自动登录。</li>
        <li>邮箱注册：邮箱 + 验证码完成注册，可选设置密码（验证码 5 分钟内有效）。</li>
        <li>邮箱登录：邮箱 + 密码，或邮箱 + 验证码均可登录。</li>
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

.button-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.button-row .logout-btn {
  margin-left: 0;
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
