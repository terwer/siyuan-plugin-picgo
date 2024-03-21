/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicgoPostApi } from "zhi-siyuan-picgo"
import { isDev } from "@/utils/Constants.ts"
import { ElMessage } from "element-plus"
import { createAppLogger } from "@/utils/appLogger.ts"

/**
 * 思源笔记 PicGp 实例
 */
class SiyuanPicGo {
  private static logger = createAppLogger("siyuan-pigo")

  public static async getInstance(): Promise<SiyuanPicgoPostApi> {
    return new Promise((resolve, reject) => {
      const picgo = new SiyuanPicgoPostApi(isDev)
      let needUpdate = false
      const checkConfig = () => {
        if (picgo.cfgUpdating) {
          needUpdate = true
          ElMessage.warning("检测到旧配置，正在迁移配置，请勿进行任何操作...")
          setTimeout(checkConfig, 1000)
        } else {
          if (needUpdate) {
            ElMessage.success("配置迁移完成")
            needUpdate = false
          }
          this.logger.info("picgo instance is ready")
          resolve(picgo)
        }
      }
      checkConfig()
    })
  }
}

export { SiyuanPicGo }
