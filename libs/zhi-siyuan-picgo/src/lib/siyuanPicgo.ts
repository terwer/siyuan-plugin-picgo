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
import { resolveSiyuanPicGoPaths, type SiyuanPicGoInstanceOptions } from "./siyuanPicgoPaths"
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
    const initialState = picgo.getConfigMigrationState()
    if (initialState.status === "running") {
      siyuanApi.pushMsg({
        msg: "检测到 PicGo 配置初始化或迁移任务，正在等待完成，请勿进行任何操作...",
        timeout: 1000,
      })
      this.logger?.warn("检测到 PicGo 配置初始化或迁移任务，正在等待完成...")
      await picgo.waitForConfigMigration()
    }

    const finalState = picgo.getConfigMigrationState()
    if (finalState.status === "failed") {
      const errorText = finalState.error ? `，错误信息：${finalState.error}` : ""
      siyuanApi.pushErrMsg({
        msg: `PicGo 配置初始化或迁移失败${errorText}。请在 PicGo 设置页点击“重试初始化”。`,
        timeout: 7000,
      })
      this.logger?.error(`PicGo config migration failed${errorText}`)
      return
    }

    if (initialState.status === "running" && finalState.status === "done") {
      siyuanApi.pushMsg({
        msg: "PicGO 配置初始化或迁移完成",
        timeout: 7000,
      })
      this.logger?.info("PicGO 配置初始化或迁移完成🎉")
    }

    this.logger?.info("PicGO instance is ready😄")
  }
}

export { SiyuanPicGo }
