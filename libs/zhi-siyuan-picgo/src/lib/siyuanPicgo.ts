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

/**
 * 思源笔记 PicGo 实例
 */
class SiyuanPicGo {
  public static async getInstance(siyuanConfig: SiyuanConfig, isDev?: boolean): Promise<SiyuanPicgoPostApi> {
    return new Promise((resolve, _reject) => {
      const siyuanApi = new SiyuanKernelApi(siyuanConfig)
      const picgo = new SiyuanPicgoPostApi(siyuanConfig, isDev)

      let needUpdate = false
      const checkConfig = () => {
        if (picgo.cfgUpdating) {
          needUpdate = true
          siyuanApi.pushMsg({
            msg: "检测到旧配置，正在迁移配置，请勿进行任何操作...",
            timeout: 1000,
          })
          console.warn("检测到旧配置，正在迁移配置，请勿进行任何操作...")
          setTimeout(checkConfig, 1000)
        } else {
          if (needUpdate) {
            siyuanApi.pushMsg({
              msg: "PicGO 图床历史配置迁移完成",
              timeout: 7000,
            })
            console.log("PicGO 图床历史配置迁移完成")
            needUpdate = false
          }
          console.log("picgo instance is ready")
          resolve(picgo)
        }
      }
      checkConfig()
    })
  }
}

export { SiyuanPicGo }
