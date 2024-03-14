/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import PicgoPlugin from "./index"
import { Dialog } from "siyuan"
import { PageRoute } from "./pageRoute"
import { BrowserUtil } from "zhi-device"
import { createAppLogger } from "./appLogger"
import PageUtil from "./utils/pageUtil"

const logger = createAppLogger("page-util")

export const showPage = (pluginInstance: PicgoPlugin, pageKey: PageRoute) => {
  let pageUrl = String(pageKey)
  // 暗色模式
  // const isDark = document.documentElement.dataset.themeMode === "dark"
  // pageUrl = BrowserUtil.setUrlParameter(pageUrl, "isDark", String(isDark))
  // 页面ID
  const pageId = PageUtil.getPageId()
  pageUrl = BrowserUtil.setUrlParameter(pageUrl, "pageId", pageId)

  logger.info("open page =>", pageUrl)
  showIframePage(pluginInstance, `/plugins/siyuan-plugin-picgo/#${pageUrl}`)
}

const showIframePage = (pluginInstance: PicgoPlugin, pageIndex: string) => {
  const contentHtml = `<style>
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  </style>
  <iframe src="${pageIndex}" width="100%"></iframe>`

  new Dialog({
    title: pluginInstance.i18n.picgo,
    transparent: false,
    content: contentHtml,
    width: "60%",
    height: "650px",
  } as any)
}
