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
import { IPicGo, IExternalPicgoConfig, ExternalPicgoConfigDb } from "zhi-siyuan-picgo"
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
    const externalPicGoConfigDb = new ExternalPicgoConfigDb(ctx)
    return useCommonPicgoStorage<IExternalPicgoConfig>(externalPicGoConfigDb, {
      serializer: StorageSerializers.object,
    })
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
