/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { createAppLogger } from "@/utils/appLogger.ts"
import { useSiyuanSetting } from "@/stores/useSiyuanSetting.ts"
import { SiyuanPicgoConfig } from "zhi-siyuan-picgo"
import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"
import { SiYuanApiAdaptor, SiyuanKernelApi } from "zhi-siyuan-api"

/**
 * 通用 Siyuan API 封装
 */
export const useSiyuanApi = () => {
  const logger = createAppLogger("use-siyuan-api")
  const { getSiyuanSetting } = useSiyuanSetting()

  const siyuanSetting = getSiyuanSetting()
  const siyuanApiUrl = siyuanSetting.value.apiUrl
  const siyuanAuthToken = siyuanSetting.value.password
  const siyuanConfig = new SiyuanPicgoConfig(siyuanApiUrl, siyuanAuthToken)
  siyuanConfig.cookie = siyuanSetting.value.cookie

  const blogApi = new SiYuanApiAdaptor(siyuanConfig)
  const kernelApi = new SiyuanKernelApi(siyuanConfig)
  const { isInChromeExtension } = useSiyuanDevice()

  const isStorageViaSiyuanApi = () => {
    // docker - 在 .env.docker 配置 VITE_DEFAULT_TYPE=siyuan
    // vercel - 在环境变量配置 VITE_DEFAULT_TYPE=siyuan
    // node - 启动参数加 VITE_DEFAULT_TYPE=siyuan node VITE_SIYUAN_API_URL=http://127.0.0.1:6806
    // 插件SPA(PC客户端) - VITE_DEFAULT_TYPE: siyuan
    // 插件SPA(Docker浏览器客户端) - VITE_DEFAULT_TYPE: siyuan
    // 插件SPA(本地客户端浏览器) - VITE_DEFAULT_TYPE: siyuan
    // const storeViaSiyuanApi = process.env.VITE_DEFAULT_TYPE === "siyuan"
    const defaultType = process.env.VITE_DEFAULT_TYPE ?? "siyuan"
    const storeViaSiyuanApi = defaultType === "siyuan"
    logger.info("defaultType=>", defaultType)
    logger.info("storeViaSiyuanApi=>", String(storeViaSiyuanApi))
    return storeViaSiyuanApi
  }

  const isUseSiyuanProxy = () => {
    if (isInChromeExtension()) {
      return false
    }

    return isStorageViaSiyuanApi()
  }

  return {
    blogApi,
    kernelApi,
    siyuanConfig,
    isStorageViaSiyuanApi,
    isUseSiyuanProxy,
  }
}
