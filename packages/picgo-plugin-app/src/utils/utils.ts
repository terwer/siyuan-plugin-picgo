/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { isReactive, isRef, toRaw, unref } from "vue"
import { ElMessage } from "element-plus"

/**
 * 复制网页内容到剪贴板
 *
 * @param text - 待复制的文本
 */
export const copyToClipboardInBrowser = (text: string) => {
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
    const data = {} as any
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
