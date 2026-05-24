/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { hasNodeEnv, win } from "universal-picgo-store"

/**
 * PicGo 第三方插件依赖 Electron 的本机能力（node_modules、@electron/remote、插件菜单等）。
 *
 * v2 配置会在多个运行端共享，但非 Electron 端（浏览器、Docker、publisher 的 web runtime 等）
 * 不能读取或应用任何第三方插件配置，否则会把本机 PC-only 状态误当成跨端平台能力。
 */
export const isElectronRuntime = (): boolean => {
  const versions = win?.process?.versions
  return Boolean(versions?.electron)
}

export const isThirdPartyPluginRuntimeAvailable = (): boolean => {
  return hasNodeEnv && isElectronRuntime()
}

export const isPicGoPluginPackageName = (name: string): boolean => {
  return /^picgo-plugin-|^@[^/]+\/picgo-plugin-/.test(name)
}
