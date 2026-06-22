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
  private static instanceKey: string | null = null
  private static instancePromise: Promise<any> | null = null

  public static async getInstance() {
    const { getReadOnlySiyuanSetting } = useSiyuanSetting()
    const siyuanConfig = getReadOnlySiyuanSetting()
    const config = siyuanConfig.value as SiyuanConfig
    const instanceKey = JSON.stringify({
      apiUrl: config.apiUrl,
      password: config.password,
      cookie: config.cookie,
    })

    if (!this.instancePromise || this.instanceKey !== instanceKey) {
      this.instanceKey = instanceKey
      this.instancePromise = SiyuanPicGo.getInstance(config, isDev)
    }

    return await this.instancePromise
  }
}

export { SiyuanPicGoClient }
