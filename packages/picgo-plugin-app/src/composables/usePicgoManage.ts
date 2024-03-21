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
import { copyToClipboardInBrowser } from "@/utils/utils.ts"

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

  // public methods
  const picgoManageMethods = {
    handleUploadCurrentImageToBed: async (imageItem: ImageItem) => {
      picgoCommonData.isUploadLoading = true

      if (!picgoCommonData.isSiyuanOrSiyuanNewWin) {
        const errMsg = "由于浏览器的安全限制，无法获取本地文件的完整路径，因此非electron环境只能通过剪贴板上传"
        ElMessage.error(errMsg)
        picgoCommonData.loggerMsg = t("main.opt.failure") + "=>" + errMsg
        picgoCommonData.isUploadLoading = false
        return
      }

      if (!imageItem.isLocal) {
        ElMessageBox.confirm("已经是远程图片，是否仍然覆盖上传？", t("main.opt.warning"), {
          confirmButtonText: t("main.opt.ok"),
          cancelButtonText: t("main.opt.cancel"),
          type: "warning",
        })
          .then(async () => {
            try {
              await picgoManageMethods.doUploadImagesToBed(imageItem, true)
              picgoCommonData.isUploadLoading = false

              ElMessage.success("图片已经成功上传至图床，即将刷新页面")
              BrowserUtil.reloadPage()
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
          await picgoManageMethods.doUploadImagesToBed(imageItem)
          picgoCommonData.isUploadLoading = false

          ElMessage.success("图片已经成功上传至图床，即将刷新页面")
          BrowserUtil.reloadPage()
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
