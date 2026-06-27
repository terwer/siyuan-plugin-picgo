/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { isDev } from "@/utils/Constants.ts"
import { SiyuanPicGo } from "zhi-siyuan-picgo"
import { SiyuanConfig } from "zhi-siyuan-api"

class SiyuanPicGoClient {
  private static instanceKey: string | null = null
  private static instancePromise: Promise<any> | null = null
  private static instance: any | null = null

  public static async getInstance() {
    const config = this.createBootstrapConfig()
    const instanceKey = JSON.stringify({
      apiUrl: config.apiUrl,
      // Do not include password/cookie in diagnostic cache keys. The actual
      // connection config is loaded through the ready unified facade after
      // bootstrap; secrets must not be logged or serialized here.
      password: config.password ? "******" : "",
      cookie: config.cookie ? "******" : "",
    })

    if (!this.instancePromise || this.instanceKey !== instanceKey) {
      this.instanceKey = instanceKey
      this.instancePromise = SiyuanPicGo.getInstance(config, isDev).then((instance) => {
        this.instance = instance
        return instance
      })
    }

    return await this.instancePromise
  }

  public static async getConfigFacade() {
    const instance = await this.getInstance()
    return await instance.getConfigFacadeAsync()
  }

  public static getCachedConfigFacade() {
    try {
      return this.instance?.getConfigFacade?.()
    } catch {
      return undefined
    }
  }

  public static async getSiyuanConnectionConfig() {
    const facade = await this.getConfigFacade()
    return await facade.getSiyuanConnectionConfig()
  }

  public static getCachedKernelApi() {
    return this.instance?.siyuanApi
  }

  public static async getKernelApi() {
    const instance = await this.getInstance()
    return instance.siyuanApi
  }

  private static createBootstrapConfig(): SiyuanConfig {
    const apiUrl = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://127.0.0.1:6806"
    return new SiyuanConfig(apiUrl, "")
  }
}

export { SiyuanPicGoClient }
