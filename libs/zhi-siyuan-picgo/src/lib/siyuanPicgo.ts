/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicgoPostApi } from "./siyuanPicgoPostApi"
import { SiyuanConfig, SiyuanKernelApi } from "zhi-siyuan-api"
import { ILogger, simpleLogger } from "zhi-lib-base"

/**
 * 思源笔记 PicGo 实例
 */
class SiyuanPicGo {
  private static logger: ILogger | null = null
  private static siyuanApiInstance: SiyuanKernelApi | null = null
  private static picgoInstance: SiyuanPicgoPostApi | null = null

  public static async getInstance(siyuanConfig: SiyuanConfig, isDev?: boolean): Promise<SiyuanPicgoPostApi> {
    if (!this.logger) {
      this.logger = simpleLogger("get-instance", "zhi-siyuan-picgo", isDev)
    }

    // 如果 siyuanApi 尚未创建，初始化它
    if (!this.siyuanApiInstance) {
      console.log("初始化 SiyuanKernelApi 实例")
      this.siyuanApiInstance = new SiyuanKernelApi(siyuanConfig)
    }

    // 如果 picgo 尚未创建，初始化它
    if (!this.picgoInstance) {
      console.log("初始化 SiyuanPicgoPostApi 实例")
      this.picgoInstance = new SiyuanPicgoPostApi(siyuanConfig, isDev)

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
    return new Promise<void>((resolve) => {
      let needUpdate = false

      const checkConfig = () => {
        if (picgo.cfgUpdating) {
          needUpdate = true
          siyuanApi.pushMsg({
            msg: "检测到旧配置，正在迁移配置，请勿进行任何操作...",
            timeout: 1000,
          })
          console.warn("检测到旧配置，正在迁移配置，请勿进行任何操作...")
          setTimeout(checkConfig, 1000) // 递归检查
        } else {
          if (needUpdate) {
            siyuanApi.pushMsg({
              msg: "PicGO 图床历史配置迁移完成",
              timeout: 7000,
            })
            console.log("PicGO 图床历史配置迁移完成")
          }
          console.log("PicGO 实例已就绪")
          resolve()
        }
      }

      checkConfig()
    })
  }
}

export { SiyuanPicGo }
