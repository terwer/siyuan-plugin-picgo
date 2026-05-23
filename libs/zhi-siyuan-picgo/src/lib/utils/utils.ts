/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 复制网页内容到剪贴板。
 *
 * This helper intentionally stays UI-framework neutral. Product code may show
 * Element Plus messages around the returned boolean, but the reusable lib entry
 * must not import Vue/Element Plus just to expose clipboard utilities.
 *
 * @param text - 待复制的文本
 */
export const copyToClipboardInBrowser = async (text: string): Promise<boolean> => {
  try {
    if (navigator && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      const input = document.createElement("input")
      input.style.position = "fixed"
      input.style.opacity = "0"
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
    }
    return true
  } catch (e) {
    console.warn("复制失败=>", e)
    return false
  }
}

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  // 兼容空值
  if (!args) {
    return null
  }
  if (Array.isArray(args)) {
    const data = args.map((item: any) => {
      return getRawData(item)
    })
    return data
  }
  if (typeof args === "object") {
    const rawArgs = toPlainRaw(args)
    if (rawArgs !== args) {
      return getRawData(rawArgs)
    }
    const data = {} as any
    Object.keys(rawArgs).forEach((key) => {
      data[key] = getRawData(rawArgs[key])
    })
    return data
  }
  return args
}

function toPlainRaw(value: any) {
  if (value && typeof value === "object") {
    if (value.__v_isRef === true && "value" in value) {
      return value.value
    }
    if ("__v_raw" in value && typeof value.__v_raw === "object") {
      return value.__v_raw
    }
  }
  return value
}

export const trimValues = (obj: any) => {
  const newObj = {} as any
  Object.keys(obj).forEach((key) => {
    newObj[key] = typeof obj[key] === "string" ? obj[key].trim() : obj[key]
  })
  return newObj
}

export function generateUniqueName() {
  const currentTime = Math.floor(Date.now() / 1000) // 获取当前时间戳（秒级）

  function generateRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let randomString = ""
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  const randomString = generateRandomString(6) // 生成长度为6的随机字符串
  const uniqueName = `${currentTime}_${randomString}`
  return uniqueName + ".png"
}

/**
 * 替换图片链接
 *
 * // 测试用例
 * ```
 * const testString = "![image1](aaaa.png) ![image1](https://example.com/image-20240327190812-yq6es5.png) Some text here";
 * const imageLink = "image-20240327190812-yq6es5\\.png";
 * const newImageLink = "new-image.png";
 *
 * const replacedString = replaceImageLink(testString, imageLink, newImageLink);
 * console.log(replacedString);
 * ```
 *
 * @param str
 * @param imageLink
 * @param newImageLink
 * @returns
 */
export function replaceImageLink(str: string, imageLink: string, newImageLink: string) {
  const regex = new RegExp(`(!\\[[^\\]]*\\]\\([^)]*)${imageLink}(\\)(?![^\\[]*]))`, "g")
  return str.replace(regex, `$1${newImageLink}$2`)
}
