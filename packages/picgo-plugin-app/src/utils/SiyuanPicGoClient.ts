/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useSiyuanSetting } from "@/stores/useSiyuanSetting.ts"
import { isDev } from "@/utils/Constants.ts"
import { SiyuanPicGo } from "zhi-siyuan-picgo"
import { SiyuanConfig } from "zhi-siyuan-api"

class SiyuanPicGoClient {
  public static async getInstance() {
    const { getReadOnlySiyuanSetting } = useSiyuanSetting()
    const siyuanConfig = getReadOnlySiyuanSetting()
    const picgoPostApi = await SiyuanPicGo.getInstance(siyuanConfig.value as SiyuanConfig, isDev)
    return picgoPostApi
  }
}

export { SiyuanPicGoClient }
