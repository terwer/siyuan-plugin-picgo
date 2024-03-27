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

export const initStatusBar = (pluginInstance: PicgoPlugin) => {
  const statusBarTemplate = document.createElement("template")
  statusBarTemplate.innerHTML = `<div class="toolbar__item b3-tooltips b3-tooltips__w" aria-label="update image status" style="font-size: 12px;"></div>`
  statusBarTemplate.content.firstElementChild.addEventListener("click", () => {})

  pluginInstance.statusBarElement = pluginInstance.addStatusBar({
    element: statusBarTemplate.content.firstElementChild as HTMLElement,
    position: "left",
  })
}

export const updateStatusBar = (pluginInstance: PicgoPlugin, statusText: string) => {
  // console.log(pluginInstance.statusBarElement)
  pluginInstance.statusBarElement.innerHTML = `<div class="toolbar__item b3-tooltips b3-tooltips__w" aria-label="update image status" style="font-size: 12px;">${statusText}</div>`
}
