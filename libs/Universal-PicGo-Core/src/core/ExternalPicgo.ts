/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import { IExternalPicgoConfig, IImgInfo, IPicGo } from "../types"
import { PicgoTypeEnum } from "../utils/enums"
import { browserPathJoin } from "../utils/browserUtils"
import { isFileOrBlob } from "../utils/common"

/**
 *外部的PicGO 上传 Api
 *
 * @since 0.6.0
 * @version 1.6.0
 * @author terwer
 */
class ExternalPicgo {
  private logger: ILogger
  private requestUrl = "http://127.0.0.1:36677"
  private readonly endpointUrl = "/upload"
  private readonly configProvider?: () => IExternalPicgoConfig

  constructor(_ctx: IPicGo, isDev?: boolean, configProvider?: () => IExternalPicgoConfig) {
    this.logger = simpleLogger("external-picgo", "external-picgo", isDev)
    this.configProvider = configProvider
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    const routeConfig = this.getRouteConfig()
    const useBundledPicgo = routeConfig.useBundledPicgo
    const picgoType = routeConfig.picgoType
    if (useBundledPicgo) {
      throw new Error("bundled picgo cannot use extenal picgo api")
    }
    if (picgoType !== PicgoTypeEnum.App) {
      throw new Error(`picgoType ${picgoType} is not supported via external picgo api`)
    }

    // check blob
    const newInput = []
    if (input) {
      for (const inputItem of input) {
        if (isFileOrBlob(inputItem)) {
          this.logger.warn(`try to get path from blob => ${inputItem.path}`)
          if (inputItem.path && inputItem.path.trim() !== "") {
            newInput.push(inputItem.path)
          } else {
            this.logger.warn("blob path is empty, treat as clipboard image")
          }
        } else {
          newInput.push(inputItem)
        }
      }
      input = newInput
    }

    this.requestUrl = routeConfig.extPicgoApiUrl ?? this.requestUrl
    let ret: IImgInfo[] = []

    const fetchOptions = {
      method: "POST",
    }

    let data
    // 传递了路径，上传具体图片，否则上传剪贴板
    if (input && input.length > 0) {
      data = { list: input }
    }

    // 数据不为空才传递
    if (data) {
      Object.assign(fetchOptions, {
        body: JSON.stringify(data),
      })
    }

    Object.assign(fetchOptions, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Terwer/0.1.0",
      },
    })

    // 发送请求
    // 如果 URL 已经包含 /upload 路径，则不再添加尾缀
    let apiUrl: string
    if (this.requestUrl.endsWith("/upload")) {
      // URL 以 /upload 结尾，移除后重新拼接（保持原始行为）
      const baseUrl = this.requestUrl.slice(0, -7)
      apiUrl = browserPathJoin(baseUrl, this.endpointUrl)
    } else if (this.requestUrl.includes("/upload?")) {
      // URL 包含 /upload?（带查询参数），直接使用，不添加尾缀
      apiUrl = this.requestUrl
    } else {
      // URL 不包含 /upload，正常拼接
      apiUrl = browserPathJoin(this.requestUrl, this.endpointUrl)
    }
    this.logger.debug("调用HTTP请求上传图片到PicGO，apiUrl=>", apiUrl)
    this.logger.debug("调用HTTP请求上传图片到PicGO，fetchOps=>", fetchOptions)

    // 使用兼容的fetch调用并返回统一的JSON数据
    const response = await fetch(apiUrl, fetchOptions)
    const resJson = await response.json()
    this.logger.debug("调用HTTP请求上传图片到PicGO，resJson=>", resJson)

    if (resJson.success) {
      const rtnArray: IImgInfo[] = []
      if (resJson.result && resJson.result.length > 0) {
        resJson.result.forEach((img: string) => {
          const rtnItem = {
            fileName: img.substring(img.lastIndexOf("/") + 1),
            imgUrl: img,
          }
          rtnArray.push(rtnItem)
        })
      }

      ret = rtnArray
    } else {
      throw new Error("调用HTTP上传到PicGO失败，请检查配置=>" + resJson.message)
    }

    return Promise.resolve(ret)
  }

  private getRouteConfig(): IExternalPicgoConfig {
    if (!this.configProvider) {
      throw new Error("Unified config facade route provider is required for external PicGo upload")
    }
    return this.configProvider()
  }
}

export { ExternalPicgo }
