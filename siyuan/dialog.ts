import PicgoPlugin from "./index"
import { Dialog } from "siyuan"
import { PageRoute } from "./pageRoute"
import { BrowserUtil } from "zhi-device"
import { createAppLogger } from "../src/utils/appLogger"

const logger = createAppLogger("page-util")

export const showPage = (pluginInstance: PicgoPlugin, pageKey: PageRoute) => {
  const isDark = document.documentElement.dataset.themeMode === "dark"
  const pageUrl = BrowserUtil.setUrlParameter(pageKey, "isDark", String(isDark))
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
    height: "550px",
  } as any)
}
