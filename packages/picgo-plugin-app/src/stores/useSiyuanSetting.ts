/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { RemovableRef, StorageSerializers } from "@vueuse/core"
import { readonly } from "vue"
import { ElMessage } from "element-plus"
import { IPicGo, IPicgoDb, SiyuanPicgoConfig } from "zhi-siyuan-picgo"
import useCommonPicgoStorage from "@/stores/common/useCommonPicgoStorage.ts"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"

const useSiyuanSetting = () => {
  /**
   * 获取思源连接配置。
   *
   * PicGo 3.0：生产路径不再读取 `siyuan-cfg` legacy localStorage/JsonStorage；
   * 设置页必须在 `SiyuanPicGoClient.getInstance()` ready 后，通过统一 facade
   * 读写 `siyuan-cfg` owner file。
   */
  const getSiyuanSetting = (ctx?: IPicGo): RemovableRef<SiyuanPicgoConfig> => {
    const siyuanConfigDb = createSiyuanConnectionFacadeDb(ctx)
    return useCommonPicgoStorage<SiyuanPicgoConfig>(
      siyuanConfigDb,
      {
        serializer: StorageSerializers.object,
      },
      {
        afterWrite: async () => {
          await (siyuanConfigDb as any).waitPendingWrite?.()
          await (ctx?.getConfigFacade?.() ?? SiyuanPicGoClient.getCachedConfigFacade())?.flush(["siyuanConnection"])
        },
        onWriteError: (e) => {
          ctx?.log?.error?.(e)
          ElMessage.error(`思源连接配置保存失败：${e instanceof Error ? e.message : String(e)}`)
        },
      }
    )
  }

  /**
   * 获取只读版本的思源笔记配置。
   */
  const getReadOnlySiyuanSetting = (ctx?: IPicGo) => {
    const siyuanConfigRef = getSiyuanSetting(ctx)
    return readonly(siyuanConfigRef)
  }

  return { getSiyuanSetting, getReadOnlySiyuanSetting }
}

const createSiyuanConnectionFacadeDb = (ctx?: IPicGo): IPicgoDb<SiyuanPicgoConfig> & {
  waitPendingWrite: () => Promise<void>
} => {
  const facade = ctx?.getConfigFacade?.() ?? SiyuanPicGoClient.getCachedConfigFacade()
  if (!facade) {
    throw new Error("Unified config facade is not ready for SiYuan connection settings")
  }

  let cache = normalizeSiyuanConfig(facade.getSnapshot().siyuanConnection ?? {})
  let pendingWrite = Promise.resolve()

  const writeFullConfig = (config: Partial<SiyuanPicgoConfig>) => {
    cache = normalizeSiyuanConfig({
      ...cache,
      ...cloneSerializable(config),
    })
    pendingWrite = facade.updateSiyuanConnectionConfig((draft: any) => {
      Object.keys(cache).forEach((key) => {
        draft[key] = (cache as any)[key]
      })
    })
  }

  return {
    key: "siyuan-cfg",
    initialValue: cache,
    read: () => normalizeSiyuanConfig(facade.getSnapshot().siyuanConnection ?? cache) as any,
    get: (key: string) => (facade.getSnapshot().siyuanConnection as any)?.[key],
    set: (key: string, value: any) => {
      writeFullConfig({ [key]: value } as any)
    },
    has: (key: string) => typeof (facade.getSnapshot().siyuanConnection as any)?.[key] !== "undefined",
    unset: (key: string) => {
      delete (cache as any)[key]
      pendingWrite = facade.updateSiyuanConnectionConfig((draft: any) => {
        delete draft[key]
      })
      return true
    },
    saveConfig: (config: Partial<SiyuanPicgoConfig>) => {
      writeFullConfig(config)
    },
    removeConfig: (keyOrConfig: any, maybeConfig?: SiyuanPicgoConfig) => {
      const config = (maybeConfig ?? keyOrConfig) as SiyuanPicgoConfig
      Object.keys(config ?? {}).forEach((key) => delete (cache as any)[key])
      pendingWrite = facade.updateSiyuanConnectionConfig((draft: any) => {
        Object.keys(config ?? {}).forEach((key) => delete draft[key])
      })
    },
    waitPendingWrite: () => pendingWrite,
  }
}

const normalizeSiyuanConfig = (raw: any): SiyuanPicgoConfig => {
  const apiUrl = raw?.apiUrl ?? (typeof window !== "undefined" ? window.location?.origin : undefined) ?? "http://127.0.0.1:6806"
  const password = raw?.password ?? ""
  const config = new SiyuanPicgoConfig(apiUrl, password)
  Object.assign(config, cloneSerializable(raw ?? {}))
  config.apiUrl = apiUrl
  config.password = password
  return config
}

const cloneSerializable = <T>(value: T): T => {
  if (typeof value === "undefined") return value
  return JSON.parse(JSON.stringify(value)) as T
}

export { useSiyuanSetting }
