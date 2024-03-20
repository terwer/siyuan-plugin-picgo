/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { RemovableRef, StorageSerializers, useLocalStorage } from "@vueuse/core"
import SiyuanConfig from "@/models/SiyuanConfig.ts"

const useSiyuanSetting = () => {
  const storageKey = "siyuan-cfg"

  /**
   * 获取思源笔记配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getSiyuanSetting = (): RemovableRef<SiyuanConfig> => {
    const baseUrl = "http://127.0.0.1:6806"
    const token = ""
    const initialValue = new SiyuanConfig(baseUrl, token)
    const siyuanConfig = useLocalStorage<SiyuanConfig>(storageKey, initialValue, {
      serializer: StorageSerializers.object,
    })
    return siyuanConfig
  }

  return { getSiyuanSetting }
}

export { useSiyuanSetting }
