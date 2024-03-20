/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IImgSize, IPathTransformedImgInfo, IPicGo, IPluginNameType } from "../types"
import { hasNodeEnv, win } from "universal-picgo-store"
import imageSize from "./image-size"

export const isUrl = (url: string): boolean => url.startsWith("http://") || url.startsWith("https://")

export const isUrlEncode = (url: string): boolean => {
  url = url || ""
  try {
    // the whole url encode or decode shold not use encodeURIComponent or decodeURIComponent
    return url !== decodeURI(url)
  } catch (e) {
    // if some error caught, try to let it go
    return false
  }
}
export const handleUrlEncode = (url: string): string => {
  if (!isUrlEncode(url)) {
    url = encodeURI(url)
  }
  return url
}

export const getFSFile = async (filePath: string): Promise<IPathTransformedImgInfo> => {
  try {
    const fs = win.fs
    const path = win.require("path")
    return {
      extname: path.extname(filePath),
      fileName: path.basename(filePath),
      buffer: await fs.promises.readFile(filePath),
      success: true,
    }
  } catch {
    return {
      reason: `read file ${filePath} error`,
      success: false,
    }
  }
}

export const getURLFile = async (url: string, ctx: IPicGo): Promise<IPathTransformedImgInfo> => {
  url = handleUrlEncode(url)
  let isImage = false
  let extname = ""
  let timeoutId: any

  const requestFn = new Promise<IPathTransformedImgInfo>((resolve, reject) => {
    ;(async () => {
      try {
        const res = await ctx
          .request({
            method: "get",
            url,
            resolveWithFullResponse: true,
            responseType: "arraybuffer",
          })
          .then((resp: any) => {
            const contentType = resp.headers["content-type"]
            if (contentType?.includes("image")) {
              isImage = true
              extname = `.${contentType.split("image/")[1]}`
            }
            return resp.data as typeof win.ArrayBuffer
          })
        clearTimeout(timeoutId)
        if (isImage) {
          const urlPath = new URL(url).pathname
          const fileName = urlPath.split("/").pop()
          // if (hasNodeEnv) {
          //   const path = win.require("path")
          //   fileName = path.basename(urlPath)
          // }
          resolve({
            buffer: win.Buffer.from(res),
            fileName: fileName,
            extname,
            success: true,
          })
        } else {
          resolve({
            success: false,
            reason: `${url} is not image`,
          })
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        resolve({
          success: false,
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          reason: `request ${url} error, ${error?.message ?? ""}`,
        })
      }
    })().catch(reject)
  })
  const timeoutPromise = new Promise<IPathTransformedImgInfo>((resolve): void => {
    timeoutId = setTimeout(() => {
      resolve({
        success: false,
        reason: `request ${url} timeout`,
      })
    }, 10000)
  })
  return Promise.race([requestFn, timeoutPromise])
}

/**
 * detect the input string's type
 * for example
 * 1. @xxx/picgo-plugin-xxx -> scope
 * 2. picgo-plugin-xxx -> normal
 * 3. xxx -> simple
 * 4. not exists or is a path -> unknown
 * @param name
 */
export const getPluginNameType = (name: string): IPluginNameType => {
  if (/^@[^/]+\/picgo-plugin-/.test(name)) {
    return "scope"
  } else if (name.startsWith("picgo-plugin-")) {
    return "normal"
  } else if (isSimpleName(name)) {
    return "simple"
  }
  return "unknown"
}

/**
 * detect the input string is a simple plugin name or not
 * for example
 * 1. xxx -> true
 * 2. /Usr/xx/xxxx/picgo-plugin-xxx -> false
 * @param nameOrPath pluginNameOrPath
 */
export const isSimpleName = (nameOrPath: string): boolean => {
  if (hasNodeEnv) {
    const fs = win.fs
    const path = win.require("path")
    if (path.isAbsolute(nameOrPath)) {
      return false
    }
    const pluginPath = path.join(process.cwd(), nameOrPath)
    if (fs.existsSync(pluginPath)) {
      return false
    }
  } else {
    if (nameOrPath.includes("/") || nameOrPath.includes("\\")) {
      return false
    }
  }

  return true
}

/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export const handleStreamlinePluginName = (name: string): string => {
  if (/^@[^/]+\/picgo-plugin-/.test(name)) {
    return name.replace(/^@[^/]+\/picgo-plugin-/, "")
  } else {
    return name.replace(/picgo-plugin-/, "")
  }
}

/**
 * complete plugin name to full name
 * for example:
 * 1. xxx -> picgo-plugin-xxx
 * 2. picgo-plugin-xxx -> picgo-plugin-xxx
 * @param name pluginSimpleName
 * @param scope pluginScope
 */
export const handleCompletePluginName = (name: string, scope = ""): string => {
  if (scope) {
    return `@${scope}/picgo-plugin-${name}`
  } else {
    return `picgo-plugin-${name}`
  }
}

/**
 * handle transform the path to unix style
 * for example
 * 1. C:\\xxx\\xxx -> C:/xxx/xxx
 * 2. /xxx/xxx -> /xxx/xxx
 * @param pathStr
 */
export const handleUnixStylePath = (pathStr: string): string => {
  if (hasNodeEnv) {
    const path = win.require("path")
    const pathArr = pathStr.split(path.sep)
    return pathArr.join("/")
  } else {
    const pathArr = pathStr.split("/")
    return pathArr.join("/")
  }
}

/**
 * remove plugin version when register plugin name
 * 1. picgo-plugin-xxx@1.0.0 -> picgo-plugin-xxx
 * 2. @xxx/picgo-plugin-xxx@1.0.0 -> @xxx/picgo-plugin-xxx
 * @param nameOrPath
 * @param scope
 */
export const removePluginVersion = (nameOrPath: string, scope = false): string => {
  if (!nameOrPath.includes("@")) {
    return nameOrPath
  } else {
    let reg = /(.+\/)?(picgo-plugin-\w+)(@.+)*/
    // if is a scope pkg
    if (scope) {
      reg = /(.+\/)?(^@[^/]+\/picgo-plugin-\w+)(@.+)*/
    }
    const matchArr = nameOrPath.match(reg)
    if (!matchArr) {
      console.warn("can not remove plugin version")
      return nameOrPath
    } else {
      return matchArr[2]
    }
  }
}

/**
 * the config black item list which won't be setted
 * only can be got
 */
export const configBlackList = []

/**
 * check some config key is in blackList
 * @param key
 */
export const isConfigKeyInBlackList = (key: string): boolean => {
  return configBlackList.some((blackItem) => key.startsWith(blackItem))
}

/**
 * check the input config is valid
 * config must be object such as { xxx: 'xxx' }
 * && can't be array
 * @param config
 * @returns
 */
export const isInputConfigValid = (config: any): boolean => {
  if (typeof config === "object" && !Array.isArray(config) && Object.keys(config).length > 0) {
    return true
  }
  return false
}

export function safeParse<T>(str: string): T | string {
  try {
    return JSON.parse(str)
  } catch (error) {
    return str
  }
}

export const forceNumber = (num: string | number = 0): number => {
  return isNaN(Number(num)) ? 0 : Number(num)
}

// export const isDev = (): boolean => {
//   return process.env.NODE_ENV === 'development'
// }
//
// export const isProd = (): boolean => {
//   return process.env.NODE_ENV === 'production'
// }

export const getImageSize = (file: typeof win.Buffer): IImgSize => {
  try {
    const { width = 0, height = 0, type } = imageSize(file)
    const extname = type ? `.${type}` : ".png"
    return {
      real: true,
      width,
      height,
      extname,
    }
  } catch (e) {
    console.error(e)
    // fallback to 200 * 200
    return {
      real: false,
      width: 200,
      height: 200,
      extname: ".png",
    }
  }
}
