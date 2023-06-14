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
import { DeviceDetection, DeviceTypeEnum } from "zhi-device"
import { createAppLogger } from "~/src/utils/appLogger.ts"
import { isReactive, isRef, toRaw, unref } from "vue"

const logger = createAppLogger("utils")

export const isInSiyuanOrSiyuanNewWin = () => {
  const deviceType = DeviceDetection.getDevice()
  // 三种情况，主窗口、挂件、新窗口
  const isSiyuanOrSiyuanNewWin =
    deviceType === DeviceTypeEnum.DeviceType_Siyuan_MainWin ||
    deviceType === DeviceTypeEnum.DeviceType_Siyuan_NewWin ||
    deviceType === DeviceTypeEnum.DeviceType_Siyuan_Widget
  logger.debug("deviceType=>", deviceType)
  logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
  return isSiyuanOrSiyuanNewWin
}

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

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (Array.isArray(args)) {
    const data = args.map((item: any) => {
      if (isRef(item)) {
        return unref(item)
      }
      if (isReactive(item)) {
        return toRaw(item)
      }
      return getRawData(item)
    })
    return data
  }
  if (typeof args === "object") {
    const data = {} as IStringKeyMap
    Object.keys(args).forEach((key) => {
      const item = args[key]
      if (isRef(item)) {
        data[key] = unref(item)
      } else if (isReactive(item)) {
        data[key] = toRaw(item)
      } else {
        data[key] = getRawData(item)
      }
    })
    return data
  }
  return args
}

export const trimValues = (obj: IStringKeyMap) => {
  const newObj = {} as IStringKeyMap
  Object.keys(obj).forEach((key) => {
    newObj[key] = typeof obj[key] === "string" ? obj[key].trim() : obj[key]
  })
  return newObj
}
