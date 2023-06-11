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
