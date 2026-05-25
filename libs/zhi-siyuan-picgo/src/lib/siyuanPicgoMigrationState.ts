/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

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

const MIGRATION_VERSION = "picgo-plugin-shell-ux-init-v1"
const GLOBAL_MIGRATION_REGISTRY_KEY = "__SIYUAN_PICGO_MIGRATION_STATE_REGISTRY__"

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

export const getOrCreateSiyuanPicGoMigrationState = (key: string): SharedMigrationState => {
  const registry = getMigrationRegistry()
  const existing = registry.get(key)
  if (existing) {
    return existing
  }

  const state: SharedMigrationState = {
    key,
    status: "not-started",
    version: MIGRATION_VERSION,
  }
  registry.set(key, state)
  return state
}

export const getSiyuanPicGoMigrationSnapshot = (key: string): SiyuanPicGoMigrationSnapshot => {
  const state = getOrCreateSiyuanPicGoMigrationState(key)
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
