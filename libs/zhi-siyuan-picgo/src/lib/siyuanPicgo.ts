/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicgoPostApi } from "./siyuanPicgoPostApi"
import { ILogger, simpleLogger } from "zhi-lib-base"
import { migrateV2WorkspacePicGoConfig, resolveSiyuanPicGoPaths, type SiyuanPicGoInstanceOptions } from "./siyuanPicgoPaths"
import type { SiyuanConfigLike } from "./siyuanConfigLike"
import { SiyuanKernelApi } from "zhi-siyuan-api"

/**
 * 思源笔记 PicGo 实例
 */
class SiyuanPicGo {
  private static logger: ILogger | null = null
  private static siyuanApiInstance: SiyuanKernelApi | null = null
  private static picgoInstance: SiyuanPicgoPostApi | null = null
  private static instanceKey: string | null = null

  public static async getInstance(
    siyuanConfig: SiyuanConfigLike,
    isDevOrOptions?: boolean | SiyuanPicGoInstanceOptions
  ): Promise<SiyuanPicgoPostApi> {
    const isDev = typeof isDevOrOptions === "object" ? isDevOrOptions.isDev : isDevOrOptions
    const pathOverrides = typeof isDevOrOptions === "object" ? isDevOrOptions.paths : undefined
    const paths = resolveSiyuanPicGoPaths(pathOverrides)
    const instanceKey = JSON.stringify({
      apiUrl: siyuanConfig.apiUrl,
      configPath: paths.configPath,
      baseDir: paths.baseDir,
      pluginBaseDir: paths.pluginBaseDir,
      zhiNpmPath: paths.zhiNpmPath,
    })
    if (!this.logger) {
      this.logger = simpleLogger("get-instance", "zhi-siyuan-picgo", isDev)
    }

    if (this.instanceKey !== null && this.instanceKey !== instanceKey) {
      this.logger.info("PicGo instance path contract changed, reinitializing singleton")
      this.siyuanApiInstance = null
      this.picgoInstance = null
      this.instanceKey = null
    }

    // 如果 siyuanApi 尚未创建，初始化它
    if (!this.siyuanApiInstance) {
      this.logger.debug("初始化 SiyuanKernelApi 实例")
      this.siyuanApiInstance = new SiyuanKernelApi(siyuanConfig as any)
    }

    // 如果 picgo 尚未创建，初始化它
    if (!this.picgoInstance) {
      this.logger.debug("初始化 SiyuanPicgoPostApi 实例")
      this.logger.info("resolved PicGo paths =>", paths)
      migrateV2WorkspacePicGoConfig(paths, this.logger)
      this.picgoInstance = new SiyuanPicgoPostApi(siyuanConfig, isDev, paths)
      this.instanceKey = instanceKey

      // 异步检查配置迁移状态
      await this.checkConfigMigration(this.siyuanApiInstance, this.picgoInstance)
    }

    // 返回已初始化的 picgo 实例
    return this.picgoInstance
  }

  /**
   * 检查 PicGo 配置迁移的状态
   */
  private static async checkConfigMigration(siyuanApi: SiyuanKernelApi, picgo: SiyuanPicgoPostApi): Promise<void> {
    const that = this
    return new Promise<void>((resolve) => {
      let needUpdate = false

      const checkConfig = () => {
        if (picgo.cfgUpdating) {
          needUpdate = true
          siyuanApi.pushMsg({
            msg: "检测到旧配置，正在迁移配置，请勿进行任何操作...",
            timeout: 1000,
          })
          that.logger?.warn("检测到旧配置，正在迁移配置，请勿进行任何操作...")
          setTimeout(checkConfig, 1000) // 递归检查
        } else {
          if (needUpdate) {
            siyuanApi.pushMsg({
              msg: "PicGO 图床历史配置迁移完成",
              timeout: 7000,
            })
            that.logger?.info("PicGO 图床历史配置迁移完成🎉")
          }
          that.logger?.info("PicGO instance is ready😄")
          resolve()
        }
      }

      checkConfig()
    })
  }
}

export { SiyuanPicGo }
