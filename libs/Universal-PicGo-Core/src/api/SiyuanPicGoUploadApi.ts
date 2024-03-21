/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IImgInfo, IPicGo } from "../types"
import { UniversalPicGo } from "../core/UniversalPicGo"
import { ILogger } from "zhi-lib-base"
import { hasNodeEnv, win } from "universal-picgo-store"
import { pathExistsSync } from "../utils/nodeUtils"

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
class SiyuanPicGoUploadApi {
  private readonly picgo: IPicGo
  private readonly logger: ILogger

  constructor(isDev?: boolean) {
    let cfgfolder = ""
    let picgo_cfg_160 = ""
    // 初始化思源 PicGO 配置
    const workspaceDir = win?.siyuan?.config?.system?.workspaceDir ?? ""
    if (hasNodeEnv && workspaceDir !== "") {
      const path = win.require("path")
      cfgfolder = path.join(workspaceDir, "data", "storage", "syp", "picgo")
      picgo_cfg_160 = path.join(cfgfolder, "picgo.cfg.json")
    }

    // 初始化 PicGO
    this.picgo = new UniversalPicGo(picgo_cfg_160, "", isDev)
    this.logger = this.picgo.getLogger("siyuan-picgo-upload-api")

    // 迁移旧插件
    if (hasNodeEnv && cfgfolder !== "") {
      // 如果新插件采用了不同的目录，需要迁移旧插件 node_modules 文件夹
      if (cfgfolder !== this.picgo.pluginBaseDir) {
        const path = win.require("path")

        const plugin_dir_070 = path.join(cfgfolder, "node_modules")
        const pkg_070 = path.join(cfgfolder, "package.json")
        const plugin_dir_160 = path.join(this.picgo.pluginBaseDir, "node_modules")
        const pkg_160 = path.join(this.picgo.pluginBaseDir, "package.json")

        this.moveFile(plugin_dir_070, plugin_dir_160)
        this.moveFile(pkg_070, pkg_160)
      }
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

  // ===================================================================================================================

  private moveFile(from: string, to: string) {
    const fs = win.fs
    const path = win.require("path")
    const exist = pathExistsSync(fs, path, from)
    const existTo = pathExistsSync(fs, path, to)

    // 存在旧文件采取迁移
    if (exist) {
      this.logger.info(`will move ${from} to ${to}`)
      // 目的地存在复制
      if (existTo) {
        fs.promises.cp(from, to).catch((e: any) => {
          this.logger.error(`copy ${from} to ${to} failed: ${e}`)
        })
      } else {
        // 不存在移动过去
        fs.promises.rename(from, to).catch((e: any) => {
          this.logger.error(`move ${from} to ${to} failed: ${e}`)
        })
      }
    }
  }
}

export { SiyuanPicGoUploadApi }
