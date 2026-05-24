/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { hasNodeEnv, win } from "universal-picgo"

interface SiyuanPicGoPathOverrides {
  configPath?: string
  baseDir?: string
  runtimeDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
}

interface SiyuanPicGoInstanceOptions {
  isDev?: boolean
  paths?: SiyuanPicGoPathOverrides
}

interface SiyuanPicGoPaths {
  configPath?: string
  baseDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
}

const getDefaultLocalPicGoDir = (): string | undefined => {
  if (!hasNodeEnv) {
    return undefined
  }

  const os = win.require("os")
  const path = win.require("path")
  return path.join(os.homedir(), ".universal-picgo")
}

const getSiyuanWorkspaceDir = (): string => {
  return win?.siyuan?.config?.system?.workspaceDir ?? ""
}

const getWorkspacePicGoConfigPath = (workspaceDir: string): string | undefined => {
  if (!hasNodeEnv || !workspaceDir) {
    return undefined
  }

  const path = win.require("path")
  return path.join(workspaceDir, "data", "storage", "syp", "picgo", "picgo.cfg.json")
}

const resolveSiyuanPicGoPaths = (overrides: SiyuanPicGoPathOverrides = {}): SiyuanPicGoPaths => {
  if (!hasNodeEnv) {
    return {
      configPath: overrides.configPath,
      baseDir: overrides.baseDir ?? overrides.runtimeDir,
      pluginBaseDir: overrides.pluginBaseDir,
      zhiNpmPath: overrides.zhiNpmPath,
    }
  }

  const localPicGoDir = getDefaultLocalPicGoDir()
  const workspaceConfigPath = getWorkspacePicGoConfigPath(getSiyuanWorkspaceDir())
  const runtimeDir = overrides.baseDir ?? overrides.runtimeDir ?? localPicGoDir
  const pluginBaseDir = overrides.pluginBaseDir ?? runtimeDir

  return {
    configPath: overrides.configPath ?? workspaceConfigPath,
    baseDir: runtimeDir,
    pluginBaseDir,
    zhiNpmPath: overrides.zhiNpmPath,
  }
}

const toUniversalPicGoOptions = (
  paths: SiyuanPicGoPaths,
  isDev?: boolean
): {
  configPath?: string
  baseDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
  isDev?: boolean
} => {
  return {
    configPath: paths.configPath,
    baseDir: paths.baseDir,
    pluginBaseDir: paths.pluginBaseDir,
    zhiNpmPath: paths.zhiNpmPath,
    isDev,
  }
}

const migrateV2WorkspacePicGoConfig = (paths: SiyuanPicGoPaths, logger?: { info?: (...args: any[]) => void; error?: (...args: any[]) => void }): boolean => {
  if (!hasNodeEnv || !paths.configPath || !paths.baseDir) {
    return false
  }

  const fs = win.fs
  const path = win.require("path")
  const workspaceConfigPath = paths.configPath
  const homeConfigPath = path.join(paths.baseDir, "picgo.cfg.json")

  if (path.basename(workspaceConfigPath) !== "picgo.cfg.json") {
    return false
  }

  if (path.resolve(homeConfigPath) === path.resolve(workspaceConfigPath)) {
    return false
  }

  const workspaceConfigDir = path.dirname(workspaceConfigPath)
  if (!fs.existsSync(workspaceConfigDir)) {
    fs.mkdirSync(workspaceConfigDir, { recursive: true })
  }

  if (fs.existsSync(workspaceConfigPath)) {
    logger?.info?.(`PicGo v2 workspace config exists, keep it as authoritative => ${workspaceConfigPath}`)
    return false
  }

  if (!fs.existsSync(homeConfigPath)) {
    return false
  }

  logger?.info?.(`PicGo v2 copy main config from ${homeConfigPath} to ${workspaceConfigPath}`)
  try {
    fs.copyFileSync(homeConfigPath, workspaceConfigPath)
    return true
  } catch (e) {
    logger?.error?.(`copy ${homeConfigPath} to ${workspaceConfigPath} failed: ${e}`)
    return false
  }
}

export {
  getDefaultLocalPicGoDir,
  getSiyuanWorkspaceDir,
  getWorkspacePicGoConfigPath,
  migrateV2WorkspacePicGoConfig,
  resolveSiyuanPicGoPaths,
  toUniversalPicGoOptions,
  type SiyuanPicGoInstanceOptions,
  type SiyuanPicGoPathOverrides,
  type SiyuanPicGoPaths,
}
