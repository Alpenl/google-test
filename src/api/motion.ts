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
  },

  /**
   * 获取资产详情
   * @param id 资产ID
   */
  detail: (id: number) => {
    return http.get<any>(`/web/motion/asset/detail/${id}`)
  }
}

/**
 * 预置动作相关 API
 */
export const motionPresetApi = {
  /**
   * 获取预置动作列表
   */
  list: (params: { pageNum: number; pageSize: number }) => {
    return http.get<any>('/web/motion/preset/list', params)
  },

  /**
   * 获取预置动作详情
   */
  detail: (id: number | string) => {
    return http.get<any>(`/web/motion/preset/detail/${id}`)
  },

  /**
   * 按类型获取预置动作
   */
  listByType: (taskType: string, params: { pageNum: number; pageSize: number }) => {
    return http.get<any>(`/web/motion/preset/listByType/${taskType}`, params)
  },

  /**
   * 获取热门预置动作
   */
  popular: (limit: number) => {
    return http.get<any>('/web/motion/preset/popular', { limit })
  },

  /**
   * 获取最新预置动作
   */
  latest: (limit: number) => {
    return http.get<any>('/web/motion/preset/latest', { limit })
  },

  /**
   * 按类型统计预置动作
   */
  statisticsByType: () => {
    return http.get<any>('/web/motion/preset/statisticsByType')
  },

  /**
   * 搜索预置动作
   */
  search: (keyword: string, params: { pageNum: number; pageSize: number }) => {
    return http.get<any>('/web/motion/preset/search', { keyword, ...params })
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

/**
 * 图片转3D任务创建参数
 */
export interface CreateImage3DTaskBo {
  /** 输入图片 OSS ID (必填) */
  imageOssId: number | string
  /** 网格生成服务商 (hunyuan3d/rodin，可选) */
  meshProvider?: string
  /** 备注 */
  remark?: string
}

/**
 * 图片转3D任务相关 API
 */
export const motionImage3dApi = {
  /**
   * 提交图片转3D任务
   * @param data 任务参数（imageOssId, meshProvider, remark 等）
   */
  submit: (data: CreateImage3DTaskBo) => {
    return http.post<{ data: string; msg: string; code: number }>(
      '/web/motion/image3d/submit',
      data
    )
  },

  /**
   * 查询任务进度
   * @param taskNo 任务编号
   */
  progress: (taskNo: string) => {
    return http.get<any>(`/web/motion/image3d/progress/${taskNo}`)
  },

  /**
   * 取消任务
   * @param taskNo 任务编号
   */
  cancel: (taskNo: string) => {
    return http.post<any>(`/web/motion/image3d/cancel/${taskNo}`)
  },

  /**
   * 重试任务
   * @param taskNo 任务编号
   */
  retry: (taskNo: string) => {
    return http.post<{ data: string; msg: string; code: number }>(
      `/web/motion/image3d/retry/${taskNo}`
    )
  },

  /**
   * 查询任务列表
   * @param params 分页与筛选参数
   */
  pageTasks: (params: { pageNum: number; pageSize: number; status?: string }) => {
    return http.get<any>('/web/motion/image3d/pageTasks', params)
  }
}
