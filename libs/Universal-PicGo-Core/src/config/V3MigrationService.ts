/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * PicGo 3.0 V3 Migration Service.
 *
 * Per-domain migration from legacy configuration sources to the unified
 * owner file system. Follows the priority:
 *   1. Existing v3 owner file user data is authoritative (never overwrite)
 *   2. workspace source > home file > browser localStorage
 *   3. Only generated-default data can be replaced by higher-priority sources
 *
 * @module V3MigrationService
 * @since 3.0.0
 */

import type {
  ConfigDomain,
  UnifiedConfigMigrationState,
  MigrationDomainState,
  MigrationDomainStatus,
} from "./UnifiedConfigTypes"
import {
  ALL_CONFIG_DOMAINS,
  INITIAL_MIGRATION_STATE,
  OWNER_FILE_MAP,
  MAIN_CONFIG_LOGICAL_KEY,
  EXTERNAL_CONFIG_LOGICAL_KEY,
  SIYUAN_CONNECTION_LOGICAL_KEY,
} from "./UnifiedConfigTypes"
import { classifyDomainDefaults } from "./DefaultRecognition"
import type { MigrationGlobalStatus } from "./UnifiedConfigTypes"
import { win } from "universal-picgo-store"

// ── Migration Options ────────────────────────────────────────────────

export interface V3MigrationOptions {
  /** Current in-memory data for each owner file. */
  ownerFileData: Map<string, Record<string, any>>
  /** Existing migration state (from picgo.cfg.json:siyuan.picgoMigration). */
  existingState?: Partial<UnifiedConfigMigrationState>
  /** Whether we're in a Node environment (for filesystem access). */
  hasNodeEnv: boolean
  /** SiYuan workspace directory (if available). */
  workspaceDir?: string
  /** Legacy home/local PicGo directory (if available). */
  homeDir?: string
  /** Logger. */
  logger?: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void }
}

// ── Legacy Source Reader ─────────────────────────────────────────────

interface LegacyReader {
  /** Read legacy data for a domain. Returns null if not available. */
  read(domain: ConfigDomain): Promise<LegacySourceResult | null>
}

interface LegacySourceResult {
  source: string
  data: any
  priority: number // Higher = better (workspace=3, home=2, browser=1)
}

/** Create a reader that pulls from browser localStorage. */
function createBrowserLegacyReader(): LegacyReader {
  async function readBrowser(key: string): Promise<any> {
    if (typeof window === "undefined" || !window.localStorage) return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  return {
    async read(domain: ConfigDomain): Promise<LegacySourceResult | null> {
      let key: string
      let data: any

      switch (domain) {
        case "picgoMain":
        case "picgoSettings":
        case "siyuanBehavior":
        case "pluginValues":
        case "uploaderConfig":
          key = MAIN_CONFIG_LOGICAL_KEY
          data = await readBrowser(key)
          break
        case "externalPicList":
          key = EXTERNAL_CONFIG_LOGICAL_KEY
          data = await readBrowser(key)
          break
        case "siyuanConnection":
          key = SIYUAN_CONNECTION_LOGICAL_KEY
          data = await readBrowser(key)
          break
        case "lskyState": {
          // Legacy Lsky token from localStorage
          if (typeof window !== "undefined" && window.localStorage) {
            const token = window.localStorage.getItem("siyuan_picgo_plugin_lsky_token")
            if (token) {
              return { source: "browser:siyuan_picgo_plugin_lsky_token", data: { token }, priority: 1 }
            }
          }
          return null
        }
        case "pasteBootstrap":
          // Paste bootstrap is derived; no independent legacy source
          return null
        default:
          return null
      }

      if (!data) return null
      return { source: `browser:${key}`, data, priority: 1 }
    },
  }
}

function createNodeLegacyReader(options: V3MigrationOptions): LegacyReader {
  const pathApi = getNodePathApi()
  const fsApi = getNodeFsApi()

  async function readJsonFile(filePath?: string): Promise<any> {
    if (!filePath || !fsApi) return null
    try {
      if (!fsApi.existsSync(filePath)) return null
      const raw = fsApi.readFileSync(filePath, "utf-8")
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function sourceFile(domain: ConfigDomain, rootKind: "workspace" | "home"): { path?: string; source: string } | null {
    if (!pathApi) return null
    const root = rootKind === "workspace" ? options.workspaceDir : options.homeDir
    if (!root) return null
    switch (domain) {
      case "picgoMain":
      case "picgoSettings":
      case "siyuanBehavior":
      case "pluginValues":
      case "uploaderConfig":
      case "lskyState": {
        const filePath = rootKind === "workspace"
          ? pathApi.join(root, "data", "storage", "syp", "picgo", "picgo.cfg.json")
          : pathApi.join(root, "picgo.cfg.json")
        return { path: filePath, source: `${rootKind}:${rootKind === "workspace" ? "storage/syp/picgo/picgo.cfg.json" : "picgo.cfg.json"}` }
      }
      case "externalPicList": {
        const filePath = rootKind === "workspace"
          ? pathApi.join(root, "data", "storage", "syp", "picgo", "external-picgo-cfg.json")
          : pathApi.join(root, "external-picgo-cfg.json")
        return { path: filePath, source: `${rootKind}:${rootKind === "workspace" ? "storage/syp/picgo/external-picgo-cfg.json" : "external-picgo-cfg.json"}` }
      }
      case "siyuanConnection": {
        const filePath = rootKind === "workspace"
          ? pathApi.join(root, "data", "storage", "syp", "siyuan-cfg.json")
          : pathApi.join(root, "siyuan-cfg.json")
        return { path: filePath, source: `${rootKind}:${rootKind === "workspace" ? "storage/syp/siyuan-cfg.json" : "siyuan-cfg.json"}` }
      }
      case "pasteBootstrap":
      default:
        return null
    }
  }

  return {
    async read(domain: ConfigDomain): Promise<LegacySourceResult | null> {
      if (!options.hasNodeEnv) return null

      for (const rootKind of ["workspace", "home"] as const) {
        const candidate = sourceFile(domain, rootKind)
        if (!candidate) continue
        const data = await readJsonFile(candidate.path)
        if (!data) continue

        if (domain === "lskyState") {
          const token = data?.uploader?.lsky?.token
          if (typeof token !== "string" || token.trim() === "") continue
          return {
            source: `${candidate.source}:uploader.lsky.token`,
            data: { token },
            priority: rootKind === "workspace" ? 3 : 2,
          }
        }

        return {
          source: candidate.source,
          data,
          priority: rootKind === "workspace" ? 3 : 2,
        }
      }
      return null
    },
  }
}

function createCompositeLegacyReader(readers: LegacyReader[]): LegacyReader {
  return {
    async read(domain: ConfigDomain): Promise<LegacySourceResult | null> {
      let best: LegacySourceResult | null = null
      for (const reader of readers) {
        const result = await reader.read(domain)
        if (!result) continue
        if (!best || result.priority > best.priority) {
          best = result
        }
      }
      return best
    },
  }
}

// ── Migration Engine ─────────────────────────────────────────────────

/**
 * Execute or resume PicGo 3.0 unified async config migration.
 *
 * Implements per-domain idempotent migration with:
 * - Domain granularity: successes are never rolled back
 * - Default-generated recognition: only generated defaults can be replaced
 * - Priority: workspace > home > browser
 * - importedSources tracking
 * - Retry via retryMigration(domains?)
 */
export async function runV3Migration(options: V3MigrationOptions): Promise<UnifiedConfigMigrationState> {
  const logger = options.logger ?? { info: () => {}, warn: () => {}, error: () => {} }
  const state = initMigrationState(options.existingState)

  if (state.status === "done") {
    logger.info("[V3Migration] migration already complete, skipping")
    return state
  }

  state.status = "running"
  state.attempts++
  state.updatedAt = Date.now()

  const legacyReader = createCompositeLegacyReader([
    createNodeLegacyReader(options),
    createBrowserLegacyReader(),
  ])

  for (const domain of ALL_CONFIG_DOMAINS) {
    const domainState = state.domains[domain]
    if (domainState.status === "imported" || domainState.status === "skipped") {
      continue // Already done — idempotent
    }

    try {
      const result = await migrateDomain(domain, options.ownerFileData, legacyReader, logger)
      state.domains[domain] = result
    } catch (e: any) {
      state.domains[domain] = {
        status: "failed",
        importedSources: domainState.importedSources,
        updatedAt: Date.now(),
        error: e?.message ?? String(e),
      }
      logger.error(`[V3Migration] domain ${domain} failed:`, e?.message ?? e)
    }
  }

  // Determine global status
  const hasFailures = ALL_CONFIG_DOMAINS.some((d) => state.domains[d].status === "failed")
  state.status = hasFailures ? "failed" : "done"
  state.updatedAt = Date.now()

  logger.info(`[V3Migration] complete, status=${state.status}`)
  return state
}

/**
 * Retry failed domain migrations.
 * Does NOT clear already-successful domains.
 */
export async function retryV3Migration(
  options: V3MigrationOptions,
  domains?: ConfigDomain[]
): Promise<UnifiedConfigMigrationState> {
  const state = initMigrationState(options.existingState)
  const targets = domains ?? ALL_CONFIG_DOMAINS.filter((d) => state.domains[d].status === "failed")

  state.status = "running"
  state.attempts++
  state.updatedAt = Date.now()

  const legacyReader = createCompositeLegacyReader([
    createNodeLegacyReader(options),
    createBrowserLegacyReader(),
  ])

  for (const domain of targets) {
    try {
      const result = await migrateDomain(domain, options.ownerFileData, legacyReader, options.logger)
      state.domains[domain] = result
    } catch (e: any) {
      state.domains[domain] = {
        ...state.domains[domain],
        status: "failed",
        updatedAt: Date.now(),
        error: e?.message ?? String(e),
      }
    }
  }

  const hasFailures = ALL_CONFIG_DOMAINS.some(
    (d) => state.domains[d].status === "failed"
  )
  state.status = hasFailures ? "failed" : "done"
  state.updatedAt = Date.now()
  return state
}

// ── Per-Domain Migration ─────────────────────────────────────────────

async function migrateDomain(
  domain: ConfigDomain,
  ownerFileData: Map<string, Record<string, any>>,
  browserReader: LegacyReader,
  logger?: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void }
): Promise<MigrationDomainState> {
  const ownerFile = OWNER_FILE_MAP[domain]
  const currentData = ownerFileData.get(ownerFile)
  const classification = classifyDomainDefaults(domain, currentData)

  // If user data already exists, it's authoritative — don't import
  if (classification === "user-data") {
    return {
      status: "imported",
      importedSources: [`v3-owner-file:${ownerFile}`],
      updatedAt: Date.now(),
    }
  }

  // Try to import from legacy sources
  const legacyResult = await browserReader.read(domain)
  if (legacyResult && legacyResult.data) {
    applyMigratedData(domain, ownerFileData, legacyResult, logger)
    return {
      status: "imported",
      importedSources: [legacyResult.source],
      updatedAt: Date.now(),
    }
  }

  // No legacy data available — skip
  return {
    status: "skipped",
    importedSources: [],
    updatedAt: Date.now(),
  }
}

function applyMigratedData(
  domain: ConfigDomain,
  ownerFileData: Map<string, Record<string, any>>,
  legacy: LegacySourceResult,
  logger?: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void }
): void {
  const ownerFile = OWNER_FILE_MAP[domain]

  switch (domain) {
    case "lskyState": {
      // Lsky token: legacy { token: "..." } → uploader.lsky.token in picgo.cfg.json
      const token = legacy.data?.token
      if (token && typeof token === "string" && token.length > 0) {
        const main = ownerFileData.get("picgo.cfg.json") ?? {}
        main.uploader = main.uploader ?? {}
        main.uploader.lsky = main.uploader.lsky ?? {}
        main.uploader.lsky.token = token
        ownerFileData.set("picgo.cfg.json", main)
        logger?.info?.(`[V3Migration] lskyState: imported token from ${legacy.source}`)
      }
      break
    }

    case "picgoMain":
    case "picgoSettings":
    case "siyuanBehavior":
    case "pluginValues":
    case "uploaderConfig": {
      // All map to picgo.cfg.json, but migration is per-domain.  Do not
      // merge the whole legacy owner file here: user data in one shared-owner
      // domain (for example siyuan.autoUpload=false) must not block or be
      // overwritten by another domain (for example plugin values).
      const main = ownerFileData.get("picgo.cfg.json") ?? {}
      mergePicgoDomainSlice(main, domain, extractPicgoDomainSlice(domain, legacy.data))
      ownerFileData.set("picgo.cfg.json", main)
      logger?.info?.(`[V3Migration] ${domain}: imported from ${legacy.source}`)
      break
    }

    case "externalPicList": {
      const ext = ownerFileData.get("external-picgo-cfg.json") ?? {}
      for (const [key, value] of Object.entries(legacy.data as Record<string, any>)) {
        ext[key] = value
      }
      ownerFileData.set("external-picgo-cfg.json", ext)
      logger?.info?.(`[V3Migration] externalPicList: imported from ${legacy.source}`)
      break
    }

    case "siyuanConnection": {
      const conn = ownerFileData.get("siyuan-cfg") ?? {}
      for (const [key, value] of Object.entries(legacy.data as Record<string, any>)) {
        conn[key] = value
      }
      ownerFileData.set("siyuan-cfg", conn)
      logger?.info?.(`[V3Migration] siyuanConnection: imported from ${legacy.source}`)
      break
    }

    case "pasteBootstrap":
      // Derived — no independent migration
      break

    default:
      break
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

const SIYUAN_BEHAVIOR_KEYS = [
  "waitTimeout",
  "retryTimes",
  "autoUpload",
  "replaceLink",
  "txtImageSwitch",
] as const

const PICGO_MAIN_PICBED_KEYS = [
  "uploader",
  "current",
  "transformer",
  "proxy",
  "list",
] as const

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

function pickDefined(source: Record<string, any> | undefined, keys: readonly string[]): Record<string, any> {
  const out: Record<string, any> = {}
  if (!source) return out
  for (const key of keys) {
    if (source[key] !== undefined) {
      out[key] = source[key]
    }
  }
  return out
}

function extractPicgoDomainSlice(domain: ConfigDomain, data: any): Record<string, any> {
  const source = (data ?? {}) as Record<string, any>
  switch (domain) {
    case "picgoMain": {
      const picBed = pickDefined(source.picBed, PICGO_MAIN_PICBED_KEYS)
      const slice: Record<string, any> = {}
      if (Object.keys(picBed).length > 0) slice.picBed = picBed
      for (const key of ["debug", "silent"]) {
        if (source[key] !== undefined) slice[key] = source[key]
      }
      return slice
    }

    case "picgoSettings":
      return source.settings !== undefined ? { settings: source.settings } : {}

    case "siyuanBehavior": {
      const siyuan = pickDefined(source.siyuan, SIYUAN_BEHAVIOR_KEYS)
      return Object.keys(siyuan).length > 0 ? { siyuan } : {}
    }

    case "pluginValues": {
      const slice: Record<string, any> = {}
      if (source.picgoPlugins !== undefined) {
        slice.picgoPlugins = source.picgoPlugins
      }
      for (const [key, value] of Object.entries(source)) {
        if (KNOWN_PICGO_OWNER_ROOT_KEYS.has(key)) continue
        slice[key] = value
      }
      return slice
    }

    case "uploaderConfig": {
      const picBed: Record<string, any> = {}
      for (const [key, value] of Object.entries((source.picBed ?? {}) as Record<string, any>)) {
        if (!PICGO_MAIN_PICBED_KEYS.includes(key as any)) {
          picBed[key] = value
        }
      }
      const slice: Record<string, any> = {}
      if (Object.keys(picBed).length > 0) slice.picBed = picBed
      if (source.uploader !== undefined) {
        slice.uploader = source.uploader
      }
      if (source.transformer !== undefined) {
        slice.transformer = source.transformer
      }
      return slice
    }

    default:
      return {}
  }
}

function mergeObject(target: Record<string, any>, source: Record<string, any>): void {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      mergeObject(target[key], value as Record<string, any>)
      continue
    }
    if (target[key] === undefined || target[key] === null || target[key] === "") {
      target[key] = value
    }
  }
}

function mergePicgoDomainSlice(main: Record<string, any>, domain: ConfigDomain, slice: Record<string, any>): void {
  switch (domain) {
    case "picgoMain":
      if (slice.picBed) {
        main.picBed = main.picBed ?? {}
        Object.assign(main.picBed, slice.picBed)
      }
      for (const key of ["debug", "silent"]) {
        if (slice[key] !== undefined) {
          main[key] = slice[key]
        }
      }
      break

    case "uploaderConfig": {
      if (slice.picBed) {
        main.picBed = main.picBed ?? {}
        mergeObject(main.picBed, slice.picBed)
      }
      if (slice.uploader) {
        main.uploader = main.uploader ?? {}
        mergeObject(main.uploader, slice.uploader)
      }
      if (slice.transformer) {
        main.transformer = main.transformer ?? {}
        mergeObject(main.transformer, slice.transformer)
      }
      for (const key of ["debug", "silent"]) {
        if (slice[key] !== undefined && main[key] === undefined) {
          main[key] = slice[key]
        }
      }
      break
    }

    case "picgoSettings":
      if (slice.settings) {
        main.settings = main.settings ?? {}
        mergeObject(main.settings, slice.settings)
      }
      break

    case "siyuanBehavior":
      if (slice.siyuan) {
        main.siyuan = main.siyuan ?? {}
        Object.assign(main.siyuan, slice.siyuan)
      }
      break

    case "pluginValues":
      if (slice.picgoPlugins) {
        main.picgoPlugins = main.picgoPlugins ?? {}
        mergeObject(main.picgoPlugins, slice.picgoPlugins)
      }
      for (const [key, value] of Object.entries(slice)) {
        if (key === "picgoPlugins") continue
        if (main[key] === undefined) {
          main[key] = value
        }
      }
      break
  }
}

function initMigrationState(
  existing?: Partial<UnifiedConfigMigrationState>
): UnifiedConfigMigrationState {
  if (existing?.version === "v3.0-unified-async-config-source") {
    // Restore existing state with defaults for missing domains
    const domains: Record<ConfigDomain, MigrationDomainState> = {} as any
    for (const d of ALL_CONFIG_DOMAINS) {
      domains[d] = existing.domains?.[d] ?? { status: "not-started", importedSources: [] }
    }
    return {
      version: "v3.0-unified-async-config-source",
      status: existing.status ?? "not-started",
      attempts: existing.attempts ?? 0,
      updatedAt: existing.updatedAt,
      error: existing.error,
      domains,
    }
  }

  // Fresh start
  return JSON.parse(JSON.stringify(INITIAL_MIGRATION_STATE))
}

function getNodeFsApi(): any {
  try {
    if (win?.fs) return win.fs
  } catch {
    return null
  }
  return null
}

function getNodePathApi(): any {
  try {
    if (win?.require) return win.require("path")
  } catch {
    return null
  }
  return null
}
