// noinspection TypeScriptValidateJSTypes

/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { App, IObject, Plugin } from "siyuan"
import { simpleLogger } from "zhi-lib-base"
import { isDev, siyuanApiToken, siyuanApiUrl } from "./Constants"
import { initTopbar } from "./topbar"
import { showPage } from "./dialog"
import { PageRoute } from "./pageRoute"
import { ILogger } from "./appLogger"
import { generateUniqueName, ImageItem, SiyuanPicGo } from "zhi-siyuan-picgo"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "zhi-siyuan-picgo/src/lib/constants"

export default class PicgoPlugin extends Plugin {
  private logger: ILogger

  constructor(options: { app: App; id: string; name: string; i18n: IObject }) {
    super(options)

    this.logger = simpleLogger("index", "picgo-plugin", isDev)
  }

  onload() {
    initTopbar(this)
    this.logger.info("PicGo Plugin loaded")
  }

  openSetting() {
    showPage(this, PageRoute.Page_Setting)
  }

  onLayoutReady() {
    // onEvent
    this.onEvent()
  }

  onunload() {
    // offEvent
    this.offEvent()
  }

  // ================
  // private methods
  // ================

  private async onEvent() {
    this.eventBus.on("paste", this.picturePasteEventListener)
  }

  private offEvent() {
    this.eventBus.off("paste", () => {})
  }

  /**
   * 添加图片粘贴事件
   */
  protected readonly picturePasteEventListener = async (e: CustomEvent) => {
    // 获取菜单信息
    const detail = e.detail
    this.logger.info("detail =>", detail)

    const pageId = detail?.protyle?.block.rootID
    if (!pageId) {
      this.logger.error("无法获取文档 ID")
      return
    }
    this.logger.info("当前文档 ID =>", pageId)

    const files = detail.files
    if (!files || files.length == 0) {
      this.logger.debug("粘贴板无图片，跳过")
      return
    }
    this.logger.debug("当前文件列表 =>", files)

    const siyuanConfig = {
      apiUrl: siyuanApiUrl,
      password: siyuanApiToken,
    }
    const picgoPostApi = await SiyuanPicGo.getInstance(siyuanConfig as any, isDev)
    const siyuanApi = picgoPostApi.siyuanApi
    if (files.length > 1) {
      siyuanApi.pushErrMsg({
        msg: "仅支持一次性上传单张图片",
        timeout: 7000,
      })
      return
    }
    const file = files[0]

    try {
      siyuanApi.pushMsg({
        msg: "检测到剪贴板图片，正在上传，请勿进行任何操作...",
        timeout: 1000,
      })

      // pageId: string
      // attrs: any
      // 每次都要最新
      const attrs = await siyuanApi.getBlockAttrs(pageId)
      const imageItem = new ImageItem(generateUniqueName(), file as any, true, "", "")
      const imageJsonObj: any = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, true)
      this.logger.info("picbed upload res =>", imageJsonObj)

      // 处理后续
      if (imageJsonObj && imageJsonObj.length > 0) {
        const img = imageJsonObj[0]
        if (!img?.imgUrl || img.imgUrl.trim().length == 0) {
          throw new Error(
            "图片上传失败，可能原因：PicGO配置错误或者该平台不支持图片覆盖，请检查配置或者尝试上传新图片。请打开picgo.log查看更多信息"
          )
        }
        // 处理上传后续
        await this.handleAfterUpload(siyuanApi, pageId, file, img, imageItem)
      } else {
        throw new Error("图片上传失败，可能原因：PicGO配置错误，请检查配置。请打开picgo.log查看更多信息")
      }
    } catch (e) {
      siyuanApi.pushErrMsg({
        msg: "剪贴板图片上传失败 =>" + e.toString(),
        timeout: 7000,
      })
    }
  }

  private async handleAfterUpload(siyuanApi: any, pageId: string, file: any, img: any, oldImageitem: any) {
    const WAIT_SECONDS = 10
    siyuanApi.pushMsg({
      msg: `剪贴板图片上传完成。准备延迟${WAIT_SECONDS}秒更新元数据，请勿刷新笔记！`,
      timeout: 7000,
    })
    setTimeout(async () => {
      const formData = new FormData()
      formData.append("file[]", file)
      formData.append("id", pageId)
      const res = await siyuanApi.uploadAsset(formData)
      this.logger.debug("siyuan upload res =>", res)

      // 更新 PicGo fileMap 元数据，因为上面上传更新了，这里需要在查询一次
      const newAttrs = await siyuanApi.getBlockAttrs(pageId)
      const mapInfoStr = newAttrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
      let fileMap = {}
      try {
        fileMap = JSON.parse(mapInfoStr)
      } catch (e) {
        // ignore
      }
      const succMap = res.succMap
      let newImageItem: any
      // noinspection LoopStatementThatDoesntLoopJS
      for (const [key, value] of Object.entries(succMap)) {
        // 删除旧的
        delete fileMap[oldImageitem.hash]

        // 只遍历里第一项
        newImageItem = new ImageItem(value as string, img.imgUrl, false, key, key)
        fileMap[newImageItem.hash] = newImageItem
        break
      }
      if (!newImageItem) {
        siyuanApi.pushErrMsg({
          msg: `未找到图片元数据`,
          timeout: 7000,
        })
      }
      const newFileMapStr = JSON.stringify(fileMap)
      await siyuanApi.setBlockAttrs(pageId, {
        [SIYUAN_PICGO_FILE_MAP_KEY]: newFileMapStr,
      })

      // 更新块
      const nodeId = this.getDataNodeIdFromImgWithSrc(newImageItem.originUrl)
      if (!nodeId) {
        siyuanApi.pushErrMsg({
          msg: `未找到图片块 ID`,
          timeout: 7000,
        })
        return
      }
      this.logger.info("😆found image nodeId=>", nodeId)
      const newImageBlock = await siyuanApi.getBlockByID(nodeId)
      // newImageBlock.markdown
      // "![image](assets/image-20240327190812-yq6esh4.png)"
      // id: string
      // data: string
      // dataType?: "markdown" | "dom"
      this.logger.debug("new image block=>", newImageBlock)
      const newImageContent = `![${newImageItem.alt}](${newImageItem.url})`
      await siyuanApi.updateBlock(nodeId, newImageContent, "markdown")

      siyuanApi.pushMsg({
        msg: `图片元数据更新成功`,
        timeout: 7000,
      })
    }, WAIT_SECONDS * 1000)
  }

  private getDataNodeIdFromImgWithSrc(srcValue: string) {
    const imgElement = document.querySelector(`img[src="${srcValue}"]`)
    if (imgElement) {
      const parentDiv = imgElement.closest("div[data-node-id]")
      if (parentDiv) {
        const dataNodeId = parentDiv.getAttribute("data-node-id")
        return dataNodeId
      } else {
        this.logger.error("Parent div element with data-node-id attribute not found.")
        return null
      }
    } else {
      this.logger.error("Image element with specified src attribute not found.")
      return null
    }
  }
}
