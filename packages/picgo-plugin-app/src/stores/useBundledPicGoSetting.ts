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
import { IExternalPicgoConfig, IPicGo, IConfig, ConfigDb } from "zhi-siyuan-picgo"
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
    const externalPicGoConfigDb = new ConfigDb(ctx)
    return useCommonPicgoStorage<IConfig>(externalPicGoConfigDb, {
      serializer: StorageSerializers.object,
    })
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

export { useBundledPicGoSetting }
