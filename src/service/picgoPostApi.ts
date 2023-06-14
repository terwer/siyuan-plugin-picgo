/*
 * Copyright (c) 2023, Terwer . All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Terwer designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Terwer in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
 * or visit www.terwer.space if you need additional information or have any
 * questions.
 */

import { ImageParser } from "~/src/utils/parser/imageParser.ts"
import { SiyuanKernelApi } from "zhi-siyuan-api"
import { createAppLogger } from "~/src/utils/appLogger.ts"
import { isInSiyuanOrSiyuanNewWin, siyuanKernelApi } from "~/src/utils/utils.ts"
import { ImageItem } from "~/src/models/imageItem.ts"
import { ParsedImage } from "~/src/models/parsedImage.ts"
import { PicgoPostResult } from "~/src/models/picgoPostResult.ts"
import { appConstants } from "~/src/appConstants.ts"
import { JsonUtil, StrUtil } from "zhi-common"
import { ElMessage } from "element-plus"
import { SiyuanDevice } from "zhi-device"
import picgoUtil from "~/src/service/picgoUtil.js"

/**
 * Picgo与文章交互的通用方法
 */
export class PicgoPostApi {
  private readonly logger = createAppLogger("picgo-post-api")
  private readonly imageParser: ImageParser
  private readonly siyuanApi: SiyuanKernelApi
  private readonly isSiyuanOrSiyuanNewWin = isInSiyuanOrSiyuanNewWin()

  constructor() {
    this.imageParser = new ImageParser()
    this.siyuanApi = siyuanKernelApi()
  }

  /**
   * 将字符串数组格式的图片信息转换成图片对象数组
   *
   * @param attrs 文章属性
   * @param retImgs  字符串数组格式的图片信息
   */
  public async doConvertImagesToImagesItemArray(attrs, retImgs: ParsedImage[]): Promise<ImageItem[]> {
    const ret = [] as ImageItem[]
    for (let i = 0; i < retImgs.length; i++) {
      const retImg = retImgs[i]
      const originUrl = retImg.url
      let imgUrl = retImg.url

      // 获取属性存储的映射数据
      let fileMap = {}
      this.logger.debug("attrs=>", attrs)
      if (!StrUtil.isEmptyString(attrs[appConstants.PICGO_FILE_MAP_KEY])) {
        fileMap = JsonUtil.safeParse(attrs[appConstants.PICGO_FILE_MAP_KEY], {})
        this.logger.debug("fileMap=>", fileMap)
      }

      // 处理思源本地图片预览
      // 这个是从思源查出来解析的是否是本地
      if (retImg.isLocal) {
        const baseUrl = ""
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
      imageItem.url = decodeURIComponent(imageItem.url)
      this.logger.debug("imageItem=>", imageItem)
      ret.push(imageItem)
    }

    console.error("ret=>", ret)
    return ret
  }

  /**
   * 上传当前文章图片到图床
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

      const replaceMap = {}
      let hasLocalImages = false
      for (let i = 0; i < imageItemArray.length; i++) {
        const imageItem = imageItemArray[i]
        if (imageItem.originUrl.includes("assets")) {
          replaceMap[imageItem.hash] = imageItem
        }

        if (!imageItem.isLocal) {
          this.logger.warn("已经上传过图床，请勿重复上传=>", imageItem.originUrl)
          continue
        }

        hasLocalImages = true

        // 实际上传逻辑
        await this.uploadSingleImageToBed(pageId, attrs, imageItem)
        // 上传完成，需要获取最新链接
        const newattrs = await this.siyuanApi.getBlockAttrs(pageId)
        const newfileMap = JsonUtil.safeParse(newattrs[appConstants.PICGO_FILE_MAP_KEY], {})
        const newImageItem: ImageItem = newfileMap[imageItem.hash]
        replaceMap[imageItem.hash] = new ImageItem(
          newImageItem.originUrl,
          newImageItem.url,
          false,
          newImageItem.alt,
          newImageItem.title
        )
      }

      if (!hasLocalImages) {
        ElMessage.warning("未发现本地图片，不上传")
      }

      // 处理链接替换
      this.logger.debug("准备替换正文图片，replaceMap=>", JSON.stringify(replaceMap))
      this.logger.debug("开始替换正文，原文=>", JSON.stringify({ mdContent }))
      ret.mdContent = this.imageParser.replaceImagesWithImageItemArray(mdContent, replaceMap)
      this.logger.debug("图片链接替换完成，新正文=>", JSON.stringify({ newmdContent: ret.mdContent }))

      ret.flag = true
      this.logger.debug("正文替换完成，最终结果=>", ret)
    } catch (e) {
      ret.flag = false
      ret.errmsg = e
      this.logger.error("文章图片上传失败=>", e)
    }
    return ret
  }

  /**
   * 上传单张图片到图床
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
    const mapInfoStr = attrs[appConstants.PICGO_FILE_MAP_KEY] ?? "{}"
    const fileMap = JsonUtil.safeParse(mapInfoStr, {})
    this.logger.warn("fileMap=>", fileMap)

    // 处理上传
    const filePaths = []
    if (!forceUpload && !imageItem.isLocal) {
      this.logger.warn("非本地图片，忽略=>", imageItem.url)
      return
    }

    let imageFullPath
    if (this.isSiyuanOrSiyuanNewWin) {
      const win = SiyuanDevice.siyuanWindow()
      const dataDir: string = win.siyuan.config.system.dataDir
      imageFullPath = `${dataDir}/assets/${imageItem.name}`
      this.logger.info("Will upload picture from", imageFullPath)
    } else {
      imageFullPath = imageItem.url
    }
    this.logger.warn("isSiyuanOrSiyuanNewWin=>" + this.isSiyuanOrSiyuanNewWin + ", imageFullPath=>", imageFullPath)
    filePaths.push(imageFullPath)

    // 批量上传
    const imageJson: any = await picgoUtil.uploadByPicGO(filePaths)
    this.logger.warn("图片上传完成，imageJson=>", imageJson)
    const imageJsonObj = JSON.parse(imageJson)
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

    this.logger.warn("newFileMap=>", fileMap)

    const newFileMapStr = JSON.stringify(fileMap)
    await this.siyuanApi.setBlockAttrs(pageId, {
      [appConstants.PICGO_FILE_MAP_KEY]: newFileMapStr,
    })
  }
}
