/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IImgInfo, IPicGo, hasNodeEnv, isFileOrBlob, win } from "universal-picgo"
import { JsonUtil, StrUtil } from "zhi-common"
import { DeviceDetection, DeviceTypeEnum, SiyuanDevice } from "zhi-device"
import { ILogger, simpleLogger } from "zhi-lib-base"
import { SiyuanKernelApi } from "zhi-siyuan-api"
import type { SiyuanConfigLike } from "./siyuanConfigLike"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./constants"
import { ImageItem } from "./models/ImageItem"
import { ParsedImage } from "./models/ParsedImage"
import { PicgoPostResult } from "./models/PicgoPostResult"
import { ImageParser } from "./parser/ImageParser"
import { SiyuanPicGoUploadApi } from "./siyuanPicGoUploadApi"
import { replaceImageLink } from "./utils/utils"
import { SiyuanPicGoPaths, migrateV2WorkspacePicGoConfig } from "./siyuanPicgoPaths"
import {
  buildSiyuanPicGoMigrationKey,
  getOrCreateSiyuanPicGoMigrationState,
  getSiyuanPicGoMigrationMarkerKey,
  getSiyuanPicGoMigrationSnapshot,
  getSiyuanPicGoMigrationVersion,
  isSiyuanPicGoMigrationMarkedDone,
  markSiyuanPicGoMigrationDoneInBrowser,
  resetSiyuanPicGoMigrationState,
  type SiyuanPicGoMigrationSnapshot,
} from "./siyuanPicgoMigrationState"

/**
 * Picgo与文章交互的通用方法
 */
class SiyuanPicgoPostApi {
  private readonly logger: ILogger
  private readonly imageParser: ImageParser
  public readonly siyuanApi: SiyuanKernelApi
  private readonly siyuanConfig: SiyuanConfigLike
  private readonly isSiyuanOrSiyuanNewWin: boolean
  private readonly picgoApi: SiyuanPicGoUploadApi
  private readonly paths: SiyuanPicGoPaths
  private readonly configMigrationKey: string
  private configInitPromise: Promise<void>
  public cfgUpdating: boolean

  constructor(siyuanConfig: SiyuanConfigLike, isDev?: boolean, paths?: SiyuanPicGoPaths) {
    this.logger = simpleLogger("picgo-post-api", "zhi-siyuan-picgo", isDev)

    this.imageParser = new ImageParser(isDev)

    this.siyuanConfig = siyuanConfig
    this.siyuanApi = new SiyuanKernelApi(siyuanConfig as any)

    this.isSiyuanOrSiyuanNewWin = (() => {
      const deviceType = DeviceDetection.getDevice()
      // 三种情况，主窗口、挂件、新窗口
      const isSiyuanOrSiyuanNewWin =
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_MainWin ||
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_RendererWin ||
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_Widget
      return isSiyuanOrSiyuanNewWin
    })()

    // 初始化 PicGO
    this.picgoApi = new SiyuanPicGoUploadApi(isDev, paths)
    const ctx = this.picgoApi.picgo
    this.paths = {
      configPath: ctx.configPath,
      baseDir: ctx.baseDir,
      pluginBaseDir: ctx.pluginBaseDir,
      zhiNpmPath: (ctx as any).zhiNpmPath,
    }
    this.configMigrationKey = buildSiyuanPicGoMigrationKey(this.paths, siyuanConfig.apiUrl)
    this.cfgUpdating = false

    this.configInitPromise = this.ensureConfigInitialized().then(() => {
      this.logger.info("picgo config updated")
    })
  }

  /**
   * 内置 PicGo 上下文
   */
  public ctx(): IPicGo {
    return this.picgoApi.picgo
  }

  public getConfigMigrationState(): SiyuanPicGoMigrationSnapshot {
    return getSiyuanPicGoMigrationSnapshot(this.configMigrationKey, this.paths)
  }

  public waitForConfigMigration(): Promise<void> {
    return this.configInitPromise ?? Promise.resolve()
  }

  public async retryConfigMigration(): Promise<SiyuanPicGoMigrationSnapshot> {
    this.configInitPromise = this.ensureConfigInitialized(true)
    await this.configInitPromise
    return this.getConfigMigrationState()
  }

  /**
   * 上传图片到PicGO，此方法不会修改元数据
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async originalUpload(input?: any[]): Promise<IImgInfo[] | Error> {
    return this.picgoApi.upload(input)
  }

  /**
   * 将字符串数组格式的图片信息转换成图片对象数组
   *
   * @param attrs 文章属性
   * @param retImgs  字符串数组格式的图片信息
   * @param imageBaseUrl - 本地图片前缀，一般是思源的地址
   */
  public async doConvertImagesToImagesItemArray(
    attrs: any,
    retImgs: ParsedImage[],
    imageBaseUrl?: string
  ): Promise<ImageItem[]> {
    const ret = [] as ImageItem[]
    for (let i = 0; i < retImgs.length; i++) {
      const retImg = retImgs[i]
      const originUrl = retImg.url
      let imgUrl = retImg.url

      // 获取属性存储的映射数据
      let fileMap = {} as any
      this.logger.debug("attrs=>", attrs)
      if (!StrUtil.isEmptyString(attrs[SIYUAN_PICGO_FILE_MAP_KEY])) {
        fileMap = JsonUtil.safeParse(attrs[SIYUAN_PICGO_FILE_MAP_KEY], {})
        this.logger.debug("fileMap=>", fileMap)
      }

      // 处理思源本地图片预览
      // 这个是从思源查出来解析的是否是本地
      if (retImg.isLocal) {
        const baseUrl = imageBaseUrl ?? this.siyuanConfig.apiUrl ?? ""
        imgUrl = StrUtil.pathJoin(baseUrl, "/" + imgUrl)
      }

      const imageItem = new ImageItem(originUrl, imgUrl, retImg.isLocal, retImg.alt, retImg.title)
      // 块 ID 赋值进去
      imageItem.blockId = retImg.blockId
      // fileMap 查出来的是是否上传，上传了，isLocal就false
      if (fileMap[imageItem.hash]) {
        const newImageItem = fileMap[imageItem.hash]
        this.logger.debug("newImageItem=>", newImageItem)
        // 注意：可能存在元数据没有的情况，这种情况要跳过
        if (newImageItem.isLocal === false) {
          imageItem.isLocal = false
          imageItem.url = newImageItem.url
        }
      }

      // imageItem.originUrl = decodeURIComponent(imageItem.originUrl)
      // imageItem.url = decodeURIComponent(imageItem.url)
      this.logger.debug("imageItem=>", imageItem)
      ret.push(imageItem)
    }

    this.logger.debug("ret=>", ret)
    return ret
  }

  // ===================================================================================================================

  /**
   * 上传当前文章图片到图床（单篇文档所有图片全部批量上传，提供给外部调用，例如：发布工具）
   *
   * @param pageId 文章ID
   * @param attrs 文章属性
   * @param mdContent 文章的Markdown文本
   */
  public async uploadPostImagesToBed(pageId: string, attrs: any, mdContent: string): Promise<PicgoPostResult> {
    const ret = new PicgoPostResult()

    const imageBlocks: any[] = await this.siyuanApi.getImageBlocksByID(pageId)
    this.logger.debug("查询文章中的图片块=>", imageBlocks)

    // 解析图片地址
    let uniqueLocalImages: ParsedImage[] = []
    imageBlocks.forEach((page) => {
      const parsedLocalImages = this.imageParser.parseLocalImagesToArray(mdContent)
      uniqueLocalImages = [...new Set([...uniqueLocalImages, ...parsedLocalImages])]
      // 设置 blockId 属性
      uniqueLocalImages = uniqueLocalImages.map((image: any) => {
        return { ...image, blockId: page.id }
      })
    })
    // const parsedLocalImages = this.imageParser.parseLocalImagesToArray(mdContent)
    // const uniqueLocalImages = [...new Set([...localImages])]
    this.logger.debug("uniqueLocalImages=>", uniqueLocalImages)

    if (uniqueLocalImages.length === 0) {
      ret.flag = false
      ret.hasImages = false
      ret.mdContent = mdContent
      ret.errmsg = "文章中没有图片"
      return ret
    }

    // 开始上传
    try {
      ret.hasImages = true

      const imageItemArray = await this.doConvertImagesToImagesItemArray(attrs, uniqueLocalImages)
      this.logger.debug("pared image array =>", imageItemArray)

      const replaceMap = {} as any
      let hasLocalImages = false
      for (let i = 0; i < imageItemArray.length; i++) {
        const imageItem = imageItemArray[i]
        if (imageItem.originUrl.includes("assets")) {
          replaceMap[imageItem.hash] = imageItem
        }

        if (!imageItem.isLocal) {
          this.logger.debug("[外部调用]已经上传过图床，请勿重复上传=>", imageItem.originUrl)
          continue
        }

        hasLocalImages = true

        let newattrs: any
        let isLocal: boolean
        let newImageItem: ImageItem
        try {
          // 实际上传逻辑
          await this.uploadSingleImageToBed(pageId, attrs, imageItem)
          // 上传完成，需要获取最新链接
          newattrs = await this.siyuanApi.getBlockAttrs(pageId)
          isLocal = false
          const newfileMap = JsonUtil.safeParse<any>(newattrs[SIYUAN_PICGO_FILE_MAP_KEY], {})
          newImageItem = newfileMap[imageItem.hash]
        } catch (e: any) {
          newattrs = attrs
          isLocal = true
          newImageItem = imageItem
          ret.flag = false
          ret.errmsg = e.toString()
          this.logger.warn("单个图片上传异常", { pageId, attrs, imageItem })
          this.logger.warn("单个图片上传失败，错误信息如下", e)
        }

        // 无论成功失败都要保存元数据，失败了当做本地图片
        replaceMap[imageItem.hash] = new ImageItem(
          newImageItem.originUrl,
          newImageItem.url,
          isLocal,
          newImageItem.alt,
          newImageItem.title
        )
      }

      if (!hasLocalImages) {
        // ElMessage.info("未发现本地图片，不上传！若之前上传过，将做链接替换")
        this.logger.warn("未发现本地图片，不上传！若之前上传过，将做链接替换")
      }

      // 处理链接替换
      this.logger.debug("准备替换正文图片，replaceMap=>", JSON.stringify(replaceMap))
      this.logger.debug("开始替换正文，原文=>", JSON.stringify({ mdContent }))
      ret.mdContent = this.imageParser.replaceImagesWithImageItemArray(mdContent, replaceMap)
      this.logger.debug("图片链接替换完成，新正文=>", JSON.stringify({ newmdContent: ret.mdContent }))

      ret.flag = true
      this.logger.debug("正文替换完成，最终结果=>", ret)
    } catch (e: any) {
      ret.flag = false
      ret.errmsg = e.toString()
      this.logger.error("文章图片上传失败=>", e)
    }
    return ret
  }

  /**
   * 上传单张图片到图床（当前图片单个上传，提供给外部调用）
   *
   * 注意：所有的图片上传都会走这个
   *
   * @param pageId 文章ID
   * @param attrs 文章属性
   * @param imageItem 图片信息
   * @param forceUpload 强制上传
   * @param ignoreReplaceLink 忽略替换链接
   */
  public async uploadSingleImageToBed(
    pageId: string,
    attrs: any,
    imageItem: ImageItem,
    forceUpload?: boolean,
    ignoreReplaceLink = false
  ): Promise<void> {
    // Settings UI persists PicGo config through a reactive storage bridge.
    // Long-lived plugin runtimes (especially the mounted floating shell) can
    // otherwise keep using the in-memory config captured when the iframe was
    // first opened. Refresh immediately before every real upload so drag/drop,
    // button, clipboard and block-menu uploads all honor the latest workspace
    // `picgo.cfg.json`.
    this.ctx().reloadConfig()

    const mapInfoStr = attrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
    const fileMap = JsonUtil.safeParse<any>(mapInfoStr, {})
    this.logger.debug("fileMap=>", fileMap)

    // 处理上传
    const filePaths = []
    if (!forceUpload && !imageItem.isLocal) {
      this.logger.warn("非本地图片，忽略=>", imageItem.url)
      return
    }

    // 兼容剪贴板
    let imageFullPath: string | Blob | File
    // blob 或者 file 直接上传
    if (isFileOrBlob(imageItem.url)) {
      imageFullPath = imageItem.url
    } else {
      if (this.isSiyuanOrSiyuanNewWin) {
        // 如果是路径解析路径
        const win = SiyuanDevice.siyuanWindow()
        const dataDir: string = win.siyuan.config.system.dataDir
        imageFullPath = `${dataDir}/assets/${imageItem.name}`
        this.logger.info(`Will upload picture from ${imageFullPath}, imageItem =>`, {
          imageItem,
        })

        const fs = win.require("fs")
        if (!fs.existsSync(imageFullPath)) {
          // 路径不存在直接上传
          imageFullPath = imageItem.url
        }
      } else {
        // 浏览器环境直接上传
        imageFullPath = imageItem.url
      }
    }

    // noinspection SuspiciousTypeOfGuard
    if (!imageFullPath || (typeof imageFullPath === "string" && imageFullPath.trim().length == 0)) {
      this.logger.warn("upload from clipboard")
    } else {
      filePaths.push(imageFullPath)
    }
    this.logger.info("start uploading =>", filePaths)

    // 批量上传
    const imageJson: any = await this.originalUpload(filePaths)
    this.logger.debug("图片上传完成，imageJson=>", imageJson)
    let newImageItem: ImageItem
    const imageJsonObj = JsonUtil.safeParse(imageJson, []) as any
    // 处理后续
    if (imageJsonObj && imageJsonObj.length > 0) {
      const img = imageJsonObj[0]
      if (!img?.imgUrl || StrUtil.isEmptyString(img.imgUrl)) {
        throw new Error(
          "图片上传失败，可能原因：PicGO配置错误或者该平台不支持图片覆盖，请检查配置或者尝试上传新图片。请打开picgo.log查看更多信息"
        )
      }
      newImageItem = new ImageItem(imageItem.originUrl, img.imgUrl, false, imageItem.alt, imageItem.title)
      newImageItem.blockId = imageItem.blockId
      fileMap[newImageItem.hash] = newImageItem
    } else {
      throw new Error("图片上传失败，可能原因：PicGO配置错误，请检查配置。请打开picgo.log查看更多信息")
    }

    this.logger.debug("newFileMap=>", fileMap)

    if (!ignoreReplaceLink) {
      const newFileMapStr = JSON.stringify(fileMap)
      await this.siyuanApi.setBlockAttrs(pageId, {
        [SIYUAN_PICGO_FILE_MAP_KEY]: newFileMapStr,
      })
    }

    //处理链接替换
    if (!ignoreReplaceLink) {
      // 如果没有块 ID，则不替换
      if (StrUtil.isEmptyString(newImageItem.blockId)) {
        this.logger.warn("[单个上传] 图床未插入文档，不做链接替换")
      } else {
        // 不强制忽略则去查询配置
        const ctx = this.ctx()
        // 是否替换链接
        const SIYUAN_REPLACE_LINK = ctx.getConfig("siyuan.replaceLink") ?? true
        if (SIYUAN_REPLACE_LINK) {
          this.logger.info("[单个上传] 链接替换已开启，准备替换链接")

          const newImageBlock = await this.siyuanApi.getBlockByID(newImageItem.blockId)
          // newImageBlock.markdown
          // "![image](assets/image-20240327190812-yq6esh4.png)"
          this.logger.debug("[单个上传] newImageBlock.markdown", newImageBlock.markdown)
          // 如果查询出来的块信息不对，不更新，防止误更新
          if (!newImageBlock.markdown.includes(newImageItem.originUrl)) {
            this.logger.warn("[单个上传] 块信息不符合，取消更新", {
              newImageItem,
              newImageBlock,
            })
          } else {
            // =========================================================================================================
            // 正式更新替换
            // id: string
            // data: string
            // dataType?: "markdown" | "dom"
            const newImageContent = replaceImageLink(newImageBlock.markdown, newImageItem.originUrl, newImageItem.url)
            // const newImageContent = `![${newImageItem.alt}](${newImageItem.url})`
            this.logger.debug("[单个上传] repalced new block md", newImageContent)
            await this.siyuanApi.updateBlock(newImageItem.blockId, newImageContent, "markdown")

            this.logger.info("🤩图片链接替换成功")
          }
        }
      }
    } else {
      this.logger.info("当前调用方负责文档写入和元数据提交，跳过通用单图上传的链接替换与元数据写入")
    }

    return imageJsonObj
  }

  // ===================================================================================================================

  private ensureConfigInitialized(force = false): Promise<void> {
    const sharedState = force
      ? resetSiyuanPicGoMigrationState(this.configMigrationKey)
      : getOrCreateSiyuanPicGoMigrationState(this.configMigrationKey, this.paths)

    if (!force && (sharedState.status === "done" || this.isConfigMigrationMarkedDone())) {
      sharedState.status = "done"
      sharedState.error = undefined
      sharedState.promise = undefined
      this.cfgUpdating = false
      return Promise.resolve()
    }

    if (!force && sharedState.status === "failed") {
      this.cfgUpdating = false
      this.logger.warn(`PicGo config migration remains failed until explicit retry: ${sharedState.error ?? ""}`)
      return Promise.resolve()
    }

    if (!force && sharedState.status === "running" && sharedState.promise) {
      this.cfgUpdating = true
      return sharedState.promise.finally(() => {
        this.cfgUpdating = false
      })
    }

    sharedState.status = "running"
    sharedState.error = undefined
    sharedState.updatedAt = Date.now()
    this.cfgUpdating = true

    sharedState.promise = this.updateConfig()
      .then(() => {
        this.markConfigMigrationDone()
        sharedState.status = "done"
        sharedState.error = undefined
      })
      .catch((e) => {
        sharedState.status = "failed"
        sharedState.error = e instanceof Error ? e.message : String(e)
        this.logger.error(`PicGo config migration failed: ${sharedState.error}`)
      })
      .finally(() => {
        sharedState.updatedAt = Date.now()
        sharedState.promise = undefined
        this.cfgUpdating = false
      })

    return sharedState.promise
  }

  private isConfigMigrationMarkedDone(): boolean {
    const marker = this.ctx().getConfig<any>("siyuan.picgoMigration")
    return marker?.version === getSiyuanPicGoMigrationVersion() && marker?.status === "done"
  }

  private markConfigMigrationDone() {
    this.ctx().saveConfig({
      [getSiyuanPicGoMigrationMarkerKey()]: {
        version: getSiyuanPicGoMigrationVersion(),
        status: "done",
        updatedAt: Date.now(),
      },
    })
    markSiyuanPicGoMigrationDoneInBrowser(this.paths)
  }

  private async updateConfig() {
    // v2 路径契约：
    // - picgo.cfg.json 使用工作空间路径，适合随 SiYuan 同步
    // - runtime、插件依赖、external-picgo-cfg.json 继续使用本机 ~/.universal-picgo
    this.migrateV2WorkspaceConfig()

    // 初始化 zhi 运行时依赖到本机 runtime。这里仍然从插件安装目录复制到 ~/.universal-picgo/libs，
    // 但不再迁移或删除 [workspace]/data/storage/syp/picgo 整个目录。
    const workspaceDir = win?.siyuan?.config?.system?.workspaceDir ?? ""
    if (hasNodeEnv && workspaceDir !== "") {
      const path = win.require("path")

      // 迁移 zhiNpmPath
      const zhiNpmPathSetupJsPath = path.join(workspaceDir, "data", "plugins", "siyuan-plugin-picgo", "libs", "setup")
      const zhiNpmPathInfraPath = path.join(workspaceDir, "data", "plugins", "siyuan-plugin-picgo", "libs", "zhi-infra")
      await this.copyRuntimeFolder(zhiNpmPathSetupJsPath, path.join(this.picgoApi.picgo.baseDir, "libs", "setup"), true)
      await this.copyRuntimeFolder(zhiNpmPathInfraPath, path.join(this.picgoApi.picgo.baseDir, "libs", "zhi-infra"), true)
    }

    // `siyuan.proxy` 保存的是运行时端口，思源重启后会失效。
    // 代理地址改为请求时直接使用当前 window.location.origin，这里只清理历史字段。
    const ctx = this.ctx()
    ctx.removeConfig("siyuan", "proxy")
    this.logger.debug("siyuan.proxy deprecated and removed from picgo config")
  }

  private migrateV2WorkspaceConfig() {
    if (this.isConfigMigrationMarkedDone() || isSiyuanPicGoMigrationMarkedDone(this.paths)) {
      this.logger.info(`PicGo v2 migration ${getSiyuanPicGoMigrationVersion()} already marked done, skip`)
      return
    }

    const ctx = this.ctx()

    this.logger.info("PicGo v2 path contract =>", {
      configPath: ctx.configPath,
      baseDir: ctx.baseDir,
      pluginBaseDir: ctx.pluginBaseDir,
    })
    if (migrateV2WorkspacePicGoConfig(this.paths, this.logger)) {
      ctx.reloadConfig()
    }
  }

  private async copyRuntimeFolder(from: string, to: string, overwrite: boolean = false) {
    const fs = win.fs
    const existFrom = fs.existsSync(from)
    const existTo = fs.existsSync(to)

    if (!existFrom) {
      return
    }

    // 运行时依赖复制到本机目录，不删除源目录
    this.logger.info(`will copy runtime folder ${from} to ${to}`)
    try {
      if (existTo) {
        // 目的地存在复制
        await this.copyFolder(from, to, overwrite)
      } else {
        await this.copyFolder(from, to)
      }
    } catch (e) {
      this.logger.error(`copy ${from} to ${to} failed: ${e}`)
      throw e
    }
  }

  private async copyFolder(from: string, to: string, overwrite: boolean = false): Promise<any> {
    const fs = win.fs
    const path = win.require("path")

    if (overwrite) {
      await fs.promises.rmdir(to, { recursive: true })
    }

    const files = await fs.promises.readdir(from)
    for (const file of files) {
      if (file.startsWith(".")) {
        continue
      }
      const sourcePath = path.join(from, file)
      const destPath = path.join(to, file)

      const stats = await fs.promises.lstat(sourcePath)
      if (stats.isDirectory()) {
        await fs.promises.mkdir(destPath, { recursive: true })
        // 递归复制子文件夹
        await this.copyFolder(sourcePath, destPath)
      } else {
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) {
          await fs.promises.mkdir(destDir, { recursive: true })
        }
        await fs.promises.copyFile(sourcePath, destPath)
      }
    }
  }
}

export { SiyuanPicgoPostApi }
