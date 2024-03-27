/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"
import { reactive } from "vue"
import { isDev } from "@/utils/Constants.ts"
import { ImageItem } from "zhi-siyuan-picgo/src/lib/models/ImageItem.ts"

/**
 * Picgo公共组件
 *
 * @author terwer
 * @since 0.6.1
 */
export const usePicgoCommon = () => {
  // private data
  const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()

  // public data
  const picgoCommonData = reactive({
    isUploadLoading: false,
    showDebugMsg: isDev,
    loggerMsg: "",
    isSiyuanOrSiyuanNewWin: isInSiyuanOrSiyuanNewWin(),
    fileList: {
      files: <ImageItem[]>[],
    },
  })

  // public methods
  const picgoCommonMethods = {
    getPicgoCommonData: () => {
      return picgoCommonData
    },
  }

  return {
    picgoCommonData,
    picgoCommonMethods,
  }
}
