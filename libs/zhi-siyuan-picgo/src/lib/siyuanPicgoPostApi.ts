/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import { SiyuanPicGoUploadApi } from "./siyuanPicGoUploadApi"
import { hasNodeEnv, IImgInfo, win } from "universal-picgo"

/**
 * Picgo与文章交互的通用方法
 */
class SiyuanPicgoPostApi {
  private readonly logger: ILogger
  // private readonly imageParser: ImageParser
  // private readonly siyuanApi: SiyuanKernelApi
  // private readonly siyuanConfig: SiyuanConfig
  private readonly picgoApi: SiyuanPicGoUploadApi
  public cfgUpdating: boolean

  constructor(isDev?: boolean) {
    this.logger = simpleLogger("picgo-post-api", "zhi-siyuan-picgo", isDev)
    // 初始化 PicGO
    this.picgoApi = new SiyuanPicGoUploadApi(isDev)
    this.cfgUpdating = false

    this.updateConfig()
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    return this.picgoApi.upload(input)
  }

  // ===================================================================================================================

  private updateConfig() {
    // 迁移旧插件配置
    let legacyCfgfolder = ""
    // 初始化思源 PicGO 配置
    const workspaceDir = win?.siyuan?.config?.system?.workspaceDir ?? ""
    if (hasNodeEnv && workspaceDir !== "") {
      const path = win.require("path")
      legacyCfgfolder = path.join(workspaceDir, "data", "storage", "syp", "picgo")
      // 如果新插件采用了不同的目录，需要迁移旧插件 node_modules 文件夹
      if (legacyCfgfolder !== this.picgoApi.picgo.baseDir) {
        void this.moveFile(legacyCfgfolder, this.picgoApi.picgo.baseDir)
      }
    }

    // 旧的配置位置
    // [工作空间]/data/storage/syp/picgo/picgo.cfg.json
    //    [工作空间]/data/storage/syp/picgo/package.json
    //    [工作空间]/data/storage/syp/picgo/mac.applescript
    //    [工作空间]/data/storage/syp/picgo/i18n-cli
    //    [工作空间]/data/storage/syp/picgo/picgo-clipboard-images
    //
    // 新配置位置
    // ~/.universal-picgo
  }

  private async moveFile(from: string, to: string) {
    const fs = win.fs
    const existFrom = fs.existsSync(from)
    const existTo = fs.existsSync(to)

    if (!existFrom) {
      return
    }

    // 存在旧文件采取迁移
    this.cfgUpdating = true
    this.logger.info(`will move ${from} to ${to}`)
    // 目的地存在复制
    if (existTo) {
      this.copyFolder(from, to)
        .then(() => {
          this.cfgUpdating = false
        })
        .catch((e: any) => {
          this.cfgUpdating = false
          this.logger.error(`copy ${from} to ${to} failed: ${e}`)
        })
    } else {
      // 不存在移动过去
      fs.promises
        .rename(from, to)
        .then(() => {
          this.cfgUpdating = false
        })
        .catch((e: any) => {
          this.cfgUpdating = false
          this.logger.error(`move ${from} to ${to} failed: ${e}`)
        })
    }
  }

  private async copyFolder(from: string, to: string) {
    const fs = win.fs
    const path = win.require("path")

    const files = await fs.promises.readdir(from)
    for (const file of files) {
      if (file.startsWith(".")) {
        continue
      }
      const sourcePath = path.join(from, file)
      const destPath = path.join(to, file)

      const stats = await fs.promises.lstat(sourcePath)
      if (stats.isDirectory()) {
        await fs.promises.mkdir(destPath, { recursive: true })
        // 递归复制子文件夹
        await this.copyFolder(sourcePath, destPath)
      } else {
        await fs.promises.copyFile(sourcePath, destPath)
      }
    }

    // 删除源文件夹
    await fs.promises.rmdir(from, { recursive: true })
  }
}

export { SiyuanPicgoPostApi }
