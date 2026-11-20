/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ImageParser, ParsedImage } from "zhi-siyuan-picgo"
import { isDev } from "@/utils/Constants.ts"
import { useSiyuanApi } from "$composables/useSiyuanApi.ts"
import { onMounted, reactive, watch } from "vue"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"

export type PicgoUploadScopeMode = "focus" | "document"

export interface PicgoUploadScope {
  /** 本次打开面板的编辑器页签是否处于聚焦状态 */
  hasFocusScope: boolean
  /** 当前图片列表与上传按钮实际使用的范围 */
  mode: PicgoUploadScopeMode
  /** 聚焦块 ID，仅当 hasFocusScope 为 true 时有值 */
  blockId: string
  /** 聚焦块标题，用于界面提示 */
  blockName: string
}

/**
 * Picgo页面初始化组件
 */
export const usePicgoInitPage = (props: any, deps: any) => {
  const { kernelApi } = useSiyuanApi()

  // private data
  const siyuanApi = kernelApi
  const imageParser = new ImageParser(isDev)
  let initRequestId = 0

  // deps
  const picgoCommonMethods = deps.picgoCommonMethods

  // deps data
  const picgoCommonData = picgoCommonMethods.getPicgoCommonData()

  const picgoInitData = reactive<{ scope: PicgoUploadScope }>({
    scope: {
      hasFocusScope: !!props.scopeBlockId,
      mode: props.scopeBlockId ? "focus" : "document",
      blockId: props.scopeBlockId ?? "",
      blockName: "",
    },
  })

  // private methods
  const resolveScopeBlockName = async (): Promise<string> => {
    if (!props.scopeBlockId) {
      return ""
    }
    try {
      const block = await siyuanApi.getBlockByID(props.scopeBlockId)
      return (block?.content ?? "").trim()
    } catch (e) {
      // 聚焦块信息只用于界面提示，读取失败不影响上传范围
      return ""
    }
  }

  const initPage = async (mode?: PicgoUploadScopeMode) => {
    const pageId = props.pageId
    if (!pageId) {
      picgoCommonData.fileList.files.splice(0)
      return
    }

    const requestId = ++initRequestId
    const hasFocusScope = !!props.scopeBlockId
    const scopeMode: PicgoUploadScopeMode = hasFocusScope ? mode ?? picgoInitData.scope.mode : "document"
    const scopeBlockName = await resolveScopeBlockName()
    if (requestId !== initRequestId) {
      return
    }

    picgoInitData.scope = {
      hasFocusScope,
      mode: scopeMode,
      blockId: hasFocusScope ? props.scopeBlockId : "",
      blockName: scopeBlockName,
    }

    const scopeBlockId = scopeMode === "focus" ? props.scopeBlockId : ""

    // 图片信息
    const picgoPostApi = await SiyuanPicGoClient.getInstance()
    const imageBlocks: any[] = await picgoPostApi.getImageBlocksInScope(pageId, scopeBlockId)
    if (requestId !== initRequestId) {
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
    retImgs = retImgs.filter((item, index, self) => index === self.findIndex((t) => t.url === item.url))

    // 将字符串数组格式的图片信息转换成图片对象数组
    const attrs = await siyuanApi.getBlockAttrs(pageId)
    const imageItemArray = await picgoPostApi.doConvertImagesToImagesItemArray(attrs, retImgs)
    if (requestId !== initRequestId) {
      return
    }

    picgoCommonData.fileList.files.splice(0)
    for (let i = 0; i < imageItemArray.length; i++) {
      picgoCommonData.fileList.files.push(imageItemArray[i])
    }
  }

  // publish methods
  const picgoInitMethods = {
    initPage: async () => {
      await initPage()
    },
    useWholeDocument: async () => {
      await initPage("document")
    },
    useFocusBlock: async () => {
      await initPage("focus")
    },
  }

  /**
   * 监听props
   */
  watch([() => props.pageId, () => props.scopeBlockId], async () => {
    picgoInitData.scope.mode = props.scopeBlockId ? "focus" : "document"
    await initPage()
  })

  onMounted(async () => {
    await initPage()
  })

  return {
    picgoInitData,
    picgoInitMethods,
  }
}
