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

import { createAppLogger } from "~/src/utils/appLogger"
import AppInstance from "~/src/appInstance"
import { isInSiyuanOrSiyuanNewWin } from "~/src/utils/utils"
import { PicGoUploadApi } from "~/src/service/picGoUploadApi"

/**
 * 内置的 PicGo 桥接 API
 *
 * @author terwer
 * @version 0.9.0
 * @since 0.0.1
 */
export class BundledPicgoApi {
  logger = createAppLogger("bundled-picgo-api")
  picGoUploadApi = new PicGoUploadApi()

  /**
   * 通过PicGO上传图片
   *
   * @returns {Promise<any[]>}
   */
  async uploadByPicGO(input) {
    const appInstance = await AppInstance.getInstance()
    const picgo = appInstance.picgo
    this.logger.debug("appInstance=>", appInstance)
    this.logger.debug("appInstance.picgo=>", appInstance.picgo)

    this.logger.debug("input=>", input)
    if (input) {
      if (isInSiyuanOrSiyuanNewWin()) {
        return picgo.upload(input)
      } else {
        // HTTP调用本地客户端上传
        return this.picGoUploadApi.upload(input)
      }
    } else {
      // 通过PicGO上传剪贴板图片
      if (isInSiyuanOrSiyuanNewWin()) {
        return picgo.uploadFormClipboard()
      } else {
        // HTTP调用本地客户端上传
        return this.picGoUploadApi.upload()
      }
    }
  }
}
