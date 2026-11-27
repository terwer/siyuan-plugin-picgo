import {
  PICGO_HEADLESS_ERROR_CODES,
  PicGoHeadlessError,
  createPicGoHeadlessManager,
  type IConfig,
  type IImgInfo,
  type IPicGo,
  type IPicGoHeadlessManager,
  type PicGoHeadlessSaveUploaderConfigOptions,
  type PicGoUploaderConfigSchema,
  type PicGoUploaderListItem,
  type PicGoUploaderSchemaAuditResult,
  type PicGoValidationResult,
} from "universal-picgo"
import type { PicgoPostResult } from "./models/PicgoPostResult"
import { SiyuanPicGo } from "./siyuanPicgo"
import type { SiyuanConfigLike } from "./siyuanConfigLike"
import type { SiyuanPicgoPostApi } from "./siyuanPicgoPostApi"
import type { SiyuanPicGoInstanceOptions } from "./siyuanPicgoPaths"
import type { UploadMarkdownImagesOptions } from "./types"

interface ISiyuanPicGoHeadlessManager extends IPicGoHeadlessManager {
  uploadMarkdownImages(
    pageId: string,
    attrs: any,
    mdContent: string,
    options?: UploadMarkdownImagesOptions
  ): Promise<PicgoPostResult>
}

class SiyuanPicGoHeadlessManager implements ISiyuanPicGoHeadlessManager {
  private readonly postApi: SiyuanPicgoPostApi
  private readonly headlessManager: IPicGoHeadlessManager

  constructor(postApi: SiyuanPicgoPostApi) {
    this.postApi = postApi
    this.headlessManager = createPicGoHeadlessManager({
      picgo: postApi.ctx(),
    })
  }

  getContext(): IPicGo {
    return this.headlessManager.getContext()
  }

  getConfig(): Promise<IConfig> {
    return this.headlessManager.getConfig()
  }

  getCurrentUploader(): Promise<string> {
    return this.headlessManager.getCurrentUploader()
  }

  setCurrentUploader(uploaderId: string): Promise<PicGoValidationResult> {
    return this.headlessManager.setCurrentUploader(uploaderId)
  }

  listUploaders(): PicGoUploaderListItem[] {
    return this.headlessManager.listUploaders()
  }

  getUploaderSchema(uploaderId: string): PicGoUploaderConfigSchema {
    return this.headlessManager.getUploaderSchema(uploaderId)
  }

  getUploaderConfig<T extends Record<string, unknown> = Record<string, unknown>>(uploaderId: string): Promise<T> {
    return this.headlessManager.getUploaderConfig<T>(uploaderId)
  }

  validateUploaderConfig(uploaderId: string, config: Record<string, unknown>): PicGoValidationResult {
    return this.headlessManager.validateUploaderConfig(uploaderId, config)
  }

  saveUploaderConfig(
    uploaderId: string,
    config: Record<string, unknown>,
    options?: PicGoHeadlessSaveUploaderConfigOptions
  ): Promise<PicGoValidationResult> {
    return this.headlessManager.saveUploaderConfig(uploaderId, config, options)
  }

  auditUploaderSchemas(): PicGoUploaderSchemaAuditResult {
    return this.headlessManager.auditUploaderSchemas()
  }

  async upload(input?: any[]): Promise<IImgInfo[]> {
    return this.headlessManager.upload(input)
  }

  async uploadMarkdownImages(
    pageId: string,
    attrs: any,
    mdContent: string,
    options: UploadMarkdownImagesOptions = {}
  ): Promise<PicgoPostResult> {
    // 无图片时不需要图床：跳过 uploader 配置校验，直接交由底层返回「文章中没有图片」。
    // 开启 includeRemoteImages 后，外链图片也算图片，必须先校验 uploader 配置。
    const images = await this.postApi.parsePostImages(pageId, mdContent, options.includeRemoteImages === true)
    if (images.length > 0) {
      const uploaderId = await this.getCurrentUploader()
      const validation = this.validateUploaderConfig(uploaderId, await this.getUploaderConfig(uploaderId))
      if (!validation.ok) {
        throw new PicGoHeadlessError({
          code: PICGO_HEADLESS_ERROR_CODES.VALIDATION_FAILED,
          uploaderId,
          message: `Uploader "${uploaderId}" config is invalid`,
          errors: validation.errors,
        })
      }
    }
    return this.postApi.uploadPostImagesToBed(pageId, attrs, mdContent, options)
  }
}

const createSiyuanPicGoHeadlessManager = async (
  siyuanConfig: SiyuanConfigLike,
  options?: boolean | SiyuanPicGoInstanceOptions
): Promise<SiyuanPicGoHeadlessManager> => {
  const postApi = await SiyuanPicGo.getInstance(siyuanConfig, options)
  return new SiyuanPicGoHeadlessManager(postApi)
}

export {
  SiyuanPicGoHeadlessManager,
  createSiyuanPicGoHeadlessManager,
  type ISiyuanPicGoHeadlessManager,
}
