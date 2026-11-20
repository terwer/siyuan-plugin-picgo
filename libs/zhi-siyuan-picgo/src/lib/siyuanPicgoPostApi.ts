/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import {
  IImgInfo,
  IPicGo,
  ReadyUnifiedPicGoConfigFacade,
  type ConfigDomain,
  type UnifiedConfigMigrationState,
  createUnifiedPicGoConfigFacade,
  hasNodeEnv,
  isFileOrBlob,
  win,
} from "universal-picgo"
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
  getSiyuanPicGoMigrationVersion,
  isSiyuanPicGoMigrationMarkedDone,
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
  private initPromise: Promise<void> | null
  private readonly configFacadePromise: Promise<ReadyUnifiedPicGoConfigFacade>
  private configFacade: ReadyUnifiedPicGoConfigFacade | null
  public cfgUpdating: boolean

  constructor(
    siyuanConfig: SiyuanConfigLike,
    isDev?: boolean,
    paths?: SiyuanPicGoPaths,
    storageAdapterFactory?: (dbPath: string) => import("universal-picgo-store").StorageAdapter
  ) {
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
    this.picgoApi = new SiyuanPicGoUploadApi(isDev, paths, storageAdapterFactory)
    const ctx = this.picgoApi.picgo
    this.paths = {
      configPath: ctx.configPath,
      externalConfigPath: paths?.externalConfigPath,
      siyuanConnectionConfigPath: paths?.siyuanConnectionConfigPath,
      workspaceDir: paths?.workspaceDir ?? win?.siyuan?.config?.system?.workspaceDir,
      baseDir: ctx.baseDir,
      pluginBaseDir: ctx.pluginBaseDir,
      zhiNpmPath: (ctx as any).zhiNpmPath,
    }
    this.cfgUpdating = false
    this.initPromise = null
    this.configFacade = null
    this.configFacadePromise = createUnifiedPicGoConfigFacade({
      siyuanConfig: siyuanConfig as any,
      paths: {
        configPath: this.paths.configPath,
        externalConfigPath: this.paths.externalConfigPath,
        siyuanConnectionConfigPath: this.paths.siyuanConnectionConfigPath,
        baseDir: this.paths.baseDir,
        runtimeDir: this.paths.baseDir,
        pluginBaseDir: this.paths.pluginBaseDir,
        zhiNpmPath: this.paths.zhiNpmPath,
        workspaceDir: this.paths.workspaceDir ?? win?.siyuan?.config?.system?.workspaceDir,
        homeDir: this.paths.baseDir,
      },
      storageAdapterFactory,
      isDev,
      getLogger: (name: string) => simpleLogger(name, "zhi-siyuan-picgo", isDev),
    })
  }

  /**
   * 内置 PicGo 上下文
   */
  public ctx(): IPicGo {
    return this.picgoApi.picgo
  }

  /** Wait for async storage initialization to complete. */
  public async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initInternal()
    }
    await this.initPromise
  }

  public getConfigMigrationState(): UnifiedConfigMigrationState {
    return this.getConfigFacade().getSnapshot().migration
  }

  public async getConfigMigrationStateAsync(): Promise<UnifiedConfigMigrationState> {
    const facade = await this.getConfigFacadeAsync()
    return facade.getMigrationState()
  }

  public waitForConfigMigration(): Promise<void> {
    return this.configFacadePromise.then(() => undefined)
  }

  public getConfigFacade(): ReadyUnifiedPicGoConfigFacade {
    if (!this.configFacade) {
      throw new Error("Unified config facade is not ready; await SiyuanPicgoPostApi.init() first")
    }
    return this.configFacade
  }

  public async getConfigFacadeAsync(): Promise<ReadyUnifiedPicGoConfigFacade> {
    await this.init()
    return this.getConfigFacade()
  }

  public getPasteTakeoverSnapshot() {
    return this.getConfigFacade().getSnapshot().pasteTakeover
  }

  public async retryConfigMigration(domains?: ConfigDomain[]): Promise<UnifiedConfigMigrationState> {
    const facade = await this.getConfigFacadeAsync()
    await facade.retryMigration(domains)
    await facade.flush()
    const snapshot = await facade.reload()
    await this.ctx().reloadConfigAsync()
    return snapshot.migration
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
      if (!StrUtil.isEmptyString(attrs[SIYUAN_PICGO_FILE_MAP_KEY])) {
        fileMap = JsonUtil.safeParse(attrs[SIYUAN_PICGO_FILE_MAP_KEY], {})
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
        // 注意：可能存在元数据没有的情况，这种情况要跳过
        if (newImageItem.isLocal === false) {
          imageItem.isLocal = false
          imageItem.url = newImageItem.url
        }
      }

      // imageItem.originUrl = decodeURIComponent(imageItem.originUrl)
      // imageItem.url = decodeURIComponent(imageItem.url)
      ret.push(imageItem)
    }

    return ret
  }

  /**
   * 查询文档中的图片块。
   *
   * 传入聚焦块 ID 时，只返回该块及其子块中的图片块；未传入或等于文档 ID 时，
   * 保持原来的整篇文档行为。聚焦范围由思源内核的标题子树语义确定，
   * 嵌套标题、列表等子块中的图片都会包含。
   *
   * @param rootId 文档 ID
   * @param scopeBlockId 聚焦块 ID，可选
   */
  public async getImageBlocksInScope(rootId: string, scopeBlockId?: string): Promise<any[]> {
    if (StrUtil.isEmptyString(scopeBlockId) || scopeBlockId === rootId) {
      return this.siyuanApi.getImageBlocksByID(rootId)
    }

    // 上面的空值检查已排除 undefined；这里显式收窄，避免 d.ts 生成时报类型错误。
    const scopeBlockIds = await this.resolveImageScopeBlockIds(scopeBlockId!)
    return this.queryImageBlocksInSubtree(rootId, scopeBlockIds)
  }

  /**
   * 收集聚焦块及其标题子块 ID。
   *
   * 标题下的内容块在 blocks 表中是标题的兄弟或子级，单靠 parent_id 递归无法
   * 覆盖嵌套标题，因此优先复用思源内核的 getHeadingChildrenIDs（与内核自带
   * “上传资源文件到图床”的聚焦语义一致）。接口不可用时至少保留聚焦块本身。
   */
  private async resolveImageScopeBlockIds(scopeBlockId: string): Promise<string[]> {
    const ids = new Set<string>([scopeBlockId])
    try {
      const headingChildren = (await this.siyuanApi.siyuanRequest("/api/block/getHeadingChildrenIDs", {
        id: scopeBlockId,
      })) as string[] | null
      if (Array.isArray(headingChildren)) {
        headingChildren.forEach((id) => {
          if (!StrUtil.isEmptyString(id)) {
            ids.add(id)
          }
        })
      }
    } catch (e) {
      this.logger.warn("查询聚焦块子块失败，仅使用聚焦块本身", e)
    }
    return [...ids]
  }

  /**
   * 查询聚焦子树内的图片块。
   *
   * 使用递归 CTE 展开所有后代，并按深度倒序返回，让正文中最内层的图片块优先，
   * 便于调用方把图片链接替换落到真正的图片所在块。SQL 使用显式 LIMIT，
   * 避免被思源的默认搜索条数截断。
   */
  private async queryImageBlocksInSubtree(rootId: string, scopeBlockIds: string[]): Promise<any[]> {
    if (!this.isValidBlockId(rootId)) {
      return []
    }

    const seedIds = scopeBlockIds.filter((id) => this.isValidBlockId(id)).map((id) => `'${id}'`)
    if (seedIds.length === 0) {
      return []
    }

    const sql = [
      "WITH RECURSIVE scope(id, depth) AS (",
      `  SELECT id, 0 FROM blocks WHERE id IN (${seedIds.join(", ")})`,
      "  UNION ALL",
      "  SELECT b.id, s.depth + 1 FROM blocks b JOIN scope s ON b.parent_id = s.id",
      "), dedup AS (",
      "  SELECT id, MAX(depth) AS depth FROM scope GROUP BY id",
      ")",
      "SELECT b.* FROM blocks b JOIN dedup d ON b.id = d.id",
      `WHERE b.root_id = '${rootId}' AND b.markdown LIKE '%![%'`,
      "ORDER BY d.depth DESC",
      "LIMIT 10000",
    ].join("\n")

    return (await this.siyuanApi.sql(sql)) as any[]
  }

  private isValidBlockId(id: string): boolean {
    return /^\d{14}-[a-z0-9]{7}$/.test(id)
  }

  // ===================================================================================================================

  /**
   * 解析文章中的本地图片
   *
   * 供「是否存在本地图片」判断（uploadMarkdownImages 前置检测）与上传流程复用，
   * 保证两处判据一致。
   *
   * @param pageId 文章ID
   * @param mdContent 文章的Markdown文本
   */
  public async parsePostLocalImages(pageId: string, mdContent: string): Promise<ParsedImage[]> {
    // 正文 Markdown 是本地图片的唯一判据：数据库、嵌入块等容器里的图片
    // 不属于思源的图片块（blocks 表中没有对应 img 记录），不能以图片块是否存在来决定
    // 「有没有图片」，否则会漏掉这些图片（publisher #1999）。
    const parsedLocalImages = this.imageParser.parseLocalImagesToArray(mdContent)
    if (parsedLocalImages.length === 0) {
      return []
    }

    // 图片块只用于定位链接回写目标；数据库/嵌入块图片没有图片块，blockId 留空即可。
    let imageBlocks: any[] = []
    try {
      imageBlocks = await this.siyuanApi.getImageBlocksByID(pageId)
    } catch (e) {
      this.logger.warn("查询文章图片块失败，继续按正文解析本地图片", e)
    }

    const uniqueLocalImages: ParsedImage[] = []
    const seenUrls = new Set<string>()
    for (const image of parsedLocalImages) {
      if (seenUrls.has(image.url)) {
        continue
      }
      seenUrls.add(image.url)

      // 同一张图片可能出现在多个图片块中，取第一个能匹配到该地址的块。
      const imageBlock = imageBlocks.find(
        (block: any) => typeof block?.markdown === "string" && block.markdown.includes(image.url)
      )
      uniqueLocalImages.push({ ...image, blockId: imageBlock?.id ?? "" })
    }

    return uniqueLocalImages
  }

  /**
   * 上传当前文章图片到图床（单篇文档所有图片全部批量上传，提供给外部调用，例如：发布工具）
   *
   * @param pageId 文章ID
   * @param attrs 文章属性
   * @param mdContent 文章的Markdown文本
   */
  public async uploadPostImagesToBed(pageId: string, attrs: any, mdContent: string): Promise<PicgoPostResult> {
    const ret = new PicgoPostResult()

    const uniqueLocalImages = await this.parsePostLocalImages(pageId, mdContent)

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

      const replaceMap = {} as any
      let hasLocalImages = false
      for (let i = 0; i < imageItemArray.length; i++) {
        const imageItem = imageItemArray[i]
        if (imageItem.originUrl.includes("assets")) {
          replaceMap[imageItem.hash] = imageItem
        }

        if (!imageItem.isLocal) {
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
      }

      // 处理链接替换
      ret.mdContent = this.imageParser.replaceImagesWithImageItemArray(mdContent, replaceMap)

      ret.flag = true
    } catch (e: any) {
      ret.flag = false
      ret.errmsg = e.toString()
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
  ): Promise<IImgInfo[]> {
    // Settings UI persists PicGo config through a reactive storage bridge.
    // Long-lived plugin runtimes (especially the mounted floating shell) can
    // otherwise keep using the in-memory config captured when the iframe was
    // first opened. Refresh immediately before every real upload so drag/drop,
    // button, clipboard and block-menu uploads all honor the latest workspace
    // `picgo.cfg.json`.
    await this.ctx().reloadConfigAsync()

    const mapInfoStr = attrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
    const fileMap = JsonUtil.safeParse<any>(mapInfoStr, {})

    // 处理上传
    const filePaths = []
    if (!forceUpload && !imageItem.isLocal) {
      return []
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
    } else {
      filePaths.push(imageFullPath)
    }

    // 批量上传
    const imageJson: any = await this.originalUpload(filePaths)
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
      } else {
        // 不强制忽略则去查询配置
        const ctx = this.ctx()
        // 是否替换链接
        const SIYUAN_REPLACE_LINK = ctx.getConfig("siyuan.replaceLink") ?? true
        if (SIYUAN_REPLACE_LINK) {

          const newImageBlock = await this.siyuanApi.getBlockByID(newImageItem.blockId)
          // newImageBlock.markdown
          // "![image](assets/image-20240327190812-yq6esh4.png)"
          // 如果查询出来的块信息不对，不更新，防止误更新
          if (!newImageBlock.markdown.includes(newImageItem.originUrl)) {
          } else {
            // =========================================================================================================
            // 正式更新替换
            // id: string
            // data: string
            // dataType?: "markdown" | "dom"
            const newImageContent = replaceImageLink(newImageBlock.markdown, newImageItem.originUrl, newImageItem.url)
            // const newImageContent = `![${newImageItem.alt}](${newImageItem.url})`
            await this.siyuanApi.updateBlock(newImageItem.blockId, newImageContent, "markdown")
          }
        }
      }
    } else {
    }

    return imageJsonObj as IImgInfo[]
  }

  // ===================================================================================================================

  private async initInternal(): Promise<void> {
    this.configFacade = await this.configFacadePromise
    await this.configFacade.flush()
    await (this.picgoApi.picgo as any).init?.()
    this.picgoApi.attachConfigFacade(this.configFacade)
    this.ctx().reloadConfig()
    await this.runLegacyRuntimeCompatibilityStep()
  }

  private async runLegacyRuntimeCompatibilityStep(): Promise<void> {
    this.cfgUpdating = true
    try {
      await this.updateConfig()
    } catch (e) {
      this.logger.warn("PicGo legacy runtime compatibility step failed", e)
    } finally {
      this.cfgUpdating = false
    }
  }

  private isConfigMigrationMarkedDone(): boolean {
    const marker = this.ctx().getConfig<any>("siyuan.picgoMigration")
    return marker?.version === getSiyuanPicGoMigrationVersion() && marker?.status === "done"
  }

  private async updateConfig() {
    // v3 路径契约：
    // - 用户配置 owner files（picgo.cfg.json、external-picgo-cfg.json、siyuan-cfg）
    //   已由 unified facade 映射到 workspace。
    // - 这里仅保留 v2 main-config copy 作为 legacy source/runtime 兼容步骤；
    //   runtime、插件依赖等 PC-only artifacts 继续使用本机 ~/.universal-picgo。
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
  }

  private migrateV2WorkspaceConfig() {
    if (this.isConfigMigrationMarkedDone() || isSiyuanPicGoMigrationMarkedDone(this.paths)) {
      return
    }

    const ctx = this.ctx()
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
