import axios from 'axios'

// 后端 API 基础地址
export const API_BASE_URL = 'http://localhost:5504'

// 创建 axios 实例
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 token
http.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const res = response.data
    // 统一处理后端响应格式 R<T>
    if (res.code !== 200) {
      console.error('API 错误:', res.msg)
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)
