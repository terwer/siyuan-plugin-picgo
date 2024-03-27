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
import { SiyuanDevice } from "zhi-device"
import useCommonLocalStorage from "@/stores/common/useCommonLocalStorage.ts"
import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"
import { SiyuanPicgoConfig } from "zhi-siyuan-picgo"

const useSiyuanSetting = () => {
  const filePath = "storage/syp/siyuan-cfg.json"
  const storageKey = "siyuan-cfg"
  const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()

  /**
   * 获取思源笔记配置
   *
   * @author terwer
   * @since 0.6.0
   */
  const getSiyuanSetting = (): RemovableRef<SiyuanPicgoConfig> => {
    const baseUrl = "http://127.0.0.1:6806"
    const token = ""
    // PC客户端多个工作空间情况下，自动读取思源地址
    let origin: string | undefined = undefined
    if (isInSiyuanOrSiyuanNewWin()) {
      const win = SiyuanDevice.siyuanWindow()
      origin = win?.location.origin
    }

    const initialValue = new SiyuanPicgoConfig(origin ?? baseUrl, token)
    const siyuanConfig = useCommonLocalStorage<SiyuanPicgoConfig>(filePath, storageKey, initialValue, {
      serializer: StorageSerializers.object,
    })

    // 更新apiUrl
    if (origin) {
      siyuanConfig.value.apiUrl = origin
    }
    return siyuanConfig
  }

  /**
   * 获取只读版本的思源笔记配置
   * 调用现有的 getSiyuanSetting 并转化为只读
   *
   * @author terwer
   * @since 0.6.0
   */
  const getReadOnlySiyuanSetting = () => {
    const siyuanConfigRef = getSiyuanSetting()
    const readOnlySiyuanConfigRef = readonly(siyuanConfigRef)
    return readOnlySiyuanConfigRef
  }

  return { getSiyuanSetting, getReadOnlySiyuanSetting }
}

export { useSiyuanSetting }
