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

import { SiyuanConfig, SiyuanKernelApi } from "zhi-siyuan-api"
import { ElMessage } from "element-plus"

export const siyuanKernelApi = () => {
  const cfg = new SiyuanConfig()
  return new SiyuanKernelApi(cfg)
}

/**
 * 复制网页内容到剪贴板
 *
 * @param text - 待复制的文本
 */
export const copyToClipboardInBrowser = (text) => {
  if (navigator && navigator.clipboard) {
    // Copy the selected text to the clipboard
    navigator.clipboard.writeText(text).then(
      function () {
        // The text has been successfully copied to the clipboard
        ElMessage.success("复制成功")
      },
      function (e) {
        // An error occurred while copying the text
        ElMessage.error("复制失败=>" + e)
      }
    )
  } else {
    try {
      const input = document.createElement("input")
      input.style.position = "fixed"
      input.style.opacity = "0"
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      ElMessage.success("复制成功")
    } catch (e) {
      ElMessage.error("复制失败=>" + e)
    }
  }
}
