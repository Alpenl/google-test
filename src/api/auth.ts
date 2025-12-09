import { http } from './config'

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 获取社交登录授权 URL
   * @param source 社交平台来源（如 'google'）
   * @param domain 域名（用于回调）
   * @param inviteCode 邀请码（可选）
   */
  getSocialBindUrl: (source: string, domain: string, inviteCode?: string) => {
    let url = `/web/auth/socialBindUrl/${source}?domain=${domain}`
    if (inviteCode) {
      url += `&inviteCode=${inviteCode}`
    }
    return http.get<{ data: string; msg: string; code: number }>(url)
  },

  /**
   * 前台用户社交登录（无需 token）
   * @param source 社交平台来源
   * @param code 授权码
   * @param state 状态参数
   */
  socialLogin: (source: string, code: string, state: string) => {
    return http.post<{
      data: {
        access_token: string
        user: {
          userId: number
          username: string
          nickName: string
          email: string
          avatar: string
          userType: string
        }
        is_new_user?: boolean
      }
      msg: string
      code: number
    }>('/web/auth/socialLogin', {
      source,
      socialCode: code,
      socialState: state
    })
  },

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   * @param redirectUrl 邮件链接回跳地址（可选）
   */
  sendEmailCode: (email: string, redirectUrl?: string) => {
    return http.post<{
      data: { expiresIn: number }
      msg: string
      code: number
    }>('/web/auth/sendEmailCode', {
      email,
      redirectUrl
    })
  },

  /**
   * 邮箱验证码登录（自动注册）
   * @param email 邮箱地址
   * @param code 验证码
   */
  emailLogin: (email: string, code: string) => {
    return http.post<{
      data: {
        access_token: string
        expire_in: number
        is_new_user?: boolean
        user: {
          userId: number
          username?: string
          nickName?: string
          email?: string
          avatar?: string
          userType?: string
        }
      }
      msg: string
      code: number
    }>('/web/auth/emailLogin', { email, code })
  }
}
