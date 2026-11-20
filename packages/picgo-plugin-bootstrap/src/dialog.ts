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
import PageUtil, { type EditorScope } from "./utils/pageUtil"

export const buildPluginPageIndex = (pageKey: PageRoute, scope?: EditorScope) => {
  let pageUrl = String(pageKey)
  // 暗色模式
  // const isDark = document.documentElement.dataset.themeMode === "dark"
  // pageUrl = BrowserUtil.setUrlParameter(pageUrl, "isDark", String(isDark))
  // 页面ID与聚焦范围
  const editorScope = scope ?? PageUtil.getActiveEditorScope()
  pageUrl = BrowserUtil.setUrlParameter(pageUrl, "pageId", editorScope.pageId)
  if (editorScope.scopeBlockId) {
    pageUrl = BrowserUtil.setUrlParameter(pageUrl, "scopeBlockId", editorScope.scopeBlockId)
  }

  // 插件更新后宿主可能仍缓存旧的 index.html，导致页面继续加载旧资源；
  // 在 hash 前追加版本串让入口页始终取最新构建。
  return `/plugins/siyuan-plugin-picgo/?v=${Date.now()}#${pageUrl}`
}

/**
 * Legacy dialog-first entry kept as a compatibility/debug fallback.
 *
 * Normal plugin entry points should use the mounted shell from shell.ts.
 */
export const showDialogPage = (pluginInstance: PicgoPlugin, pageKey: PageRoute) => {
  const pageIndex = buildPluginPageIndex(pageKey)
  showIframePage(pluginInstance, pageIndex)
}

export const showPage = showDialogPage

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
    transparent: false,
    content: contentHtml,
    width: "60%",
    height: "650px",
  } as any)
}
