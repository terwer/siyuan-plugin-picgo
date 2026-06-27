/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import {
  ExternalPicgo,
  IExternalPicgoConfig,
  IImgInfo,
  IPicGo,
  PicgoTypeEnum,
  PicListUploader,
  ReadyUnifiedPicGoConfigFacade,
  UniversalPicGo,
} from "universal-picgo"
import { ILogger } from "zhi-lib-base"
import { SiyuanPicGoPaths, toUniversalPicGoOptions } from "./siyuanPicgoPaths"

/**
 * 思源笔记专属的图片上传 API
 *
 * @since 0.6.0
 * @author terwer
 */
class SiyuanPicGoUploadApi {
  public readonly picgo: IPicGo
  private readonly externalPicGo: ExternalPicgo
  private readonly picListUploader: PicListUploader
  private readonly logger: ILogger
  private configFacade?: ReadyUnifiedPicGoConfigFacade

  constructor(isDev?: boolean, paths?: SiyuanPicGoPaths, storageAdapterFactory?: (dbPath: string) => import("universal-picgo-store").StorageAdapter) {
    this.picgo = new (UniversalPicGo as any)({
      ...toUniversalPicGoOptions(paths ?? {}, isDev),
      storageAdapterFactory,
    })
    const routeConfigProvider = () => this.getExternalRouteConfig()
    this.externalPicGo = new ExternalPicgo(this.picgo, isDev, routeConfigProvider)
    this.picListUploader = new PicListUploader(this.picgo, isDev, routeConfigProvider)
    this.logger = this.picgo.getLogger("siyuan-picgo-upload-api")
    this.logger.debug("picgo upload api inited")
  }

  public attachConfigFacade(facade: ReadyUnifiedPicGoConfigFacade): void {
    this.configFacade = facade
    ;(this.picgo as any).attachConfigFacade?.(facade)
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    if (!this.configFacade) {
      throw new Error("Unified config facade is not ready for upload dispatch")
    }
    const routeConfig = this.getExternalRouteConfig()
    const useBundledPicgo = routeConfig.useBundledPicgo
    if (useBundledPicgo) {
      const picgoType = routeConfig.picgoType
      if (picgoType !== PicgoTypeEnum.Bundled) {
        throw new Error("当前配置使用内置PicGo，请先在配置页面选择使用内置PicGo")
      }
      return this.picgo.upload(input)
    }

    // 检查是否配置了远程 PicList 服务
    if (this.picListUploader.isPicListConfigured()) {
      this.logger.info("Using remote PicList uploader")
      return this.picListUploader.upload(input)
    }

    // 默认走本地 PicGo App
    this.logger.info("Using local PicGo App uploader")
    return this.externalPicGo.upload(input)
  }

  private getExternalRouteConfig(): IExternalPicgoConfig {
    const cfg = this.configFacade?.getSnapshot().externalPicgo
    if (!cfg) {
      throw new Error("Unified config facade is not ready for external/PicList route config")
    }
    return cfg
  }
}

export { SiyuanPicGoUploadApi }
