/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useVueI18n } from "$composables/useVueI18n.ts"
import { useSiyuanApi } from "$composables/useSiyuanApi.ts"
import { createAppLogger } from "@/utils/appLogger.ts"
import { reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { BrowserUtil } from "zhi-device"
import { ImageItem } from "zhi-siyuan-picgo/src/lib/models/ImageItem.ts"
import { SiyuanPicGo } from "@/utils/siyuanPicgo.ts"
import { copyToClipboardInBrowser } from "zhi-siyuan-picgo"

/**
 * Picgo图片管理组件
 */
export const usePicgoManage = (props: any, deps: any) => {
  const logger = createAppLogger("picgo-manage")

  // private data
  const { t } = useVueI18n()
  const { kernelApi } = useSiyuanApi()

  const siyuanApi = kernelApi

  // public data
  const picgoManageData = reactive({
    dialogImageUrl: "",
    dialogPreviewVisible: false,
  })

  // deps
  const picgoCommonMethods = deps.picgoCommonMethods

  // deps data
  const picgoCommonData = picgoCommonMethods.getPicgoCommonData()

  // private methods
  /**
   * 处理图片后续
   *
   * @param imgInfos
   */
  const doAfterUploadReplace = (imgInfos: any) => {
    throw new Error("这里需要替换图片，而不是追加")
    // let imageJson
    // if (typeof imgInfos == "string") {
    //   logger.warn("doAfterUpload返回的是字符串，需要解析")
    //   imageJson = JSON.parse(imgInfos)
    // } else {
    //   imageJson = imgInfos
    // }
    //
    // picgoCommonData.loggerMsg = JSON.stringify(imgInfos)
    // logger.debug("doAfterUpload,imgInfos=>", imgInfos)
    //
    // if (imageJson && imageJson.length > 0) {
    //   imageJson.forEach((img: any) => {
    //     const rtnItem = new ImageItem(img.imgUrl, img.imgUrl, false)
    //     picgoCommonData.loggerMsg += "\nnewItem=>" + JSON.stringify(rtnItem)
    //
    //     picgoCommonData.fileList.files.push(rtnItem)
    //   })
    // }
    // ElMessage.success(t("main.opt.success"))
  }

  // public methods
  const picgoManageMethods = {
    handleUploadCurrentImageToBed: async (imageItem: ImageItem) => {
      if (!imageItem.isLocal) {
        ElMessageBox.confirm("已经是远程图片，是否仍然覆盖上传？", t("main.opt.warning"), {
          confirmButtonText: t("main.opt.ok"),
          cancelButtonText: t("main.opt.cancel"),
          type: "warning",
        })
          .then(async () => {
            try {
              picgoCommonData.isUploadLoading = true
              await picgoManageMethods.doUploadCurrentImageToBed(imageItem, true)
              picgoCommonData.isUploadLoading = false

              ElMessage.success("图片已经成功重新上传至图床")
            } catch (e) {
              picgoCommonData.isUploadLoading = false

              ElMessage({
                type: "error",
                message: t("main.opt.failure") + "=>" + e,
              })
              logger.error(t("main.opt.failure") + "=>" + e)
            }
          })
          .catch((e) => {
            picgoCommonData.isUploadLoading = false

            if (e.toString().indexOf("cancel") <= -1) {
              ElMessage({
                type: "error",
                message: t("main.opt.failure") + "，图片上传异常=>" + e,
              })
              logger.error(t("main.opt.failure") + "=>" + e)
            }
          })
      } else {
        try {
          await picgoManageMethods.doUploadCurrentImageToBed(imageItem)
          picgoCommonData.isUploadLoading = false

          ElMessage.success("图片已经成功上传至图床")
        } catch (e) {
          picgoCommonData.isUploadLoading = false

          ElMessage({
            type: "error",
            message: t("main.opt.failure") + "=>" + e,
          })
          logger.error(t("main.opt.failure") + "=>" + e)
        }

        picgoCommonData.isUploadLoading = false
      }
    },

    /**
     * 单个传，否则无法将图片对应，需要替换
     *
     * @param imageItem
     * @param forceUpload 强制上传
     */
    doUploadCurrentImageToBed: async (imageItem: ImageItem, forceUpload?: boolean) => {
      const pageId = props.pageId
      const attrs = await siyuanApi.getBlockAttrs(pageId)

      const picgoPostApi = await SiyuanPicGo.getInstance()
      const imgInfos = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, forceUpload)

      // 处理后续
      doAfterUploadReplace(imgInfos)
    },

    onImageUrlCopy: (url: string) => {
      if (BrowserUtil.isInBrowser) {
        const mdUrl = `![](${url})`
        copyToClipboardInBrowser(mdUrl)
      }
    },

    handlePictureCardPreview: (url: string) => {
      picgoManageData.dialogImageUrl = url ?? ""
      picgoManageData.dialogPreviewVisible = true
    },
  }

  return {
    picgoManageData,
    picgoManageMethods,
  }
}
