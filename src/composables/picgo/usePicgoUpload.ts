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

import { reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { createAppLogger } from "~/src/utils/appLogger.ts"
import { ImageItem } from "~/src/models/imageItem.ts"
import { PicgoApi } from "~/src/service/picgoApi.js"
import { useRouter } from "vue-router"

/**
 * Picgo上传组件
 */
export const usePicgoUpload = (props, deps, refs) => {
  // private data
  const logger = createAppLogger("picgo-upload")
  const { t } = useVueI18n()
  const router = useRouter()
  const picgoApi = new PicgoApi()

  // public data
  const picgoUploadData = reactive({})

  // deps
  const picgoCommonMethods = deps.picgoCommonMethods

  // deps data
  const picgoCommonData = picgoCommonMethods.getPicgoCommonData()

  // refs
  const refSelectedFiles = refs.refSelectedFiles

  // private methods
  /**
   * 处理图片后续
   * @param imgInfos
   */
  const doAfterUpload = (imgInfos) => {
    let imageJson
    if (typeof imgInfos == "string") {
      logger.warn("doAfterUpload返回的是字符串，需要解析")
      imageJson = JSON.parse(imgInfos)
    } else {
      imageJson = imgInfos
    }

    picgoCommonData.loggerMsg = JSON.stringify(imgInfos)
    logger.debug("doAfterUpload,imgInfos=>", imgInfos)

    if (imageJson && imageJson.length > 0) {
      imageJson.forEach((img) => {
        const rtnItem = new ImageItem(img.imgUrl, img.imgUrl, false)
        picgoCommonData.loggerMsg += "\nnewItem=>" + JSON.stringify(rtnItem)

        picgoCommonData.fileList.files.push(rtnItem)
      })
    }
    ElMessage.success(t("main.opt.success"))
  }

  // public methods
  const picgoUploadMethods = {
    handlePicgoSetting: async () => {
      if (!picgoCommonData.isSiyuanOrSiyuanNewWin) {
        await ElMessageBox.alert(t("picgo.pic.setting.no.tip"), t("main.opt.tip"), {
          confirmButtonText: t("main.opt.ok"),
        })
        return
      }

      await router.push({
        path: "/setting",
        query: { showBack: "true" },
      })
    },
    bindFileControl: () => {
      refSelectedFiles.value.click()
    },
    doUploadPicSelected: async (event) => {
      picgoCommonData.isUploadLoading = true

      try {
        const fileList = event.target.files

        logger.debug("onRequest fileList=>", fileList)
        if (!fileList || fileList.length === 0) {
          ElMessage.error("请选择图片")
          picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + "请选择图片"
          picgoCommonData.isUploadLoading = false
          return
        }

        if (!picgoCommonData.isSiyuanOrSiyuanNewWin) {
          const errMsg = "由于浏览器的安全限制，无法获取本地文件的完整路径，因此非electron环境只能通过剪贴板上传"
          ElMessage.error(errMsg)
          picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + errMsg
          picgoCommonData.isUploadLoading = false
          return
        }

        // 获取选择的文件的路径数组
        const filePaths = []
        for (let i = 0; i < fileList.length; i++) {
          if (fileList.item(i).path) {
            filePaths.push(fileList.item(i).path)
            logger.debug("路径不为空")
          } else {
            logger.debug("路径为空，忽略")
          }
        }

        const imgInfos = await picgoApi.uploadByPicGO(filePaths)
        // 处理后续
        doAfterUpload(imgInfos)

        picgoCommonData.isUploadLoading = false
      } catch (e) {
        if (e.toString().indexOf("cancel") <= -1) {
          ElMessage({
            type: "error",
            message: t("main.opt.failure") + "=>" + e,
          })
          logger.error(t("main.opt.failure") + "=>" + e)
        }
        picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + e
        picgoCommonData.isUploadLoading = false
      }
    },
    doUploadPicFromClipboard: async () => {
      picgoCommonData.isUploadLoading = true

      try {
        const imgInfos = await picgoApi.uploadByPicGO()
        // 处理后续
        doAfterUpload(imgInfos)

        picgoCommonData.isUploadLoading = false
      } catch (e) {
        if (e.toString().indexOf("cancel") <= -1) {
          ElMessage({
            type: "error",
            message: t("main.opt.failure") + "=>" + e,
          })
          logger.error(t("main.opt.failure") + "=>", e)
        }
        picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + e
        picgoCommonData.isUploadLoading = false
      }
    },
  }

  return {
    picgoUploadData,
    picgoUploadMethods,
  }
}
