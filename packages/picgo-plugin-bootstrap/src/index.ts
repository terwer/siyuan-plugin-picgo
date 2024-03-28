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
import { generateUniqueName, ImageItem, IPicGo, SIYUAN_PICGO_FILE_MAP_KEY, SiyuanPicGo } from "zhi-siyuan-picgo"
import { initStatusBar, updateStatusBar } from "./statusBar"

export default class PicgoPlugin extends Plugin {
  private logger: ILogger
  public statusBarElement: any

  constructor(options: { app: App; id: string; name: string; i18n: IObject }) {
    super(options)

    this.logger = simpleLogger("index", "picgo-plugin", isDev)
  }

  onload() {
    initTopbar(this)
    initStatusBar(this)
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

    const pageId = detail?.protyle?.block.rootID
    if (!pageId) {
      this.logger.error("无法获取文档 ID")
      return
    }

    const files = detail.files
    if (!files || files.length == 0) {
      this.logger.debug("粘贴板无图片，跳过")
      return
    }

    const siyuanConfig = {
      apiUrl: siyuanApiUrl,
      password: siyuanApiToken,
    }
    const picgoPostApi = await SiyuanPicGo.getInstance(siyuanConfig as any, isDev)
    const ctx = picgoPostApi.ctx()
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
      this.noticeInfo("检测到剪贴板图片，正在上传，请勿进行刷新操作...")

      // pageId: string
      // attrs: any
      // 每次都要最新
      const attrs = await siyuanApi.getBlockAttrs(pageId)
      const imageItem = new ImageItem(generateUniqueName(), file as any, true, "", "")
      const imageJsonObj: any = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, true)

      // 处理后续
      if (imageJsonObj && imageJsonObj.length > 0) {
        const img = imageJsonObj[0]
        if (!img?.imgUrl || img.imgUrl.trim().length == 0) {
          this.noticeError(siyuanApi, "PicGO配置错误，请检查配置。")
          return
        }
        // 处理上传后续
        await this.handleAfterUpload(ctx, siyuanApi, pageId, file, img, imageItem)
      } else {
        this.noticeError(siyuanApi, "PicGO配置错误，请检查配置。")
      }
    } catch (e) {
      this.noticeError(siyuanApi, e.toString())
    }
  }

  private async handleAfterUpload(ctx: IPicGo, siyuanApi: any, pageId: string, file: any, img: any, oldImageitem: any) {
    const SIYUAN_WAIT_SECONDS = ctx.getConfig("siyuan.waitTimeout") || 10
    this.noticeInfo(`剪贴板图片上传完成。准备延迟${SIYUAN_WAIT_SECONDS}秒更新元数据，请勿刷新笔记！`)
    setTimeout(async () => {
      const formData = new FormData()
      formData.append("file[]", file)
      formData.append("id", pageId)
      const res = await siyuanApi.uploadAsset(formData)

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
        this.noticeError(siyuanApi, "元数据更新失败，未找到图片元数据")
        return
      }
      const newFileMapStr = JSON.stringify(fileMap)
      await siyuanApi.setBlockAttrs(pageId, {
        [SIYUAN_PICGO_FILE_MAP_KEY]: newFileMapStr,
      })

      // 更新块
      const nodeId = this.getDataNodeIdFromImgWithSrc(newImageItem.originUrl)
      if (!nodeId) {
        this.noticeError(siyuanApi, "元数据更新失败，未找到图片块 ID")
        return
      }
      this.logger.info("😆found image nodeId=>", nodeId)
      const newImageBlock = await siyuanApi.getBlockByID(nodeId)
      // newImageBlock.markdown
      // "![image](assets/image-20240327190812-yq6esh4.png)"
      // 如果查询出来的块信息不对，不更新，防止误更新
      if (!newImageBlock.markdown.includes(newImageItem.originUrl)) {
        this.noticeError(siyuanApi, "元数据更新失败，块信息不符合，取消更新")
        return
      }

      // id: string
      // data: string
      // dataType?: "markdown" | "dom"
      const newImageContent = `![${newImageItem.alt}](${newImageItem.url})`
      await siyuanApi.updateBlock(nodeId, newImageContent, "markdown")

      this.noticeInfo("图片元数据更新成功")
    }, SIYUAN_WAIT_SECONDS * 1000)
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

  private noticeInfo(msg: string) {
    updateStatusBar(this, msg)
  }

  private noticeError(siyuanApi: any, msg: string) {
    siyuanApi.pushErrMsg({
      msg: msg,
      timeout: 7000,
    })
    updateStatusBar(this, `剪贴板图片上传失败，错误原因：${msg}`)
  }
}
