/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import { SiyuanPicGoUploadApi } from "./siyuanPicGoUploadApi"
import { hasNodeEnv, IPicGo, isFileOrBlob, win } from "universal-picgo"
import { ParsedImage } from "./models/ParsedImage"
import { ImageItem } from "./models/ImageItem"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./constants"
import { JsonUtil, StrUtil } from "zhi-common"
import { SiyuanConfig, SiyuanKernelApi } from "zhi-siyuan-api"
import { ImageParser } from "./parser/ImageParser"
import { PicgoPostResult } from "./models/PicgoPostResult"
import { DeviceDetection, DeviceTypeEnum, SiyuanDevice } from "zhi-device"
import { IImgInfo } from "universal-picgo/src"

/**
 * Picgo与文章交互的通用方法
 */
class SiyuanPicgoPostApi {
  private readonly logger: ILogger
  private readonly imageParser: ImageParser
  public readonly siyuanApi: SiyuanKernelApi
  private readonly siyuanConfig: SiyuanConfig
  private readonly isSiyuanOrSiyuanNewWin: boolean
  private readonly picgoApi: SiyuanPicGoUploadApi
  public cfgUpdating: boolean

  constructor(siyuanConfig: SiyuanConfig, isDev?: boolean) {
    this.logger = simpleLogger("picgo-post-api", "zhi-siyuan-picgo", isDev)

    this.imageParser = new ImageParser(isDev)

    this.siyuanConfig = siyuanConfig
    this.siyuanApi = new SiyuanKernelApi(siyuanConfig)

    this.isSiyuanOrSiyuanNewWin = (() => {
      const deviceType = DeviceDetection.getDevice()
      // 三种情况，主窗口、挂件、新窗口
      const isSiyuanOrSiyuanNewWin =
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_MainWin ||
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_RendererWin ||
        deviceType === DeviceTypeEnum.DeviceType_Siyuan_Widget
      this.logger.debug("deviceType=>", deviceType)
      this.logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
      return isSiyuanOrSiyuanNewWin
    })()

    // 初始化 PicGO
    this.picgoApi = new SiyuanPicGoUploadApi(isDev)
    this.cfgUpdating = false

    this.updateConfig()
  }

  /**
   * 内置 PicGo 上下文
   */
  public ctx(): IPicGo {
    return this.picgoApi.picgo
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
      // fileMap 查出来的是是否上传，上传了，isLocal就false
      if (fileMap[imageItem.hash]) {
        const newImageItem = fileMap[imageItem.hash]
        this.logger.debug("newImageItem=>", newImageItem)
        if (!newImageItem.isLocal) {
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
   * 上传当前文章图片到图床（单篇文档所有图片全部批量上传，提供给外部调用）
   *
   * @param pageId 文章ID
   * @param attrs 文章属性
   * @param mdContent 文章的Markdown文本
   */
  public async uploadPostImagesToBed(pageId: string, attrs: any, mdContent: string): Promise<PicgoPostResult> {
    const ret = new PicgoPostResult()

    const localImages = this.imageParser.parseLocalImagesToArray(mdContent)
    const uniqueLocalImages = [...new Set([...localImages])]
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

      const replaceMap = {} as any
      let hasLocalImages = false
      for (let i = 0; i < imageItemArray.length; i++) {
        const imageItem = imageItemArray[i]
        if (imageItem.originUrl.includes("assets")) {
          replaceMap[imageItem.hash] = imageItem
        }

        if (!imageItem.isLocal) {
          this.logger.debug("已经上传过图床，请勿重复上传=>", imageItem.originUrl)
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
        } catch (e) {
          newattrs = attrs
          isLocal = true
          newImageItem = imageItem
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
   * @param pageId 文章ID
   * @param attrs 文章属性
   * @param imageItem 图片信息
   * @param forceUpload 强制上传
   */
  public async uploadSingleImageToBed(
    pageId: string,
    attrs: any,
    imageItem: ImageItem,
    forceUpload?: boolean
  ): Promise<void> {
    const mapInfoStr = attrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
    const fileMap = JsonUtil.safeParse<any>(mapInfoStr, {})
    this.logger.warn("fileMap=>", fileMap)

    // 处理上传
    const filePaths = []
    if (!forceUpload && !imageItem.isLocal) {
      this.logger.warn("非本地图片，忽略=>", imageItem.url)
      return
    }

    // 兼容剪贴板
    if (!StrUtil.isEmptyString(imageItem.url)) {
      let imageFullPath: string
      // blob 或者 file 直接上传
      if (isFileOrBlob(imageItem.url)) {
        imageFullPath = imageItem.url
      } else {
        if (this.isSiyuanOrSiyuanNewWin) {
          // 如果是路径解析路径
          const win = SiyuanDevice.siyuanWindow()
          const dataDir: string = win.siyuan.config.system.dataDir
          imageFullPath = `${dataDir}/assets/${imageItem.name}`
          this.logger.info(`Will upload picture from ${imageFullPath}, imageItem =>`, imageItem)

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

      this.logger.warn("isSiyuanOrSiyuanNewWin=>" + this.isSiyuanOrSiyuanNewWin + ", imageFullPath=>", imageFullPath)
      filePaths.push(imageFullPath)
    }

    // 批量上传
    const imageJson: any = await this.originalUpload(filePaths)
    this.logger.debug("图片上传完成，imageJson=>", imageJson)
    const imageJsonObj = JsonUtil.safeParse(imageJson, []) as any
    // 处理后续
    if (imageJsonObj && imageJsonObj.length > 0) {
      const img = imageJsonObj[0]
      if (!img?.imgUrl || StrUtil.isEmptyString(img.imgUrl)) {
        throw new Error(
          "图片上传失败，可能原因：PicGO配置错误或者该平台不支持图片覆盖，请检查配置或者尝试上传新图片。请打开picgo.log查看更多信息"
        )
      }
      const newImageItem = new ImageItem(imageItem.originUrl, img.imgUrl, false, imageItem.alt, imageItem.title)
      fileMap[newImageItem.hash] = newImageItem
    } else {
      throw new Error("图片上传失败，可能原因：PicGO配置错误，请检查配置。请打开picgo.log查看更多信息")
    }

    this.logger.debug("newFileMap=>", fileMap)

    const newFileMapStr = JSON.stringify(fileMap)
    await this.siyuanApi.setBlockAttrs(pageId, {
      [SIYUAN_PICGO_FILE_MAP_KEY]: newFileMapStr,
    })

    return imageJsonObj
  }

  // ===================================================================================================================

  private updateConfig() {
    // 迁移旧插件配置
    let legacyCfgfolder = ""
    // 初始化思源 PicGO 配置
    const workspaceDir = win?.siyuan?.config?.system?.workspaceDir ?? ""
    if (hasNodeEnv && workspaceDir !== "") {
      const path = win.require("path")
      legacyCfgfolder = path.join(workspaceDir, "data", "storage", "syp", "picgo")
      // 如果新插件采用了不同的目录，需要迁移旧插件 node_modules 文件夹
      if (legacyCfgfolder !== this.picgoApi.picgo.baseDir) {
        void this.moveFile(legacyCfgfolder, this.picgoApi.picgo.baseDir)
      }
    }

    // 旧的配置位置
    // [工作空间]/data/storage/syp/picgo/picgo.cfg.json
    //    [工作空间]/data/storage/syp/picgo/package.json
    //    [工作空间]/data/storage/syp/picgo/mac.applescript
    //    [工作空间]/data/storage/syp/picgo/i18n-cli
    //    [工作空间]/data/storage/syp/picgo/picgo-clipboard-images
    //
    // 新配置位置
    // ~/.universal-picgo
  }

  private async moveFile(from: string, to: string) {
    const fs = win.fs
    const existFrom = fs.existsSync(from)
    const existTo = fs.existsSync(to)

    if (!existFrom) {
      return
    }

    // 存在旧文件采取迁移
    this.cfgUpdating = true
    this.logger.info(`will move ${from} to ${to}`)
    // 目的地存在复制
    if (existTo) {
      this.copyFolder(from, to)
        .then(() => {
          this.cfgUpdating = false
        })
        .catch((e: any) => {
          this.cfgUpdating = false
          this.logger.error(`copy ${from} to ${to} failed: ${e}`)
        })
    } else {
      // 不存在移动过去
      fs.promises
        .rename(from, to)
        .then(() => {
          this.cfgUpdating = false
        })
        .catch((e: any) => {
          this.cfgUpdating = false
          this.logger.error(`move ${from} to ${to} failed: ${e}`)
        })
    }
  }

  private async copyFolder(from: string, to: string) {
    const fs = win.fs
    const path = win.require("path")

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
        await fs.promises.copyFile(sourcePath, destPath)
      }
    }

    // 删除源文件夹
    await fs.promises.rmdir(from, { recursive: true })
  }
}

export { SiyuanPicgoPostApi }
