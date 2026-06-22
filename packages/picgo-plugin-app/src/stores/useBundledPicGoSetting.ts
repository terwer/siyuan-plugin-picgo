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
import type { IPicGo, IConfig, IPicgoDb } from "zhi-siyuan-picgo"
import useCommonPicgoStorage from "@/stores/common/useCommonPicgoStorage.ts"

/**
 * 内置的PicGo配置
 *
 * @author terwer
 */
const useBundledPicGoSetting = () => {
  /**
   * 获取内置的 PicGo 的配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getBundledPicGoSetting = (ctx: IPicGo): RemovableRef<IConfig> => {
    const bundledPicGoConfigDb = createBundledPicGoConfigDb(ctx)
    return useCommonPicgoStorage<IConfig>(
      bundledPicGoConfigDb,
      {
        serializer: StorageSerializers.object,
      },
      {
        afterWrite: () => ctx.flushConfig(),
        onWriteError: (e) => {
          ctx.log.error(e)
          ElMessage.error(`PicGo 配置保存失败：${e instanceof Error ? e.message : String(e)}`)
        },
      }
    )
  }

  /**
   * 获取只读版本的内置的 PicGo 配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getReadOnlytBundledPicGoSetting = (ctx: IPicGo) => {
    const cfgRef = getBundledPicGoSetting(ctx)
    const readOnlyCfgRef = readonly(cfgRef)
    return readOnlyCfgRef
  }

  return { getBundledPicGoSetting, getReadOnlytBundledPicGoSetting }
}

const createBundledPicGoConfigDb = (ctx: IPicGo): IPicgoDb<IConfig> => {
  return {
    key: ctx.configPath,
    initialValue: ctx.getConfig<IConfig>() ?? {},
    read: () => (ctx.getConfig<IConfig>() ?? {}) as any,
    get: (key: string) => ctx.getConfig(key),
    set: (key: string, value: any) => {
      ctx.saveConfig({ [key]: value })
    },
    has: (key: string) => typeof ctx.getConfig(key) !== "undefined",
    unset: (key: string, value: any) => {
      ctx.removeConfig(key, String(value))
      return true
    },
    saveConfig: (config: Partial<IConfig>) => {
      ctx.saveConfig(config as any)
    },
    removeConfig: (config: IConfig) => {
      Object.keys(config ?? {}).forEach((key) => {
        ctx.removeConfig(key, String((config as any)[key]))
      })
    },
  }
}

export { useBundledPicGoSetting }
