/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { hasNodeEnv, win } from "universal-picgo"
import type { SiyuanPicGoPaths } from "./siyuanPicgoPaths"

export type SiyuanPicGoMigrationStatus = "not-started" | "running" | "done" | "failed"

export interface SiyuanPicGoMigrationSnapshot {
  key: string
  status: SiyuanPicGoMigrationStatus
  version: string
  error?: string
  updatedAt?: number
}

export interface SharedMigrationState extends SiyuanPicGoMigrationSnapshot {
  promise?: Promise<void>
}

const MIGRATION_VERSION = "v2.0"
const GLOBAL_MIGRATION_REGISTRY_KEY = "__SIYUAN_PICGO_MIGRATION_STATE_REGISTRY__"
const CONFIG_MARKER_KEY = "siyuan.picgoMigration"

const readConfigText = (paths: SiyuanPicGoPaths = {}): string | undefined => {
  if (!paths.configPath) {
    return undefined
  }

  if (hasNodeEnv && win?.fs) {
    try {
      if (!win.fs.existsSync(paths.configPath)) {
        return undefined
      }
      return win.fs.readFileSync(paths.configPath, "utf-8")
    } catch {
      return undefined
    }
  }

  if (typeof window === "undefined" || !window.localStorage) {
    return undefined
  }

  return window.localStorage.getItem(paths.configPath) ?? undefined
}

const readConfigMarker = (paths: SiyuanPicGoPaths = {}): any => {
  try {
    const raw = readConfigText(paths)
    if (!raw) {
      return undefined
    }
    return JSON.parse(raw)?.siyuan?.picgoMigration
  } catch {
    return undefined
  }
}

const writeConfigMarker = (paths: SiyuanPicGoPaths = {}, marker: any) => {
  if (!paths.configPath) {
    return
  }

  try {
    const raw = readConfigText(paths)
    const cfg = raw ? JSON.parse(raw) : {}
    cfg.siyuan = cfg.siyuan || {}
    cfg.siyuan.picgoMigration = marker

    if (hasNodeEnv && win?.fs) {
      const path = win.require("path")
      const dir = path.dirname(paths.configPath)
      if (!win.fs.existsSync(dir)) {
        win.fs.mkdirSync(dir, { recursive: true })
      }
      win.fs.writeFileSync(paths.configPath, JSON.stringify(cfg, null, 2))
      return
    }

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(paths.configPath, JSON.stringify(cfg))
    }
  } catch {
    // ignore marker write failures; a later run can retry migration safely.
  }
}

export const getSiyuanPicGoMigrationMarkerKey = (): string => CONFIG_MARKER_KEY

export const getSiyuanPicGoMigrationVersion = (): string => MIGRATION_VERSION

export const isSiyuanPicGoMigrationMarkedDone = (paths: SiyuanPicGoPaths = {}): boolean => {
  const marker = readConfigMarker(paths)
  return marker?.version === MIGRATION_VERSION && marker?.status === "done"
}

export const markSiyuanPicGoMigrationDoneInBrowser = (paths: SiyuanPicGoPaths = {}) => {
  writeConfigMarker(paths, {
    version: MIGRATION_VERSION,
    status: "done",
    updatedAt: Date.now(),
  })
}

const getSharedGlobal = (): any => {
  try {
    if (typeof window !== "undefined" && window.top) {
      return window.top as any
    }
  } catch {
    // Fall through to globalThis when top window is not accessible.
  }

  return globalThis as any
}

const getMigrationRegistry = (): Map<string, SharedMigrationState> => {
  const sharedGlobal = getSharedGlobal()
  if (!sharedGlobal[GLOBAL_MIGRATION_REGISTRY_KEY]) {
    sharedGlobal[GLOBAL_MIGRATION_REGISTRY_KEY] = new Map<string, SharedMigrationState>()
  }
  return sharedGlobal[GLOBAL_MIGRATION_REGISTRY_KEY]
}

export const buildSiyuanPicGoMigrationKey = (paths: SiyuanPicGoPaths = {}, apiUrl = ""): string => {
  return JSON.stringify({
    version: MIGRATION_VERSION,
    apiUrl,
    configPath: paths.configPath ?? "",
    baseDir: paths.baseDir ?? "",
    pluginBaseDir: paths.pluginBaseDir ?? "",
    zhiNpmPath: paths.zhiNpmPath ?? "",
  })
}

export const getOrCreateSiyuanPicGoMigrationState = (
  key: string,
  paths: SiyuanPicGoPaths = {}
): SharedMigrationState => {
  const registry = getMigrationRegistry()
  const existing = registry.get(key)
  if (existing) {
    if (isSiyuanPicGoMigrationMarkedDone(paths) && existing.status !== "done") {
      existing.status = "done"
      existing.error = undefined
      existing.updatedAt = Date.now()
      existing.promise = undefined
    }
    return existing
  }

  const state: SharedMigrationState = {
    key,
    status: isSiyuanPicGoMigrationMarkedDone(paths) ? "done" : "not-started",
    version: MIGRATION_VERSION,
  }
  registry.set(key, state)
  return state
}

export const getSiyuanPicGoMigrationSnapshot = (
  key: string,
  paths: SiyuanPicGoPaths = {}
): SiyuanPicGoMigrationSnapshot => {
  const state = getOrCreateSiyuanPicGoMigrationState(key, paths)
  return {
    key: state.key,
    status: state.status,
    version: state.version,
    error: state.error,
    updatedAt: state.updatedAt,
  }
}

export const resetSiyuanPicGoMigrationState = (key: string): SharedMigrationState => {
  const state = getOrCreateSiyuanPicGoMigrationState(key)
  state.status = "not-started"
  state.error = undefined
  state.updatedAt = undefined
  state.promise = undefined
  return state
}
