/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { DeviceDetection, DeviceTypeEnum } from "zhi-device"
import { createAppLogger } from "@/utils/appLogger.ts"

/**
 * 设备检测
 */
export const useSiyuanDevice = () => {
  const logger = createAppLogger("use-siyuan-device")

  const isInSiyuanMainWin = () => {
    const deviceType = DeviceDetection.getDevice()
    const isSiyuanOrSiyuanNewWin = deviceType === DeviceTypeEnum.DeviceType_Siyuan_MainWin
    logger.debug("deviceType=>", deviceType)
    logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
    return isSiyuanOrSiyuanNewWin
  }

  const isInSiyuanWidget = () => {
    const deviceType = DeviceDetection.getDevice()
    const isSiyuanOrSiyuanNewWin = deviceType === DeviceTypeEnum.DeviceType_Siyuan_Widget
    logger.debug("deviceType=>", deviceType)
    logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
    return isSiyuanOrSiyuanNewWin
  }

  const isInChromeExtension = () => {
    const deviceType = DeviceDetection.getDevice()
    const isSiyuanOrSiyuanNewWin = deviceType === DeviceTypeEnum.DeviceType_Chrome_Extension
    logger.debug("deviceType=>", deviceType)
    logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
    return isSiyuanOrSiyuanNewWin
  }

  const isInSiyuanOrSiyuanNewWin = () => {
    const deviceType = DeviceDetection.getDevice()
    // 三种情况，主窗口、挂件、新窗口
    const isSiyuanOrSiyuanNewWin =
      deviceType === DeviceTypeEnum.DeviceType_Siyuan_MainWin ||
      deviceType === DeviceTypeEnum.DeviceType_Siyuan_RendererWin ||
      deviceType === DeviceTypeEnum.DeviceType_Siyuan_Widget
    logger.debug("deviceType=>", deviceType)
    logger.debug("isSiyuanOrSiyuanNewWin=>", String(isSiyuanOrSiyuanNewWin))
    return isSiyuanOrSiyuanNewWin
  }

  return { isInSiyuanMainWin, isInSiyuanWidget, isInChromeExtension, isInSiyuanOrSiyuanNewWin }
}
