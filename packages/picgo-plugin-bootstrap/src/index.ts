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
import { IPicGo, ImageItem, SIYUAN_PICGO_FILE_MAP_KEY, SiyuanPicGo, generateUniqueName } from "zhi-siyuan-picgo"
import { isDev, siyuanApiToken, siyuanApiUrl } from "./Constants"
import { ILogger } from "./appLogger"
import { showPage } from "./dialog"
import { PageRoute } from "./pageRoute"
import { initStatusBar, updateStatusBar } from "./statusBar"
import { initTopbar } from "./topbar"
import { replaceImageLink } from "zhi-siyuan-picgo/src"
import { JsTimer } from "./utils/utils"

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

    const SIYUAN_AUTO_UPLOAD = ctx.getConfig("siyuan.autoUpload") ?? true
    // 未启用自动上传，不上传
    if (!SIYUAN_AUTO_UPLOAD) {
      this.logger.warn("剪切板上传已禁用，不上传")
      return
    }

    const siyuanApi = picgoPostApi.siyuanApi
    if (files.length > 1) {
      await siyuanApi.pushErrMsg({
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
        // 是否替换链接
        const SIYUAN_REPLACE_LINK = ctx.getConfig("siyuan.replaceLink") ?? true
        // 处理上传后续
        await this.handleAfterUpload(ctx, siyuanApi, pageId, file, img, imageItem, SIYUAN_REPLACE_LINK)
      } else {
        this.noticeError(siyuanApi, "PicGO配置错误，请检查配置。")
      }
    } catch (e) {
      this.noticeError(siyuanApi, e.toString())
    }
  }

  private async handleAfterUpload(
    ctx: IPicGo,
    siyuanApi: any,
    pageId: string,
    file: any,
    img: any,
    oldImageitem: any,
    isReplaceLink: boolean
  ) {
    const SIYUAN_WAIT_SECONDS = ctx.getConfig("siyuan.waitTimeout") ?? 2
    const SIYUAN_RETRY_TIMES = ctx.getConfig("siyuan.retryTimes") ?? 5
    this.logger.debug("get siyuan upload cfg", {
      waitTimeout: SIYUAN_WAIT_SECONDS,
      retryTimes: SIYUAN_RETRY_TIMES,
    })
    this.noticeInfo(
      `剪贴板图片上传完成。准备每${SIYUAN_WAIT_SECONDS}秒轮询一次，${SIYUAN_RETRY_TIMES}次之后仍然失败则结束！`
    )

    // 改成轮询和重试
    const args = {
      pluginInstance: this,
      siyuanApi,
      pageId,
      file,
      img,
      oldImageitem,
      isReplaceLink,
    }
    const isSuccess = await JsTimer(
      this.doUpdatePictureMetadata,
      args,
      (count) => count >= SIYUAN_RETRY_TIMES,
      SIYUAN_WAIT_SECONDS * 1000
    )
    this.logger.info(`定时器已停止，处理结果：${isSuccess}`)
    if (isSuccess) {
      this.noticeInfo("😆图片链接替换成功")
    } else {
      siyuanApi.pushErrMsg({
        msg: "😭图片可能已经上传成功，但是链接替换失败",
        timeout: 7000,
      })
    }

    // @deprecated
    // 已废弃，旧的延迟做法
    // setTimeout(async () => {
    //   await this.doUpdatePictureMetadata(siyuanApi, pageId, file, img, oldImageitem)
    // }, SIYUAN_WAIT_SECONDS * 1000)
  }

  private async doUpdatePictureMetadata(args: any) {
    // args
    const pluginInstance: any = args.pluginInstance
    const siyuanApi: any = args.siyuanApi
    const pageId: string = args.pageId
    const file: any = args.file
    const img: any = args.img
    const oldImageitem: any = args.oldImageitem
    const isReplaceLink: boolean = args.isReplaceLink

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
      pluginInstance.noticeError(siyuanApi, "元数据更新失败，未找到图片元数据")
      return
    }
    const newFileMapStr = JSON.stringify(fileMap)
    await siyuanApi.setBlockAttrs(pageId, {
      [SIYUAN_PICGO_FILE_MAP_KEY]: newFileMapStr,
    })
    pluginInstance.logger.info("🤩图片元数据更新成功")

    // =================================================================================================================
    // 不替换链接
    if (!isReplaceLink) {
      pluginInstance.logger.warn("未启用链接替换，不做替换")
      return
    }
    // =================================================================================================================

    // 更新块
    const nodeId = pluginInstance.getDataNodeIdFromImgWithSrc(newImageItem.originUrl)
    if (!nodeId) {
      pluginInstance.noticeError(siyuanApi, "元数据更新失败，未找到图片块 ID")
      return
    }
    pluginInstance.logger.info("😆found image nodeId=>", nodeId)
    const newImageBlock = await siyuanApi.getBlockByID(nodeId)
    // newImageBlock.markdown
    // "![image](assets/image-20240327190812-yq6esh4.png)"
    pluginInstance.logger.debug("newImageBlock.markdown", newImageBlock.markdown)
    // 如果查询出来的块信息不对，不更新，防止误更新
    if (!newImageBlock.markdown.includes(newImageItem.originUrl)) {
      pluginInstance.noticeError(siyuanApi, "元数据更新失败，块信息不符合，取消更新")
      return
    }

    // id: string
    // data: string
    // dataType?: "markdown" | "dom"
    const newImageContent = replaceImageLink(newImageBlock.markdown, newImageItem.originUrl, newImageItem.url)
    // const newImageContent = `![${newImageItem.alt}](${newImageItem.url})`
    pluginInstance.logger.debug("repalced new block md", newImageContent)
    await siyuanApi.updateBlock(nodeId, newImageContent, "markdown")

    pluginInstance.noticeInfo("图片元数据更新成功")
  }

  /**
   * 在当前文档的 dom 中查找指定链接的图片
   *
   * @param srcValue
   * @private
   */
  private getDataNodeIdFromImgWithSrc(srcValue: string) {
    const imgElement = document.querySelector(`img[src="${srcValue}"]`)
    if (imgElement) {
      const parentDiv = imgElement.closest("div[data-node-id]")
      if (parentDiv) {
        const dataNodeId = parentDiv.getAttribute("data-node-id")
        return dataNodeId
      } else {
        this.logger.error("Parent div element with data-node-id attribute not found.")
        throw new Error("Parent div element with data-node-id attribute not found.")
      }
    } else {
      this.logger.error("Image element with specified src attribute not found.")
      throw new Error("Image element with specified src attribute not found.")
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
    updateStatusBar(this, `图片上传出错，错误原因：${msg}`)
  }
}
