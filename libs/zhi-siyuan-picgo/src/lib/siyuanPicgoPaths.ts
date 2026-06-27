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
  externalConfigPath?: string
  siyuanConnectionConfigPath?: string
  workspaceDir?: string
  baseDir?: string
  runtimeDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
}

interface SiyuanPicGoInstanceOptions {
  isDev?: boolean
  paths?: SiyuanPicGoPathOverrides
  /** Optional storage adapter factory. Overrides runtime environment detection. */
  storageAdapterFactory?: (dbPath: string) => import("universal-picgo-store").StorageAdapter
}

interface SiyuanPicGoPaths {
  configPath?: string
  externalConfigPath?: string
  siyuanConnectionConfigPath?: string
  workspaceDir?: string
  baseDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
}

const SIYUAN_PICGO_BROWSER_BASE_DIR = "universal-picgo"
const SIYUAN_PICGO_MAIN_CONFIG_KEY = `${SIYUAN_PICGO_BROWSER_BASE_DIR}/picgo.cfg.json`
const SIYUAN_PICGO_EXTERNAL_CONFIG_KEY = `${SIYUAN_PICGO_BROWSER_BASE_DIR}/external-picgo-cfg.json`
const SIYUAN_PICGO_SIYUAN_CONNECTION_KEY = "siyuan-cfg"
const SIYUAN_PICGO_KERNEL_CONFIG_PATH = "/data/storage/syp/picgo/picgo.cfg.json"
const SIYUAN_PICGO_KERNEL_EXTERNAL_PATH = "/data/storage/syp/picgo/external-picgo-cfg.json"
const SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH = "/data/storage/syp/siyuan-cfg.json"

const isDefaultInitializedConfig = (raw: string | undefined): boolean => {
  if (!raw) {
    return false
  }

  try {
    const cfg = JSON.parse(raw)
    if (cfg?.siyuan?.picgoMigration?.version === "v3.0-unified-async-config-source") {
      return false
    }
    const allowedRootKeys = new Set(["picBed", "picgoPlugins", "siyuan"])
    const rootKeys = Object.keys(cfg ?? {})
    if (rootKeys.some((key) => !allowedRootKeys.has(key))) {
      return false
    }

    const picBed = cfg?.picBed ?? {}
    const picgoPlugins = cfg?.picgoPlugins ?? {}
    const siyuan = cfg?.siyuan ?? {}

    return (
      picBed.uploader === "smms" &&
      picBed.current === "smms" &&
      Object.keys(picBed).length <= 2 &&
      Object.keys(picgoPlugins).length === 0 &&
      siyuan.waitTimeout === 2 &&
      siyuan.retryTimes === 5 &&
      siyuan.autoUpload === true &&
      siyuan.replaceLink === true &&
      siyuan.txtImageSwitch === false
    )
  } catch {
    return false
  }
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

const getWorkspacePicGoExternalConfigPath = (workspaceDir: string): string | undefined => {
  if (!hasNodeEnv || !workspaceDir) {
    return undefined
  }

  const path = win.require("path")
  return path.join(workspaceDir, "data", "storage", "syp", "picgo", "external-picgo-cfg.json")
}

const getWorkspaceSiyuanConnectionConfigPath = (workspaceDir: string): string | undefined => {
  if (!hasNodeEnv || !workspaceDir) {
    return undefined
  }

  const path = win.require("path")
  return path.join(workspaceDir, "data", "storage", "syp", "siyuan-cfg.json")
}

const hasV3MigrationMarker = (raw: string | undefined): boolean => {
  if (!raw) {
    return false
  }

  try {
    const cfg = JSON.parse(raw)
    return cfg?.siyuan?.picgoMigration?.version === "v3.0-unified-async-config-source"
  } catch {
    return false
  }
}

const resolveSiyuanPicGoOwnerFilePath = (
  logicalKey: string,
  paths: SiyuanPicGoPaths
): string => {
  if (logicalKey === SIYUAN_PICGO_MAIN_CONFIG_KEY) {
    return paths.configPath ?? logicalKey
  }
  if (logicalKey === SIYUAN_PICGO_EXTERNAL_CONFIG_KEY) {
    return paths.externalConfigPath ?? logicalKey
  }
  if (logicalKey === SIYUAN_PICGO_SIYUAN_CONNECTION_KEY) {
    return paths.siyuanConnectionConfigPath ?? logicalKey
  }
  return logicalKey
}

const resolveSiyuanPicGoPaths = (overrides: SiyuanPicGoPathOverrides = {}): SiyuanPicGoPaths => {
  if (!hasNodeEnv) {
    const runtimeDir = overrides.baseDir ?? overrides.runtimeDir ?? SIYUAN_PICGO_BROWSER_BASE_DIR
    return {
      configPath: overrides.configPath ?? SIYUAN_PICGO_MAIN_CONFIG_KEY,
      externalConfigPath: overrides.externalConfigPath ?? SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
      siyuanConnectionConfigPath: overrides.siyuanConnectionConfigPath ?? SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
      workspaceDir: overrides.workspaceDir,
      baseDir: runtimeDir,
      pluginBaseDir: overrides.pluginBaseDir ?? runtimeDir,
      zhiNpmPath: overrides.zhiNpmPath,
    }
  }

  const localPicGoDir = getDefaultLocalPicGoDir()
  const workspaceDir = overrides.workspaceDir ?? getSiyuanWorkspaceDir()
  const workspaceConfigPath = getWorkspacePicGoConfigPath(workspaceDir)
  const workspaceExternalConfigPath = getWorkspacePicGoExternalConfigPath(workspaceDir)
  const workspaceSiyuanConnectionConfigPath = getWorkspaceSiyuanConnectionConfigPath(workspaceDir)
  const runtimeDir = overrides.baseDir ?? overrides.runtimeDir ?? localPicGoDir
  const pluginBaseDir = overrides.pluginBaseDir ?? runtimeDir

  return {
    configPath: overrides.configPath ?? workspaceConfigPath,
    externalConfigPath: overrides.externalConfigPath ?? workspaceExternalConfigPath,
    siyuanConnectionConfigPath: overrides.siyuanConnectionConfigPath ?? workspaceSiyuanConnectionConfigPath,
    workspaceDir,
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
  externalConfigPath?: string
  siyuanConnectionConfigPath?: string
  workspaceDir?: string
  baseDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
  isDev?: boolean
} => {
  return {
    configPath: paths.configPath,
    externalConfigPath: paths.externalConfigPath,
    siyuanConnectionConfigPath: paths.siyuanConnectionConfigPath,
    workspaceDir: paths.workspaceDir,
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
    const workspaceConfigText = fs.readFileSync(workspaceConfigPath, "utf-8")
    if (hasV3MigrationMarker(workspaceConfigText)) {
      logger?.info?.(
        `PicGo v3 migration marker exists in workspace config, skip legacy v2 copy => ${workspaceConfigPath}`
      )
      return false
    }
    if (isDefaultInitializedConfig(workspaceConfigText) && fs.existsSync(homeConfigPath)) {
      logger?.info?.(
        `PicGo v2 workspace config only contains default initialized config, replace it from ${homeConfigPath}`
      )
      try {
        fs.copyFileSync(homeConfigPath, workspaceConfigPath)
        return true
      } catch (e) {
        logger?.error?.(`copy ${homeConfigPath} to ${workspaceConfigPath} failed: ${e}`)
        return false
      }
    }
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
  getWorkspacePicGoExternalConfigPath,
  getWorkspaceSiyuanConnectionConfigPath,
  hasV3MigrationMarker,
  isDefaultInitializedConfig,
  migrateV2WorkspacePicGoConfig,
  resolveSiyuanPicGoOwnerFilePath,
  resolveSiyuanPicGoPaths,
  SIYUAN_PICGO_BROWSER_BASE_DIR,
  SIYUAN_PICGO_KERNEL_CONFIG_PATH,
  SIYUAN_PICGO_KERNEL_EXTERNAL_PATH,
  SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH,
  SIYUAN_PICGO_MAIN_CONFIG_KEY,
  SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
  SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
  toUniversalPicGoOptions,
  type SiyuanPicGoInstanceOptions,
  type SiyuanPicGoPathOverrides,
  type SiyuanPicGoPaths,
}
