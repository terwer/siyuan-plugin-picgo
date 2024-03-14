/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { icons } from "./utils/svg"
import PicgoPlugin from "./index"
import { showPage } from "./dialog"
import { PageRoute } from "./pageRoute"

/**
 * 顶栏按钮
 *
 * @param pluginInstance - 插件实例
 * @author terwer
 * @version 0.0.1
 * @since 0.0.1
 */
export function initTopbar(pluginInstance: PicgoPlugin) {
  const topBarElement = pluginInstance.addTopBar({
    icon: icons.iconTopbar,
    title: pluginInstance.i18n.picgo,
    position: "right",
    callback: () => {},
  })

  topBarElement.addEventListener("click", () => {
    showPage(pluginInstance, PageRoute.Page_Home)
  })
}
