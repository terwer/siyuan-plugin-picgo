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
import { IPicGo, IExternalPicgoConfig, IPicgoDb } from "zhi-siyuan-picgo"
import useCommonPicgoStorage from "@/stores/common/useCommonPicgoStorage.ts"

/**
 * 外部PicGo配置
 *
 * @author terwer
 */
const useExternalPicGoSetting = () => {
  /**
   * 获取外部的 PicGo 的配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getExternalPicGoSetting = (ctx: IPicGo): RemovableRef<IExternalPicgoConfig> => {
    const externalPicGoConfigDb = createExternalPicGoFacadeDb(ctx)
    return useCommonPicgoStorage<IExternalPicgoConfig>(
      externalPicGoConfigDb,
      {
        serializer: StorageSerializers.object,
      },
      {
        afterWrite: async () => {
          await (externalPicGoConfigDb as any).waitPendingWrite?.()
          await ctx.getConfigFacade?.()?.flush(["externalPicList"])
        },
        onWriteError: (e) => {
          ctx.log.error(e)
          ElMessage.error(`External/PicList 配置保存失败：${e instanceof Error ? e.message : String(e)}`)
        },
      }
    )
  }

  /**
   * 获取只读版本的外部 PicGo 配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getReadOnlytExternalPicGoSetting = (ctx: IPicGo) => {
    const cfgRef = getExternalPicGoSetting(ctx)
    const readOnlyCfgRef = readonly(cfgRef)
    return readOnlyCfgRef
  }

  return { getExternalPicGoSetting, getReadOnlytExternalPicGoSetting }
}

export { useExternalPicGoSetting }

const createExternalPicGoFacadeDb = (ctx: IPicGo): IPicgoDb<IExternalPicgoConfig> & {
  waitPendingWrite: () => Promise<void>
} => {
  const facade = ctx.getConfigFacade?.()
  if (!facade) {
    throw new Error("Unified config facade is not ready for external/PicList settings")
  }

  let cache = cloneSerializable(facade.getSnapshot().externalPicgo ?? {}) as IExternalPicgoConfig
  let pendingWrite = Promise.resolve()

  const writeFullConfig = (config: Partial<IExternalPicgoConfig>) => {
    cache = {
      ...cache,
      ...cloneSerializable(config),
    }
    pendingWrite = facade.updateExternalPicGoConfig((draft: any) => {
      Object.keys(cache).forEach((key) => {
        ;(draft as any)[key] = (cache as any)[key]
      })
    })
  }

  return {
    key: "universal-picgo/external-picgo-cfg.json",
    initialValue: cache,
    read: () => cloneSerializable(facade.getSnapshot().externalPicgo ?? cache) as any,
    get: (key: string) => (facade.getSnapshot().externalPicgo as any)?.[key],
    set: (key: string, value: any) => {
      writeFullConfig({ [key]: value } as any)
    },
    has: (key: string) => typeof (facade.getSnapshot().externalPicgo as any)?.[key] !== "undefined",
    unset: (key: string) => {
      delete (cache as any)[key]
      pendingWrite = facade.updateExternalPicGoConfig((draft: any) => {
        delete (draft as any)[key]
      })
      return true
    },
    saveConfig: (config: Partial<IExternalPicgoConfig>) => {
      writeFullConfig(config)
    },
    removeConfig: (keyOrConfig: any, maybeConfig?: IExternalPicgoConfig) => {
      const config = (maybeConfig ?? keyOrConfig) as IExternalPicgoConfig
      Object.keys(config ?? {}).forEach((key) => delete (cache as any)[key])
      pendingWrite = facade.updateExternalPicGoConfig((draft: any) => {
        Object.keys(config ?? {}).forEach((key) => delete (draft as any)[key])
      })
    },
    waitPendingWrite: () => pendingWrite,
  }
}

const cloneSerializable = <T>(value: T): T => {
  if (typeof value === "undefined") return value
  return JSON.parse(JSON.stringify(value)) as T
}
