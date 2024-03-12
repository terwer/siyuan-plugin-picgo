import { isReactive, isRef, toRaw, unref } from "vue"
import { PicGo } from "zhi-picgo-core"

/**
 * 是否是Electron环境，等价于isInSiyuanOrSiyuanNewWin
 */
const isElectron = /Electron/.test(navigator.userAgent)

/**
 * 思源笔记或者思源笔记新窗口，等价于Electron环境
 */
const isInSiyuanOrSiyuanNewWin = () => {
  return isElectron
}

/**
 * 思源笔记Iframe挂件环境
 */
const isSiyuanWidget = () => {
  return (
    window.frameElement != null &&
    window.frameElement.parentElement != null &&
    window.frameElement.parentElement.parentElement != null &&
    window.frameElement.parentElement.parentElement.getAttribute("data-node-id") !== ""
  )
}

/**
 * 思源笔记新窗口
 */
export const isSiyuanNewWin = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return typeof window.terwer !== "undefined"
}

/**
 * 获取可操作的Window
 */
export const getSiyuanWindow = () => {
  if (isSiyuanWidget()) {
    return parent.window
  } else {
    if (isSiyuanNewWin()) {
      return window
    }
    return window
  }
}

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (Array.isArray(args)) {
    return args.map((item: any) => {
      if (item) {
        if (isRef(item)) {
          return unref(item)
        }
        if (isReactive(item)) {
          return toRaw(item)
        }
      }
      return getRawData(item)
    })
  }
  if (typeof args === "object") {
    const data = {}
    Object.keys(args).forEach((key) => {
      const item = args[key]
      if (item) {
        if (isRef(item)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          data[key] = unref(item)
        } else if (isReactive(item)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          data[key] = toRaw(item)
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          data[key] = getRawData(item)
        }
      }
    })
    return data
  }
  return args
}

/**
 * 获取Picgo对象
 */
export const getPicgoFromWindow = (): PicGo => {
  const syWin = getSiyuanWindow()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const syPicgo = syWin?.SyPicgo
  return syPicgo?.getPicgoObj() as PicGo
}

/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export const handleStreamlinePluginName = (name: string) => {
  if (/^@[^/]+\/picgo-plugin-/.test(name)) {
    return name.replace(/^@[^/]+\/picgo-plugin-/, "")
  } else {
    return name.replace(/picgo-plugin-/, "")
  }
}

/**
 * for just simple clone an object
 */
export const simpleClone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}
