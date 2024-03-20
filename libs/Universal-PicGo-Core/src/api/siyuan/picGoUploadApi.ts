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

/**
 * 文章PicGO图片信息Key
 */
export const SIYUAN_PICGO_FILE_MAP_KEY = "custom-picgo-file-map-key"

/**
 * 思源笔记专属的图片上传 API
 *
 * @version 1.6.0
 * @since 0.6.0
 * @author terwer
 */
class PicGoUploadApi {
  private readonly picgo: IPicGo
  private readonly logger: ILogger

  constructor(isDev?: boolean) {
    this.picgo = new UniversalPicGo("", isDev)
    this.logger = this.picgo.getLogger("siyuan-picgo-upload-api")
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
