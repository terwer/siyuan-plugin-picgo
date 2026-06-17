/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import ExternalPicgoConfigDb from "../db/externalPicGo"
import { IImgInfo, IPicGo } from "../types"
import { PicgoTypeEnum } from "../utils/enums"
import { isFileOrBlob } from "../utils/common"
import { hasNodeEnv, win } from "universal-picgo-store"

/**
 * 远程 PicList 上传 API
 *
 * 对接远程 PicList 容器的图片上传接口。
 * 与本地 ExternalPicgo 不同，此上传器通过 multipart/form-data 直接携带图片二进制数据。
 *
 * 接口规范：
 * - URL: POST {apiUrl}
 * - Headers: Authorization: Bearer {apiKey}
 * - Content-Type: multipart/form-data
 * - Body: file 字段，包含图片文件
 * - 响应: { success: true, result: "https://..." }
 *
 * @author terwer
 */
class PicListUploader {
  private readonly logger: ILogger
  public readonly db: ExternalPicgoConfigDb

  constructor(ctx: IPicGo, isDev?: boolean) {
    this.logger = simpleLogger("piclist-uploader", "piclist-uploader", isDev)
    this.db = new ExternalPicgoConfigDb(ctx)
  }

  /**
   * 上传图片到远程 PicList 服务
   *
   * @param input 文件路径、URL、Blob 或 File 数组。为空则上传剪贴板（不支持，会抛错）
   * @returns 上传结果数组
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    const picgoType = this.db.get("picgoType")
    if (picgoType !== PicgoTypeEnum.App) {
      throw new Error(`picgoType ${picgoType} is not supported via PicList API`)
    }

    if (!this.isPicListConfigured()) {
      throw new Error("PicList API URL or Key is not configured")
    }

    const apiUrl = this.db.get("picListApiUrl") as string
    const apiKey = this.db.get("picListApiKey") as string

    // 不支持剪贴板上传（没有文件路径/数据）
    if (!input || input.length === 0) {
      throw new Error(
        "PicList does not support clipboard upload. Please select an image file or use the bundled PicGo instead."
      )
    }

    const results: IImgInfo[] = []

    // PicList API 每次只支持单文件上传，需要逐个处理
    for (const inputItem of input) {
      try {
        const { fileBlob, fileName } = await this.resolveFileData(inputItem)
        if (!fileBlob) {
          this.logger.warn("Skipping empty input item:", inputItem)
          continue
        }

        this.logger.debug("Uploading to PicList, url =>", apiUrl)
        this.logger.debug(`File name => ${fileName}, size => ${fileBlob.size}`)

        const formData = new FormData()
        formData.append("file", fileBlob, fileName)

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "unknown")
          throw new Error(`PicList HTTP ${response.status}: ${errorText}`)
        }

        const resJson = await response.json()
        this.logger.debug("PicList response =>", resJson)

        if (resJson.success && resJson.result) {
          // PicList 返回的 result 可能是单个 URL 字符串，也可能是 URL 数组
          const resultList: string[] = Array.isArray(resJson.result)
            ? resJson.result
            : [resJson.result]

          for (const imgUrl of resultList) {
            if (!imgUrl || typeof imgUrl !== "string" || imgUrl.trim() === "") {
              continue
            }
            results.push({
              fileName: imgUrl.substring(imgUrl.lastIndexOf("/") + 1) || fileName,
              imgUrl,
            })
          }
          this.logger.info(`PicList upload success: ${fileName} => ${JSON.stringify(resultList)}`)
        } else {
          throw new Error(resJson.message || "PicList upload failed with unknown error")
        }
      } catch (e: any) {
        this.logger.error(`PicList upload error for item ${inputItem}:`, e)
        throw e
      }
    }

    return results
  }

  /**
   * 检查当前是否配置了 PicList（有远程 URL 和 API Key）
   */
  public isPicListConfigured(): boolean {
    const apiUrl = this.db.get("picListApiUrl")
    const apiKey = this.db.get("picListApiKey")
    return (
      typeof apiUrl === "string" &&
      apiUrl.trim() !== "" &&
      typeof apiKey === "string" &&
      apiKey.trim() !== ""
    )
  }

  // ===================================================================================================================

  /**
   * 将输入项解析为 Blob 和文件名
   */
  private async resolveFileData(
    inputItem: any
  ): Promise<{ fileBlob: Blob | null; fileName: string }> {
    // 已经是 Blob 或 File
    if (isFileOrBlob(inputItem)) {
      return {
        fileBlob: inputItem as Blob,
        fileName: (inputItem as any).name || "image.png",
      }
    }

    // 文件路径字符串
    if (typeof inputItem === "string") {
      if (hasNodeEnv) {
        return this.resolveNodeFilePath(inputItem)
      }
      return this.resolveBrowserUrlOrPath(inputItem)
    }

    this.logger.warn("Unsupported input type:", typeof inputItem)
    return { fileBlob: null, fileName: "" }
  }

  /**
   * Node.js 环境：从文件系统读取图片
   */
  private async resolveNodeFilePath(
    filePath: string
  ): Promise<{ fileBlob: Blob | null; fileName: string }> {
    const fs = win.fs
    const path = win.require("path")

    if (!fs.existsSync(filePath)) {
      // 路径不存在，尝试作为 URL fetch
      this.logger.warn(`File not found on disk: ${filePath}, trying fetch as URL`)
      return this.resolveBrowserUrlOrPath(filePath)
    }

    try {
      const buffer = await fs.promises.readFile(filePath)
      const fileName = path.basename(filePath)
      return {
        fileBlob: new Blob([buffer]),
        fileName,
      }
    } catch (e: any) {
      this.logger.error(`Failed to read file: ${filePath}`, e)
      throw new Error(`Failed to read file ${filePath}: ${e.message}`)
    }
  }

  /**
   * 浏览器环境：通过 URL 获取图片数据
   */
  private async resolveBrowserUrlOrPath(
    urlOrPath: string
  ): Promise<{ fileBlob: Blob | null; fileName: string }> {
    try {
      const response = await fetch(urlOrPath)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${urlOrPath}`)
      }
      const blob = await response.blob()

      let fileName = "image.png"
      try {
        const urlObj = new URL(urlOrPath)
        fileName = urlObj.pathname.substring(urlObj.pathname.lastIndexOf("/") + 1) || "image.png"
      } catch {
        // 不是合法 URL，尝试提取路径部分
        const parts = urlOrPath.replace(/\\/g, "/").split("/")
        fileName = parts[parts.length - 1] || "image.png"
      }

      return { fileBlob: blob, fileName }
    } catch (e: any) {
      this.logger.error(`Failed to fetch from URL: ${urlOrPath}`, e)
      throw new Error(`Failed to fetch image from ${urlOrPath}: ${e.message}`)
    }
  }

}

export { PicListUploader }
