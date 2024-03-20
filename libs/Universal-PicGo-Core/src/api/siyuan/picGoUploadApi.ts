/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IImgInfo, IPicGo } from "../../types"
import { UniversalPicGo } from "../../core/UniversalPicGo"
import { ILogger } from "zhi-lib-base"
import { hasNodeEnv, win } from "universal-picgo-store"
import { browserPathJoin } from "../../utils/browserUtils"

/**
 * 文章PicGO图片信息Key
 */
export const SIYUAN_PICGO_FILE_MAP_KEY = "custom-picgo-file-map-key"

/**
 * 思源笔记专属的图片上传 API
 *
 * ```
 * 默认配置位置
 *
 * [工作空间]/data/storage/syp/picgo/picgo.cfg.json
 *    [工作空间]/data/storage/syp/picgo/package.json
 *    [工作空间]/data/storage/syp/picgo/mac.applescript
 *    [工作空间]/data/storage/syp/picgo/i18n-cli
 *    [工作空间]/data/storage/syp/picgo/picgo-clipboard-images
 *
 *
 * 默认插件位置
 *
 * ~/.universal-picgo/node_modules
 *    ~/.universal-picgo/node_modules/plugin-1
 *    ~/.universal-picgo/node_modules/plugin-2
 * ```
 *
 * @version 1.6.0
 * @since 0.6.0
 * @author terwer
 */
class PicGoUploadApi {
  private readonly picgo: IPicGo
  private readonly logger: ILogger

  constructor(isDev?: boolean) {
    let cfgfolder = ""
    let picgo_cfg_160 = ""
    // 初始化思源 PicGO 配置
    const workspaceDir = win?.siyuan?.config?.system?.workspaceDir
    if (workspaceDir) {
      cfgfolder = `${workspaceDir}/data/storage/syp/picgo`
      picgo_cfg_160 = browserPathJoin(cfgfolder, "picgo.cfg.json")
    }

    // 初始化 PicGO
    this.picgo = new UniversalPicGo(picgo_cfg_160, "", isDev)
    this.logger = this.picgo.getLogger("siyuan-picgo-upload-api")

    // 移除旧插件
    if (hasNodeEnv && cfgfolder !== "") {
      // 删除 node_modules 文件夹
      const fs = win.fs
      const oldPluginDir = browserPathJoin(cfgfolder, "node_modules")
      this.logger.info(`will remove old plugin dir ${oldPluginDir}`)
      fs.promises.rm(oldPluginDir).catch((e: any) => {
        throw e
      })
    }

    // 默认配置位置
    // [工作空间]/data/storage/syp/picgo/picgo.cfg.json
    //    [工作空间]/data/storage/syp/picgo/package.json
    //    [工作空间]/data/storage/syp/picgo/mac.applescript
    //    [工作空间]/data/storage/syp/picgo/i18n-cli
    //    [工作空间]/data/storage/syp/picgo/picgo-clipboard-images
    //
    // 默认插件位置
    // ~/.universal-picgo/node_modules
    //    ~/.universal-picgo/node_modules/plugin-1
    //    ~/.universal-picgo/node_modules/plugin-2
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    return this.picgo.upload(input)
  }
}

export { PicGoUploadApi }
