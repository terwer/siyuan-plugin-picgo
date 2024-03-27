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
    try {
      siyuanApi.pushMsg({
        msg: "检测到剪贴板图片，正在上传，请勿进行任何操作...",
        timeout: 1000,
      })
      // pageId: string
      // attrs: any
      for (const file of files) {
        // 每次都要最新
        const attrs = await siyuanApi.getBlockAttrs(pageId)
        const imageItem = new ImageItem(generateUniqueName(), file as any, true, "", "")
        const imgInfos = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, true)
        this.logger.info("upload finished =>", imgInfos)
      }

      siyuanApi.pushMsg({
        msg: `剪贴板图片上传完成，成功上传 ${files.length}张图片`,
        timeout: 7000,
      })
    } catch (e) {
      siyuanApi.pushErrMsg({
        msg: "剪贴板图片上传失败 =>" + e.toString(),
        timeout: 7000,
      })
    }
  }
}
