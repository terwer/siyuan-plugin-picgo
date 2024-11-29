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
import { generateUniqueName, ImageItem } from "zhi-siyuan-picgo"
import { ElMessage, ElMessageBox } from "element-plus"
import { useSiyuanApi } from "$composables/useSiyuanApi.ts"
import { StrUtil } from "zhi-common"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"

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
   * @param imageItem 上传已存在图片需要，新图片留空
   */
  const doAfterUpload = (imgInfos: any, imageItem?: ImageItem) => {
    if (imageItem) {
      doAfterUploadReplace(imgInfos, imageItem)
    } else {
      let imageJson
      if (typeof imgInfos == "string") {
        logger.warn("doAfterUpload返回的是字符串，需要解析")
        imageJson = JSON.parse(imgInfos)
      } else {
        imageJson = imgInfos
      }

      picgoCommonData.loggerMsg = JSON.stringify(imgInfos)
      logger.debug("doAfterUpload,imgInfos=>", imgInfos)

      const img = imageJson[0]
      const rtnItem = new ImageItem(img.imgUrl, img.imgUrl, false)
      picgoCommonData.loggerMsg += "\nnewItem=>" + JSON.stringify(rtnItem)

      picgoCommonData.fileList.files.push(rtnItem)
      ElMessage.success(t("main.opt.success"))
    }
  }

  /**
   * 处理图片后续（单个图片，替换）
   *
   * @param imgInfos
   * @param imageItem
   */
  const doAfterUploadReplace = (imgInfos: any, imageItem: ImageItem) => {
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
      const img = imageJson[0]
      const rtnItem = new ImageItem(imageItem.originUrl, img.imgUrl, false)
      picgoCommonData.loggerMsg += "\nnewItem=>" + JSON.stringify(rtnItem)

      const newList = picgoCommonData.fileList.files.map((x: ImageItem) => {
        if (x.hash === imageItem.hash) {
          return rtnItem
        }
        return x
      })

      // 刷新列表
      picgoCommonData.fileList.files = []
      for (const newItem of newList) {
        picgoCommonData.fileList.files.push(newItem)
      }
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

        // 获取选择的文件的路径数组
        for (let i = 0; i < fileList.length; i++) {
          if (fileList.item(i).path) {
            const filePath = fileList.item(i).path
            const pageId = props.pageId
            const attrs = await siyuanApi.getBlockAttrs(pageId)

            const picgoPostApi = await SiyuanPicGoClient.getInstance()
            const imageItem = new ImageItem(generateUniqueName(), filePath, true)
            const imgInfos = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, false)
            // 处理后续
            doAfterUpload(imgInfos)
          } else {
            logger.debug("路径为空，忽略")
          }
        }

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
        const pageId = props.pageId
        const attrs = await siyuanApi.getBlockAttrs(pageId)

        const picgoPostApi = await SiyuanPicGoClient.getInstance()
        const imageItem = new ImageItem(generateUniqueName(), "", true)
        const imgInfos = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, false)
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
     *
     * @param imageItem
     * @param forceUpload 强制上传
     */
    doUploadImageToBed: async (imageItem: ImageItem, forceUpload?: boolean) => {
      const pageId = props.pageId
      const attrs = await siyuanApi.getBlockAttrs(pageId)

      const picgoPostApi = await SiyuanPicGoClient.getInstance()
      const imgInfos = await picgoPostApi.uploadSingleImageToBed(pageId, attrs, imageItem, forceUpload)

      // 处理后续
      if (forceUpload) {
        doAfterUpload(imgInfos, imageItem)
      } else {
        doAfterUpload(imgInfos)
      }
    },
    doUploaddAllImagesToBed: async () => {
      picgoCommonData.isUploadLoading = true

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
          await picgoUploadMethods.doUploadImageToBed(imageItem, true)
        }

        picgoCommonData.isUploadLoading = false
        if (!hasLocalImages) {
          ElMessage.warning("未发现本地图片，不上传")
        } else {
          ElMessage.success("图片已经全部上传至图床")
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
    doForceUploaddAllImagesToBed: async () => {
      ElMessageBox.confirm(t("picgo.upload.onclick.force.tips"), t("main.opt.warning"), {
        confirmButtonText: t("main.opt.ok"),
        cancelButtonText: t("main.opt.cancel"),
        type: "warning",
      })
        .then(async () => {
          picgoCommonData.isUploadLoading = true

          try {
            const imageItemArray = picgoCommonData.fileList.files

            for (let i = 0; i < imageItemArray.length; i++) {
              const imageItem = imageItemArray[i]
              await picgoUploadMethods.doUploadImageToBed(imageItem, true)
            }

            picgoCommonData.isUploadLoading = false
            ElMessage.success("图片已经全部上传至图床")
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
    },
    doDownloadAllImagesToLocal: async () => {
      if (StrUtil.isEmptyString(props.pageId)) {
        ElMessage.error("pageId不能为空")
        return
      }

      picgoCommonData.isUploadLoading = true

      try {
        const ret = await siyuanApi.netAssets2LocalAssets(props.pageId)
        logger.debug("ret=>", ret)
        ElMessage.success("网络图片下载成功")
      } catch (e: any) {
        throw new Error("网络图片下载失败" + e.toString())
      } finally {
        picgoCommonData.isUploadLoading = false
      }
    },
  }

  return {
    picgoUploadData,
    picgoUploadMethods,
  }
}
