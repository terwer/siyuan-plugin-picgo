/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { createAppLogger } from "@/utils/appLogger.ts"
import { ImageParser, ParsedImage } from "zhi-siyuan-picgo"
import { isDev } from "@/utils/Constants.ts"
import { useSiyuanApi } from "$composables/useSiyuanApi.ts"
import { onMounted, watch } from "vue"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"

/**
 * Picgo页面初始化组件
 */
export const usePicgoInitPage = (props: any, deps: any) => {
  const logger = createAppLogger("picgo-common")
  const { kernelApi } = useSiyuanApi()

  // private data
  const siyuanApi = kernelApi
  const imageParser = new ImageParser(isDev)

  // deps
  const picgoCommonMethods = deps.picgoCommonMethods

  // deps data
  const picgoCommonData = picgoCommonMethods.getPicgoCommonData()

  // private methods
  const initPage = async () => {
    const pageId = props.pageId
    logger.debug("pageId=>", pageId)

    // 图片信息
    const imageBlocks: any[] = await siyuanApi.getImageBlocksByID(pageId)
    logger.debug("查询文章中的图片块=>", imageBlocks)

    if (!imageBlocks || imageBlocks.length === 0) {
      return
    }

    // 解析图片地址
    let retImgs: ParsedImage[] = []
    imageBlocks.forEach((page) => {
      const parsedImages: ParsedImage[] = imageParser.parseImagesToArray(page.markdown)
      const retImgsWithBlockId = parsedImages.map((image) => {
        return { ...image, blockId: page.id }
      })
      retImgs = retImgs.concat(retImgsWithBlockId)
    })
    // 去重
    // retImgs = [...new Set([...retImgs])]
    retImgs = retImgs.filter((item, index, self) => index === self.findIndex((t) => t.url === item.url))
    logger.debug("解析出来的所有的图片地址=>", retImgs)

    // 将字符串数组格式的图片信息转换成图片对象数组
    const attrs = await siyuanApi.getBlockAttrs(pageId)

    const picgoPostApi = await SiyuanPicGoClient.getInstance()
    const imageItemArray = await picgoPostApi.doConvertImagesToImagesItemArray(attrs, retImgs)

    // 页面属性
    for (let i = 0; i < imageItemArray.length; i++) {
      const imageItem = imageItemArray[i]
      picgoCommonData.fileList.files.push(imageItem)
    }
  }

  // publish methods
  const picgoInitMethods = {
    initPage: async () => {
      await initPage()
    },
  }

  /**
   * 监听props
   */
  watch(
    () => props.pageId,
    async () => {
      await initPage()
      logger.debug("Picgo初始化")
    }
  )

  onMounted(async () => {
    await initPage()
  })

  return {
    picgoInitMethods,
  }
}
