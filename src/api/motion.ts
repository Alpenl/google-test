import { http } from './config'

/**
 * 动作资产相关 API
 */
export const motionAssetApi = {
  /**
   * 统一查询动作资产列表（公开/个人）
   * - 未登录：仅返回公开资产
   * - 已登录：默认返回自己的资产，可通过 visibility=1 查询公开资产
   */
  list: (params: { pageNum: number; pageSize: number; visibility?: string }) => {
    return http.get<any>('/web/motion/asset/list', params)
  },

  /**
   * 更新资产可见性
   * 只能修改自己的资产
   * @param id 资产ID
   * @param visibility 可见性：0私有 1公开
   */
  updateVisibility: (id: number, visibility: string) => {
    return http.put<any>(`/web/motion/asset/updateVisibility/${id}/${visibility}`)
  },

  /**
   * 删除资产
   * 只能删除自己的资产
   * @param id 资产ID
   */
  delete: (id: number) => {
    return http.delete<any>(`/web/motion/asset/delete/${id}`)
  }
}

/**
 * 视频动捕任务创建参数
 */
export interface CreateVideoTaskBo {
  /** 视频 OSS ID (必填) */
  videoOssId: number | string
  /** 相机模式: 0-动态 1-静态 (默认0) */
  cameraMode?: string
}

/**
 * 动作任务相关 API
 */
export const motionTaskApi = {
  /**
   * 创建视频动捕任务
   * 上传视频后生成动作数据
   * @param data 任务参数（videoOssId, cameraMode 等）
   */
  createVideo: (data: CreateVideoTaskBo) => {
    return http.post<{ data: string; msg: string; code: number }>(
      '/web/motion/task/createVideo',
      data
    )
  },

  /**
   * 创建文本生成任务
   * 输入文本描述生成动作数据
   * @param data 任务参数（textPrompt, duration 等）
   */
  createText: (data: { textPrompt: string; duration: number }) => {
    return http.post<{ data: string; msg: string; code: number }>(
      '/web/motion/task/createText',
      data
    )
  },

  /**
   * 查询任务状态
   * 仅限查看自己的任务
   * @param taskNo 任务编号
   */
  status: (taskNo: string) => {
    return http.get<any>(`/web/motion/task/status/${taskNo}`)
  }
}
