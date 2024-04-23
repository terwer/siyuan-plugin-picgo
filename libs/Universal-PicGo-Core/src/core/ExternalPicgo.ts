/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import ExternalPicgoConfigDb from "../db/externalPicGo"
import { IImgInfo, IPicGo } from "../types"
import { PicgoTypeEnum } from "../utils/enums"
import { browserPathJoin } from "../utils/browserUtils"
import { fileToBuffer, isFileOrBlob } from "../utils/common"
import { CodingUtil } from "../utils/CodingUtil"

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
  public db: ExternalPicgoConfigDb

  constructor(ctx: IPicGo, isDev?: boolean) {
    this.logger = simpleLogger("external-picgo", "external-picgo", isDev)
    this.db = new ExternalPicgoConfigDb(ctx)
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    const useBundledPicgo = this.db.get("useBundledPicgo")
    const picgoType = this.db.get("picgoType")
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
          this.logger.warn("try to get path from blob", inputItem.path)
          if (inputItem.path.trim() === "") {
            this.logger.warn("blob path is empty")
            continue
          }
          newInput.push(inputItem.path)
        } else {
          newInput.push(inputItem)
        }
      }
      input = newInput
    }

    this.requestUrl = this.db.get("extPicgoApiUrl") ?? this.requestUrl
    let ret: IImgInfo[] = []

    const fetchOptions = {
      method: "POST",
    }

    let data
    // 传递了路径，上传具体图片，否则上传剪贴板
    if (input) {
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
    const apiUrl = browserPathJoin(this.requestUrl, this.endpointUrl)
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
}

export { ExternalPicgo }
