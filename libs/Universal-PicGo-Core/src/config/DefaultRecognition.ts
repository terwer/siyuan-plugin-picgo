/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import type { ConfigDomain } from "./UnifiedConfigTypes"
import {
  PICGO_MAIN_DEFAULTS,
  EXTERNAL_PICGO_DEFAULTS,
  SIYUAN_CONNECTION_DEFAULTS,
} from "./UnifiedConfigTypes"
import type { IConfig, IExternalPicgoConfig } from "../types"
import type { SiyuanConfigLike } from "./UnifiedConfigTypes"

/**
 * Default-generated recognition for v3 migration.
 *
 * During migration, each domain's owner file is classified as:
 *   - "user-data": contains real user values → authoritative, do not overwrite
 *   - "generated-default": only contains auto-generated defaults → can import legacy data
 *   - "missing": does not exist → can import legacy data
 *
 * @module DefaultRecognition
 * @since 3.0.0
 */

export type DefaultClassification = "user-data" | "generated-default" | "missing"

/**
 * Check if a PicGo main config contains only generated defaults.
 *
 * A config is "generated-default" when:
 *   - Root keys are limited to {"picBed", "picgoPlugins", "siyuan"}
 *   - picBed has only uploader="smms", current="smms" (no real uploader config)
 *   - picgoPlugins is empty
 *   - siyuan matches initial defaults exactly
 */
export function isPicgoMainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false

  const rootKeys = Object.keys(cfg as Record<string, unknown>)
  const allowedRootKeys = new Set(["picBed", "picgoPlugins", "siyuan"])

  // Any unknown root key means user data
  if (rootKeys.some((k) => !allowedRootKeys.has(k))) {
    return false
  }

  const picBed = (cfg.picBed ?? {}) as Record<string, unknown>
  const picBedKeys = Object.keys(picBed)
  // Either selector moving away from the generated default is user intent.
  if (picBed.uploader !== "smms" || picBed.current !== "smms") {
    return false
  }
  // If picBed has more than uploader/current keys, there's real uploader config
  const knownPicBedKeys = new Set(["uploader", "current"])
  if (picBedKeys.some((k) => !knownPicBedKeys.has(k))) {
    return false
  }

  const picgoPlugins = (cfg.picgoPlugins ?? {}) as Record<string, unknown>
  if (Object.keys(picgoPlugins).length > 0) {
    return false
  }

  const siyuan = (cfg.siyuan ?? {}) as Record<string, unknown>
  const defaults = PICGO_MAIN_DEFAULTS.siyuan
  if (siyuan.waitTimeout !== defaults?.waitTimeout) return false
  if (siyuan.retryTimes !== defaults?.retryTimes) return false
  if (siyuan.autoUpload !== defaults?.autoUpload) return false
  if (siyuan.replaceLink !== defaults?.replaceLink) return false
  if (siyuan.txtImageSwitch !== defaults?.txtImageSwitch) return false

  return true
}

/**
 * Check if an external/PicList config contains only generated defaults.
 *
 * A config is "generated-default" when:
 *   - Matches the default shape
 *   - picListApiUrl is empty (non-empty = user data)
 *   - picListApiKey is empty (non-empty = user data)
 */
export function isExternalPicgoGeneratedDefault(cfg: IExternalPicgoConfig | null | undefined): boolean {
  if (!cfg) return false

  // Only the keys that make up the default shape
  const knownKeys = new Set(["useBundledPicgo", "picgoType", "extPicgoApiUrl", "picListApiUrl", "picListApiKey"])
  for (const key of Object.keys(cfg as Record<string, unknown>)) {
    if (!knownKeys.has(key)) return false
  }

  const defaults = EXTERNAL_PICGO_DEFAULTS
  if (cfg.useBundledPicgo !== defaults.useBundledPicgo) return false
  if (
    (cfg as any).picgoType !== undefined &&
    (cfg as any).picgoType !== defaults.picgoType &&
    (cfg as any).picgoType !== "Bundled"
  ) return false
  if ((cfg as any).extPicgoApiUrl !== undefined && (cfg as any).extPicgoApiUrl !== defaults.extPicgoApiUrl) return false

  // Non-empty PicList URL or API key is user data
  if (cfg.picListApiUrl && cfg.picListApiUrl.length > 0 && cfg.picListApiUrl !== "https://example.com/upload") {
    return false
  }
  if (cfg.picListApiKey && cfg.picListApiKey.length > 0) {
    return false
  }

  return true
}

/**
 * Check if a SiYuan connection config contains only generated defaults.
 *
 * A config is "generated-default" when:
 *   - apiUrl matches default "http://127.0.0.1:6806"
 *   - password is empty
 *   - cookie is missing
 *   - No user-edited optional fields
 */
export function isSiyuanConnectionGeneratedDefault(cfg: SiyuanConfigLike | null | undefined): boolean {
  if (!cfg) return false

  const defaults = SIYUAN_CONNECTION_DEFAULTS
  if (cfg.apiUrl !== defaults.apiUrl) return false
  if (cfg.password && cfg.password.length > 0) return false
  if (cfg.cookie && cfg.cookie.length > 0) return false

  // Any optional field with a real user value means user data.
  const optionalKeys = ["home", "previewUrl", "notebook", "picgoUploadTimeout", "passwordType"]
  for (const key of optionalKeys) {
    const value = (cfg as Record<string, unknown>)[key]
    if (value !== undefined && value !== null && value !== "") {
      return false
    }
  }

  // Any additional non-default fields?
  const knownKeys = new Set(["apiUrl", "password", "cookie", "home", "previewUrl", "notebook", "picgoUploadTimeout", "passwordType"])
  for (const key of Object.keys(cfg as Record<string, unknown>)) {
    if (!knownKeys.has(key)) return false
  }

  return true
}

/**
 * Check if Lsky token state contains only generated defaults.
 *
 * Returns "generated-default" when uploader.lsky.token is absent.
 * Any non-empty legacy token is user data.
 */
export function isLskyStateGeneratedDefault(tokenValue: string | null | undefined): boolean {
  return !tokenValue || tokenValue.length === 0
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isPlainObject(value)) return Object.keys(value).length > 0
  // boolean false and numeric 0 are explicit user choices.
  return true
}

const SIYUAN_BEHAVIOR_KEYS = [
  "waitTimeout",
  "retryTimes",
  "autoUpload",
  "replaceLink",
  "txtImageSwitch",
] as const

const PICGO_MAIN_PICBED_KEYS = new Set([
  "uploader",
  "current",
  "transformer",
  "proxy",
  "list",
])

const KNOWN_PICGO_OWNER_ROOT_KEYS = new Set([
  "picBed",
  "picgoPlugins",
  "siyuan",
  "settings",
  "uploader",
  "transformer",
  "debug",
  "silent",
])

function isPicgoMainDomainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false

  const picBed = (cfg.picBed ?? {}) as Record<string, unknown>
  if (hasMeaningfulValue(picBed.uploader) && picBed.uploader !== "smms") return false
  if (hasMeaningfulValue(picBed.current) && picBed.current !== "smms") return false
  if (hasMeaningfulValue(picBed.transformer) && picBed.transformer !== "path") return false
  if (hasMeaningfulValue(picBed.proxy)) return false
  if (hasMeaningfulValue(picBed.list)) return false
  if (hasMeaningfulValue((cfg as any).debug)) return false
  if (hasMeaningfulValue((cfg as any).silent)) return false

  return true
}

function isPicgoSettingsDomainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false
  return !hasMeaningfulValue((cfg as any).settings)
}

function isSiyuanBehaviorDomainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false
  const siyuan = ((cfg as any).siyuan ?? {}) as Record<string, unknown>
  const defaults = PICGO_MAIN_DEFAULTS.siyuan as Record<string, unknown>

  for (const key of SIYUAN_BEHAVIOR_KEYS) {
    const value = siyuan[key]
    if (value !== undefined && value !== defaults[key]) {
      return false
    }
  }

  // `siyuan.picgoMigration` is migration metadata, not behavior user data.
  return true
}

function isPluginValuesDomainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false
  const picgoPlugins = ((cfg as any).picgoPlugins ?? {}) as Record<string, unknown>
  if (Object.keys(picgoPlugins).length > 0) return false

  // Third-party plugin config forms are persisted under their configName at
  // the owner-file root. Treat root-level unknown config objects as plugin
  // values for this domain only; do not let them block uploader/behavior import.
  for (const [key, value] of Object.entries(cfg as Record<string, unknown>)) {
    if (KNOWN_PICGO_OWNER_ROOT_KEYS.has(key)) continue
    if (hasMeaningfulValue(value)) return false
  }

  return true
}

function isUploaderConfigDomainGeneratedDefault(cfg: IConfig | null | undefined): boolean {
  if (!cfg) return false
  const picBed = ((cfg as any).picBed ?? {}) as Record<string, unknown>
  for (const [key, value] of Object.entries(picBed)) {
    if (PICGO_MAIN_PICBED_KEYS.has(key)) continue
    if (hasMeaningfulValue(value)) return false
  }

  const uploader = ((cfg as any).uploader ?? {}) as Record<string, unknown>
  for (const [key, value] of Object.entries(uploader)) {
    if (key === "lsky") {
      const lsky = (value ?? {}) as Record<string, unknown>
      const nonTokenKeys = Object.keys(lsky).filter((k) => k !== "token")
      if (nonTokenKeys.some((k) => hasMeaningfulValue(lsky[k]))) return false
      continue
    }
    if (hasMeaningfulValue(value)) return false
  }

  return true
}

/**
 * Classify a domain's current owner file data as user-data, generated-default, or missing.
 */
export function classifyDomainDefaults(
  domain: ConfigDomain,
  data: any
): DefaultClassification {
  if (data === null || data === undefined) {
    return "missing"
  }

  // Empty objects have no user data — treat as generated-default
  if (typeof data === "object" && Object.keys(data).length === 0) {
    return "generated-default"
  }

  switch (domain) {
    case "picgoMain":
      return isPicgoMainDomainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "picgoSettings":
      return isPicgoSettingsDomainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "siyuanBehavior":
      return isSiyuanBehaviorDomainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "pluginValues":
      return isPluginValuesDomainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "uploaderConfig":
      return isUploaderConfigDomainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "externalPicList":
      return isExternalPicgoGeneratedDefault(data) ? "generated-default" : "user-data"

    case "siyuanConnection":
      return isSiyuanConnectionGeneratedDefault(data) ? "generated-default" : "user-data"

    case "lskyState":
      return isLskyStateGeneratedDefault(data?.uploader?.lsky?.token ?? data?.token) ? "generated-default" : "user-data"

    case "pasteBootstrap":
      // Paste bootstrap is always derived from other domains; never independently "user data"
      return "generated-default"

    default:
      return "missing"
  }
}
