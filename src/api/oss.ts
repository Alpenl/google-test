import { http, API_BASE_URL } from './config'
import axios from 'axios'

/**
 * 预签名URL请求参数
 */
export interface PresignedUrlBo {
  fileName: string
  fileType: string
  moduleName?: string
  directoryId?: string | number
  directoryPath?: string
}

/**
 * 预签名URL响应
 */
export interface PresignedUrlVo {
  presignedUrl: string
  fileKey: string
  fileUrl: string
  moduleName?: string
  directoryId?: string | number
  directoryPath?: string
  expiration: number
  uploadTip: string
}

/**
 * 确认直传上传参数
 */
export interface ConfirmDirectUploadBo {
  fileName: string
  fileKey: string
  fileUrl: string
  moduleName?: string
  directoryId?: string | number
  directoryPath?: string
  fileSize: number
}

/**
 * OSS 上传结果
 */
export interface SysOssUploadVo {
  ossId: string | number
  fileName: string
  originalName: string
  url: string
  updateTime: string
}

/**
 * OSS 相关 API
 */
export const ossApi = {
  /**
   * 获取预签名上传URL
   * @param params 预签名请求参数
   * @returns 预签名URL信息
   */
  getPresignedUrl: (params: PresignedUrlBo) => {
    return http.post<any>('/resource/oss/getPresignedUrl', params)
  },

  /**
   * 确认直传上传完成
   * @param params 确认请求参数
   * @returns 上传结果
   */
  confirmDirectUpload: (params: ConfirmDirectUploadBo) => {
    return http.post<any>('/resource/oss/confirmDirectUpload', params)
  },

  /**
   * 执行直传上传（完整流程）
   * @param file 要上传的文件
   * @param options 上传选项
   * @param onProgress 进度回调
   * @returns 上传结果
   */
  directUpload: async (
    file: File,
    options?: {
      moduleName?: string
      directoryId?: string | number
      directoryPath?: string
    },
    onProgress?: (percent: number) => void
  ): Promise<SysOssUploadVo> => {
    // 1. 获取预签名URL
    const presignedParams: PresignedUrlBo = {
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      moduleName: options?.moduleName,
      directoryId: options?.directoryId,
      directoryPath: options?.directoryPath
    }

    const presignedResponse = await http.post<any>('/resource/oss/getPresignedUrl', presignedParams)
    const presignedData = presignedResponse.data as PresignedUrlVo

    // 2. 上传文件到 OSS
    await axios.put(presignedData.presignedUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          onProgress(percent)
        }
      }
    })

    // 3. 确认上传完成
    const confirmParams: ConfirmDirectUploadBo = {
      fileName: file.name,
      fileKey: presignedData.fileKey,
      fileUrl: presignedData.fileUrl,
      moduleName: options?.moduleName,
      directoryId: options?.directoryId,
      directoryPath: options?.directoryPath,
      fileSize: file.size
    }

    const confirmResponse = await http.post<any>('/resource/oss/confirmDirectUpload', confirmParams)
    return confirmResponse.data as SysOssUploadVo
  }
}
