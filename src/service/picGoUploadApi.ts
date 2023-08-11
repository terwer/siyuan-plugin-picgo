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

import { ObjectUtil } from "zhi-common"
import { createAppLogger } from "~/common/appLogger.ts"

/**
 * PicGO上传Api
 *
 * @since 0.6.0
 * @author terwer
 */
export class PicGoUploadApi {
  private logger
  private requestUrl = "http://127.0.0.1:36677"
  private endpointUrl = "/upload"
  // private commonFetchClient

  constructor() {
    this.logger = createAppLogger("picgo-upload-api")

    // // appInstance
    // const appInstance: any = {}
    // appInstance.fetch = fetch
    // this.commonFetchClient = new CommonFetchClient(appInstance, this.requestUrl)
  }

  /**
   * 上传图片到PicGO
   *
   * @param input 路径数组，可为空，为空上传剪贴板
   */
  public async upload(input?: any[]): Promise<string> {
    let ret = JSON.stringify([])

    const fetchOptions = {
      method: "POST",
    }

    let data
    // 传递了路径，上传具体图片，否则上传剪贴板
    if (input) {
      data = { list: input }
    }

    // 数据不为空才传递
    if (ObjectUtil.isEmptyObject(data)) {
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
    const apiUrl = `${this.requestUrl}${this.endpointUrl}`
    this.logger.debug("调用HTTP请求上传图片到PicGO，apiUrl=>", apiUrl)
    this.logger.debug("调用HTTP请求上传图片到PicGO，fetchOps=>", fetchOptions)

    // 使用兼容的fetch调用并返回统一的JSON数据
    // const result = await this.commonFetchClient.fetchCall(this.endpointUrl, fetchOptions)
    const response = await fetch(apiUrl, fetchOptions)
    const resJson = await response.json()
    this.logger.debug("调用HTTP请求上传图片到PicGO，resJson=>", resJson)

    if (resJson.success) {
      const rtnArray = []
      if (resJson.result && resJson.result.length > 0) {
        resJson.result.forEach((img) => {
          const rtnItem = {
            fileName: img.substring(img.lastIndexOf("/") + 1),
            imgUrl: img,
          }
          rtnArray.push(rtnItem)
        })
      }

      ret = JSON.stringify(rtnArray)
    } else {
      throw new Error("调用HTTP上传到PicGO失败，请检查配置=>" + resJson.message)
    }

    return Promise.resolve(ret)
  }
}
