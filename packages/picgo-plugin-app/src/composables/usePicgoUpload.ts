/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useRouter } from "vue-router"
import { createAppLogger } from "@/utils/appLogger.ts"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { reactive } from "vue"
import { ImageItem } from "zhi-siyuan-picgo/src/lib/models/ImageItem.ts"
import { ElMessage } from "element-plus"
import { SiyuanPicGo } from "@/utils/siyuanPicgo.ts"
import { BrowserUtil } from "zhi-device"
import { useSiyuanApi } from "$composables/useSiyuanApi.ts"
import { StrUtil } from "zhi-common"

/**
 * Picgo上传组件
 */
export const usePicgoUpload = (props: any, deps: any, refs: any) => {
  // private data
  const logger = createAppLogger("picgo-upload")
  const { t } = useVueI18n()
  const router = useRouter()
  const { kernelApi } = useSiyuanApi()

  const siyuanApi = kernelApi

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
   *
   * @param imgInfos
   */
  const doAfterUpload = (imgInfos: any) => {
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
      imageJson.forEach((img: any) => {
        const rtnItem = new ImageItem(img.imgUrl, img.imgUrl, false)
        picgoCommonData.loggerMsg += "\nnewItem=>" + JSON.stringify(rtnItem)

        picgoCommonData.fileList.files.push(rtnItem)
      })
    }
    ElMessage.success(t("main.opt.success"))
  }

  // public methods
  const picgoUploadMethods = {
    bindFileControl: () => {
      refSelectedFiles.value.click()
    },
    doUploadPicSelected: async (event: any) => {
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

        const picgoPostApi = await SiyuanPicGo.getInstance()
        const imgInfos = await picgoPostApi.upload(filePaths)
        // 处理后续
        doAfterUpload(imgInfos)

        picgoCommonData.isUploadLoading = false
      } catch (e: any) {
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
        const picgoPostApi = await SiyuanPicGo.getInstance()
        const imgInfos = await picgoPostApi.upload()
        // 处理后续
        doAfterUpload(imgInfos)

        picgoCommonData.isUploadLoading = false
      } catch (e: any) {
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
    /**
     * 单个传，否则无法将图片对应
     * @param imageItem
     * @param forceUpload 强制上传
     */
    doUploadImagesToBed: async (imageItem: ImageItem, forceUpload?: boolean) => {
      const pageId = props.pageId
      const attrs = await siyuanApi.getBlockAttrs(pageId)

      const picgoPostApi = await SiyuanPicGo.getInstance()
      await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, forceUpload)
    },
    doUploaddAllImagesToBed: async () => {
      picgoCommonData.isUploadLoading = true

      if (!picgoCommonData.isSiyuanOrSiyuanNewWin) {
        const errMsg = "由于浏览器的安全限制，无法获取本地文件的完整路径，因此非electron环境只能通过剪贴板上传"
        ElMessage.error(errMsg)
        picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + errMsg
        picgoCommonData.isUploadLoading = false
        return
      }

      try {
        let hasLocalImages = false
        const imageItemArray = picgoCommonData.fileList.files

        for (let i = 0; i < imageItemArray.length; i++) {
          const imageItem = imageItemArray[i]
          if (!imageItem.isLocal) {
            logger.debug("已经上传过图床，请勿重复上传=>", imageItem.originUrl)
            continue
          }

          hasLocalImages = true
          await picgoUploadMethods.doUploadImagesToBed(imageItem)
        }

        picgoCommonData.isUploadLoading = false
        if (!hasLocalImages) {
          ElMessage.warning("未发现本地图片，不上传")
        } else {
          ElMessage.success("图片已经全部上传至图床，即将刷新页面")
          BrowserUtil.reloadPage()
        }
      } catch (e) {
        picgoCommonData.isUploadLoading = false

        ElMessage({
          type: "error",
          message: t("main.opt.failure") + "=>" + e,
        })
        logger.error(t("main.opt.failure") + "=>" + e)
      }
    },
    doDownloadAllImagesToLocal: async () => {
      if (StrUtil.isEmptyString(props.pageId)) {
        ElMessage.error("pageId不能为空")
        return
      }

      picgoCommonData.isUploadLoading = true

      try {
      } finally {
        // picgoCommonData.isUploadLoading = false
      }
    },
  }

  return {
    picgoUploadData,
    picgoUploadMethods,
  }
}
