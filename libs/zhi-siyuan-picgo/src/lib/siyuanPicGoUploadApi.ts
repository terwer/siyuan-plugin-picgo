/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ExternalPicgo, IImgInfo, IPicGo, PicgoTypeEnum, UniversalPicGo } from "universal-picgo"
import { ILogger } from "zhi-lib-base"

/**
 * 思源笔记专属的图片上传 API
 *
 * @version 1.6.0
 * @since 0.6.0
 * @author terwer
 */
class SiyuanPicGoUploadApi {
  public readonly picgo: IPicGo
  private readonly externalPicGo: ExternalPicgo
  private readonly logger: ILogger

  constructor(isDev?: boolean) {
    // 初始化 PicGO
    this.picgo = new UniversalPicGo("", "", isDev)
    this.externalPicGo = new ExternalPicgo(this.picgo, isDev)
    this.logger = this.picgo.getLogger("siyuan-picgo-upload-api")
    this.logger.debug("picgo upload api inited")
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    const useBundledPicgo = this.externalPicGo.db.get("useBundledPicgo")
    if (useBundledPicgo) {
      const picgoType = this.externalPicGo.db.get("picgoType")
      if (picgoType !== PicgoTypeEnum.Bundled) {
        throw new Error("当前配置使用内置PicGo，请先在配置页面选择使用内置PicGo")
      }
      return this.picgo.upload(input)
    }
    return this.externalPicGo.upload(input)
  }
}

export { SiyuanPicGoUploadApi }
