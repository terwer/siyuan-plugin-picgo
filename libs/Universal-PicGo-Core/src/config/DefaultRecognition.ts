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
  if (picBed.uploader !== "smms" && picBed.current !== "smms") {
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
  const defaults = EXTERNAL_PICGO_DEFAULTS
  if (cfg.useBundledPicgo !== defaults.useBundledPicgo) return false

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
    case "picgoSettings":
    case "siyuanBehavior":
    case "pluginValues":
    case "uploaderConfig":
      return isPicgoMainGeneratedDefault(data) ? "generated-default" : "user-data"

    case "externalPicList":
      return isExternalPicgoGeneratedDefault(data) ? "generated-default" : "user-data"

    case "siyuanConnection":
      return isSiyuanConnectionGeneratedDefault(data) ? "generated-default" : "user-data"

    case "lskyState":
      return isLskyStateGeneratedDefault(data?.token) ? "generated-default" : "user-data"

    case "pasteBootstrap":
      // Paste bootstrap is always derived from other domains; never independently "user data"
      return "generated-default"

    default:
      return "missing"
  }
}
