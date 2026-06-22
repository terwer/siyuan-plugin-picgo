// noinspection TypeScriptValidateJSTypes

/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { App, Dialog, IObject, Plugin, confirm } from "siyuan"
import { simpleLogger } from "zhi-lib-base"
import { ImageItem, SiyuanPicGo } from "zhi-siyuan-picgo"
import { isDev, siyuanApiToken, siyuanApiUrl } from "./Constants"
import { ILogger } from "./appLogger"
import { showPage } from "./dialog"
import { PageRoute } from "./pageRoute"
import { initStatusBar, updateStatusBar } from "./statusBar"
import { initTopbar } from "./topbar"
import { destroyPluginShell, openPluginShell } from "./shell"
import { PasteEventAdapter } from "./paste/PasteEventAdapter"
import { PasteUploadTransaction } from "./paste/PasteUploadTransaction"
import { icons } from "./utils/svg"

export default class PicgoPlugin extends Plugin {
  private logger: ILogger
  public statusBarElement: any
  private readonly pasteEventAdapter: PasteEventAdapter

  constructor(options: { app: App; id: string; name: string; i18n: IObject }) {
    super(options)

    this.logger = simpleLogger("index", "picgo-plugin", isDev)
    this.pasteEventAdapter = new PasteEventAdapter()
  }

  onload() {
    initTopbar(this)
    initStatusBar(this)
    this.addCommand({
      langKey: "openPicgoDialogFallback",
      langText: "PicGo 旧版 Dialog 调试入口",
      hotkey: "",
      callback: () => this.openDialogFallback(PageRoute.Page_Home),
    })
    this.logger.info("PicGo Plugin loaded")
  }

  openSetting() {
    openPluginShell(this, PageRoute.Page_Setting)
  }

  openDialogFallback(pageKey: PageRoute = PageRoute.Page_Home) {
    showPage(this, pageKey)
  }

  onLayoutReady() {
    // onEvent
    this.onEvent()
  }

  onunload() {
    // offEvent
    this.offEvent()
    destroyPluginShell()
  }

  // ================
  // private methods
  // ================

  private async onEvent() {
    this.eventBus.on("paste", this.picturePasteEventListener)
    this.eventBus.on("open-menu-image", this.pictureBlockEventListener)
    this.logger.info("注册粘贴事件完成")
    this.logger.info("注册图片菜单完成")
  }

  private offEvent() {
    this.eventBus.off("paste", this.picturePasteEventListener)
    this.eventBus.off("open-menu-image", this.pictureBlockEventListener)
    this.logger.info("销毁粘贴事件完成")
    this.logger.info("销毁图片菜单完成")
  }

  /**
   * 添加图片粘贴事件
   */
  protected readonly picturePasteEventListener = async (e: CustomEvent) => {
    const siyuanConfig = {
      apiUrl: siyuanApiUrl,
      password: siyuanApiToken,
    }
    const picgoPostApi = await SiyuanPicGo.getInstance(siyuanConfig as any, isDev)
    const ctx = picgoPostApi.ctx()
    ctx.reloadConfig()
    const siyuanApi = picgoPostApi.siyuanApi

    // PicGo 3.0: Use prewarmed config from the ctx snapshot instead of
    // reading window.localStorage. Legacy reads are only allowed in
    // migration importers and tests.
    const takeover = this.pasteEventAdapter.tryTakeoverWithConfig(e, {
      autoUpload: ctx.getConfig<boolean>("siyuan.autoUpload", true),
      allowPicAndText: ctx.getConfig<boolean>("siyuan.txtImageSwitch", false),
    })

    if (!takeover.taken || !takeover.snapshot) {
      if (takeover.reason === "multiple-files-unsupported") {
        await siyuanApi.pushErrMsg({
          msg: "仅支持一次性上传单张图片",
          timeout: 7000,
        })
      } else if (takeover.reason === "default-prevention-unavailable") {
        await siyuanApi.pushErrMsg({
          msg: "当前思源粘贴事件不支持默认行为阻断，已取消 PicGo 自动接管，避免双上传。",
          timeout: 7000,
        })
      } else {
        this.logger.debug("粘贴事件未被 PicGo 接管", takeover.reason)
      }
      return
    }

    const transaction = new PasteUploadTransaction({
      ctx,
      picgoPostApi,
      siyuanApi,
      logger: this.logger,
      notifyInfo: (msg) => this.noticeInfo(msg),
      notifySuccess: (msg) => this.noticeSuccess(siyuanApi, msg),
      notifyError: (msg) => this.noticeError(siyuanApi, msg),
    })

    await transaction.execute(takeover.snapshot)
  }

  /**
   * 块菜单事件
   */
  protected readonly pictureBlockEventListener = async (e: CustomEvent) => {
    // 获取菜单信息
    const detail = e.detail
    this.logger.debug("detail =>", detail)

    const pageId = detail?.protyle?.block.rootID
    if (!pageId) {
      this.logger.error("无法获取文档 ID")
      return
    }

    // 获取块菜单上下文
    const context: any = detail?.menu?.menus
    if (!context) {
      this.logger.error("获取图片菜单失败")
      return
    }
    this.logger.debug("当前上下文 =>", context)

    const elem = detail.element as HTMLElement
    const img = elem.querySelector("img")
    const imageUrl = img.getAttribute("src")
    const alt = img.getAttribute("alt")
    this.logger.info("current image url =>", imageUrl)

    // 使用 PicGo 插件上传
    context.push({
      iconHTML: `<span class="iconfont-icon">${icons.iconTopbar}</span>`,
      label: this.i18n.uploadToBed,
      click: async () => {
        const siyuanConfig = {
          apiUrl: siyuanApiUrl,
          password: siyuanApiToken,
        }
        const picgoPostApi = await SiyuanPicGo.getInstance(siyuanConfig as any, isDev)
        picgoPostApi.ctx().reloadConfig()
        const siyuanApi = picgoPostApi.siyuanApi

        const nodeId = this.getDataNodeIdFromImgWithSrc(imageUrl)
        if (!nodeId) {
          this.noticeError(siyuanApi, "未找到图片块 ID，无法上传图片")
          return
        }
        this.logger.info("😆found image nodeId=>", nodeId)

        const that = this
        if (/^(http|https):\/\//i.test(imageUrl)) {
          confirm("温馨提示", "已经是远程图片，是否仍然上传？", async (dialog: Dialog) => {
            await that.doSelectedPictureUpload(picgoPostApi, siyuanApi, pageId, nodeId, imageUrl, false, alt)
          })
        } else {
          await this.doSelectedPictureUpload(picgoPostApi, siyuanApi, pageId, nodeId, imageUrl, true, alt)
        }
      },
    })
  }
  // ===================================================================================================================

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

  private noticeSuccess(siyuanApi: any, msg: string) {
    siyuanApi.pushMsg({
      msg: msg,
      timeout: 3000,
    })
    updateStatusBar(this, msg)
  }

  private noticeError(siyuanApi: any, msg: string) {
    siyuanApi.pushErrMsg({
      msg: msg,
      timeout: 7000,
    })
    updateStatusBar(this, `图片上传出错，错误原因：${msg}`)
  }

  // ===================================================================================================================
  private async doSelectedPictureUpload(
    picgoPostApi: any,
    siyuanApi: any,
    pageId: string,
    blockId: string,
    imageUrl: string,
    isLocal: boolean,
    alt?: string,
    title?: string
  ) {
    try {
      this.noticeInfo("正在上传图片到 PicGo 图床...")

      // pageId: string
      // attrs: any
      // 每次都要最新
      picgoPostApi.ctx().reloadConfig()
      const attrs = await siyuanApi.getBlockAttrs(pageId)
      let url = imageUrl
      if (isLocal) {
        url = `${siyuanApiUrl}/${imageUrl}`
      }
      const imageItem = new ImageItem(imageUrl, url, isLocal, alt ?? "", title ?? "")
      imageItem.blockId = blockId
      this.logger.info("doSelectedPictureUpload imageItem =>", imageItem)
      // 直接替换
      await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, true, false)
      this.noticeSuccess(siyuanApi, "🎉图片上传成功")
    } catch (e) {
      this.noticeError(siyuanApi, "😭图片上传失败，错误信息：" + e)
    }
  }
}
