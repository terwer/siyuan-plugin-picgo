/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * PicGo 3.0 Unified Async Configuration Types.
 *
 * Defines the configuration domains, snapshot shape, facade contract,
 * migration state, and error types for the unified async configuration
 * access layer that supersedes v2's main-config-only persistence boundary.
 *
 * @module UnifiedConfigTypes
 * @since 3.0.0
 */

import type { IConfig, IExternalPicgoConfig } from "../types"

/**
 * Minimal SiYuan connection configuration.
 *
 * Defined locally to avoid circular dependency between universal-picgo
 * and zhi-siyuan-picgo. The actual type in zhi-siyuan-picgo has the
 * same shape and is used by the factory layer.
 */
export interface SiyuanConfigLike {
  apiUrl?: string
  password?: string
  cookie?: string
  home?: string
  previewUrl?: string
  notebook?: string
  picgoUploadTimeout?: number
  passwordType?: unknown
}

// ── Configuration Domains ────────────────────────────────────────────

/**
 * Per-domain routing key for the unified configuration facade.
 *
 * Each domain maps to a specific owner file and migration priority.
 * @see design.md § Complete Configuration Domain Mapping
 */
export type ConfigDomain =
  | "picgoMain"
  | "picgoSettings"
  | "siyuanBehavior"
  | "siyuanConnection"
  | "externalPicList"
  | "pluginValues"
  | "uploaderConfig"
  | "lskyState"
  | "pasteBootstrap"

/** All configuration domains as a readonly array for iteration. */
export const ALL_CONFIG_DOMAINS: readonly ConfigDomain[] = [
  "picgoMain",
  "picgoSettings",
  "siyuanBehavior",
  "siyuanConnection",
  "externalPicList",
  "pluginValues",
  "uploaderConfig",
  "lskyState",
  "pasteBootstrap",
] as const

// ── Facade Options ───────────────────────────────────────────────────

/**
 * Options passed to `createUnifiedPicGoConfigFacade`.
 *
 * Specifies runtime environment, storage resolution, and migration
 * behavior for the unified async configuration facade.
 */
export interface UnifiedPicGoConfigFacadeOptions {
  /** SiYuan connection config used to create the Kernel API wrapper. */
  siyuanConfig: SiyuanConfigLike

  /** Logical paths / overrides for owner file resolution. */
  paths: UnifiedConfigPaths

  /** Whether to run in dev mode (enables debug logging). */
  isDev?: boolean

  /**
   * Optional storage adapter factory.
   * When provided, overrides the L1-L4 decision tree for all owner files.
   */
  storageAdapterFactory?: (dbPath: string) => import("universal-picgo-store").StorageAdapter

  /**
   * Optional logger factory.
   * When omitted, a simple console logger is used.
   */
  getLogger?: (name: string) => { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void }
}

/**
 * Path overrides for owner file resolution.
 *
 * All paths default to the environment-appropriate locations derived
 * from the SiYuan workspace and host runtime.
 */
export interface UnifiedConfigPaths {
  /** Override for PicGo main owner file path. */
  configPath?: string
  /** Device-local runtime directory. */
  baseDir?: string
  /** Alias for baseDir. */
  runtimeDir?: string
  /** Device-local third-party plugin directory. */
  pluginBaseDir?: string
  /** zhi npm helper path. */
  zhiNpmPath?: string
}

// ── Unified Configuration Snapshot ───────────────────────────────────

/**
 * Paste takeover snapshot derived from ready owner file data.
 *
 * Constructed during facade initialization for synchronous paste
 * event decisions without async boundary crossing.
 */
export interface PasteTakeoverSnapshot {
  /** Whether auto-upload on paste is enabled. */
  autoUpload: boolean
  /** Whether picture+text mixed paste is allowed (txtImageSwitch). */
  allowPicAndText: boolean
  /** Whether replace link on upload is enabled. */
  replaceLink: boolean
}

/**
 * Complete unified configuration snapshot assembled from all owner files.
 *
 * Returned by `ReadyUnifiedPicGoConfigFacade.getSnapshot()` and
 * `reload()`. Contains pure serializable data — no Vue reactivity,
 * no framework bindings.
 */
export interface UnifiedConfigSnapshot {
  /** PicGo main config (uploader, picBed, siyuan behavior, etc.). */
  picgo: IConfig
  /** External PicGo App / PicList route configuration. */
  externalPicgo: IExternalPicgoConfig
  /** SiYuan connection configuration (apiUrl, password, cookie). */
  siyuanConnection: SiyuanConfigLike
  /** Pre-warmed snapshot for synchronous paste takeover decisions. */
  pasteTakeover: PasteTakeoverSnapshot
  /** V3 migration state tracker. */
  migration: UnifiedConfigMigrationState
}

// ── Ready Facade Interface ───────────────────────────────────────────

/**
 * Resolved unified async configuration facade.
 *
 * This is the ONLY production boundary for PicGo/plugin user
 * configuration access in PicGo 3.0. All configuration reads,
 * writes, and mutations must go through this interface.
 *
 * The facade is never half-ready: `createUnifiedPicGoConfigFacade()`
 * returns a Promise that only resolves when all owner files are
 * loaded, migration is complete (or skipped), and defaults are merged.
 */
export interface ReadyUnifiedPicGoConfigFacade {
  /** Whether the underlying storage backends are sync or async. */
  readonly storageMode: "sync" | "async"

  /** Unique key identifying this facade instance. */
  readonly instanceKey: string

  /**
   * Return the full in-memory configuration snapshot.
   * Synchronous — returns the last loaded state.
   */
  getSnapshot(): UnifiedConfigSnapshot

  /**
   * Read the PicGo main configuration domain.
   * Returns a deep-cloned snapshot to prevent accidental mutation.
   */
  getPicGoConfig(): Promise<IConfig>

  /**
   * Read the external/PicList configuration domain.
   */
  getExternalPicGoConfig(): Promise<IExternalPicgoConfig>

  /**
   * Read the SiYuan connection configuration domain.
   * Note: password and cookie are real values in the returned object;
   * callers must mask before displaying or logging.
   */
  getSiyuanConnectionConfig(): Promise<SiyuanConfigLike>

  /**
   * Read the pre-warmed paste takeover snapshot.
   * Synchronous — designed for paste event handlers.
   */
  getPasteTakeoverSnapshot(): Promise<PasteTakeoverSnapshot>

  /**
   * Mutate the PicGo main configuration in-memory.
   * The change is applied immediately; persistence is deferred.
   * Mark the picgoMain (and any sub-domain) as dirty.
   */
  updatePicGoConfig(mutator: (draft: IConfig) => void): Promise<void>

  /**
   * Mutate the external/PicList configuration in-memory.
   */
  updateExternalPicGoConfig(mutator: (draft: IExternalPicgoConfig) => void): Promise<void>

  /**
   * Mutate the SiYuan connection configuration in-memory.
   */
  updateSiyuanConnectionConfig(mutator: (draft: SiyuanConfigLike) => void): Promise<void>

  /**
   * Flush dirty domains to their owner files.
   * If no domains specified, flushes all dirty domains.
   * Throws ConfigFlushError on any write failure.
   */
  flush(domains?: ConfigDomain[]): Promise<void>

  /**
   * Flush, then re-read from storage, then return refreshed snapshot.
   * Uses writeVersion to avoid overwriting local changes with stale remote data.
   */
  reload(domains?: ConfigDomain[]): Promise<UnifiedConfigSnapshot>

  /**
   * Return the current v3 migration state.
   */
  getMigrationState(): Promise<UnifiedConfigMigrationState>

  /**
   * Explicitly retry failed domain migrations.
   * Does not clear already-successful domains.
   */
  retryMigration(domains?: ConfigDomain[]): Promise<UnifiedConfigMigrationState>

  /**
   * Return a deep-cloned snapshot with all sensitive fields masked as "******".
   * Safe for logging, error messages, diagnostics, and audit evidence.
   */
  maskSnapshot(snapshot: UnifiedConfigSnapshot): UnifiedConfigSnapshot
}

// ── Migration State ──────────────────────────────────────────────────

/** Per-domain migration status. */
export type MigrationDomainStatus = "not-started" | "imported" | "skipped" | "failed"

/** Global migration status. */
export type MigrationGlobalStatus = "not-started" | "running" | "done" | "failed"

/** Per-domain migration record. */
export interface MigrationDomainState {
  status: MigrationDomainStatus
  /** Identifiers of imported legacy sources (e.g., "v2-workspace-picgo.cfg.json"). */
  importedSources: string[]
  updatedAt?: number
  error?: string
}

/**
 * V3 unified async config source migration marker.
 *
 * Stored at `picgo.cfg.json:siyuan.picgoMigration` with
 * version = "v3.0-unified-async-config-source".
 */
export interface UnifiedConfigMigrationState {
  /** Fixed version marker for PicGo 3.0. */
  version: "v3.0-unified-async-config-source"
  /** Global migration status. */
  status: MigrationGlobalStatus
  /** Unix timestamp of last status update. */
  updatedAt?: number
  /** Error message if global status is "failed". */
  error?: string
  /** Number of migration attempts. */
  attempts: number
  /** Per-domain migration progress. */
  domains: Record<ConfigDomain, MigrationDomainState>
}

/** Initial migration state before any migration runs. */
export const INITIAL_MIGRATION_STATE: UnifiedConfigMigrationState = {
  version: "v3.0-unified-async-config-source",
  status: "not-started",
  attempts: 0,
  domains: {
    picgoMain: { status: "not-started", importedSources: [] },
    picgoSettings: { status: "not-started", importedSources: [] },
    siyuanBehavior: { status: "not-started", importedSources: [] },
    siyuanConnection: { status: "not-started", importedSources: [] },
    externalPicList: { status: "not-started", importedSources: [] },
    pluginValues: { status: "not-started", importedSources: [] },
    uploaderConfig: { status: "not-started", importedSources: [] },
    lskyState: { status: "not-started", importedSources: [] },
    pasteBootstrap: { status: "not-started", importedSources: [] },
  },
}

// ── Error Types ──────────────────────────────────────────────────────

/**
 * Thrown when production code attempts to read user configuration
 * before the unified facade has resolved (ready barrier not passed).
 */
export class ConfigNotReadyError extends Error {
  constructor(message = "Unified config facade is not ready; await createUnifiedPicGoConfigFacade() first") {
    super(message)
    this.name = "ConfigNotReadyError"
  }
}

/**
 * Thrown when flush() encounters a write failure for one or more domains.
 * Contains per-domain failure details with owner file information.
 */
export class ConfigFlushError extends Error {
  /** Per-domain flush failure details. */
  public readonly failures: ConfigFlushFailure[]

  constructor(failures: ConfigFlushFailure[], message?: string) {
    super(message ?? `Config flush failed for ${failures.length} domain(s)`)
    this.name = "ConfigFlushError"
    this.failures = failures
  }
}

/** Single domain flush failure detail. */
export interface ConfigFlushFailure {
  domain: ConfigDomain
  ownerFile: string
  error: string
}

// ── Sensitive Field Detection ────────────────────────────────────────

/**
 * Regular expression patterns for detecting sensitive field names
 * that must be masked in non-persistence outputs.
 *
 * These fields are stored as real values in owner files but MUST
 * be rendered as "******" in logs, errors, migration reports,
 * diagnostics, and smoke evidence.
 */
export const SENSITIVE_FIELD_PATTERNS: readonly RegExp[] = [
  /^password$/i,
  /^cookie$/i,
  /^token$/i,
  /^secret$/i,
  /^secretKey$/i,
  /^accessKey$/i,
  /^accessKeyId$/i,
  /^accessKeySecret$/i,
  /^secretAccessKey$/i,
  /^picListApiKey$/i,
  /^apiKey$/i,
  /^key$/i,
] as const

/** Mask value used for all sensitive field outputs. */
export const MASK_VALUE = "******" as const

// ── Owner File Mapping ───────────────────────────────────────────────

/**
 * Owner file name for each configuration domain.
 *
 * Domains sharing the same owner file are flushed together
 * when any of them is dirty.
 */
export const OWNER_FILE_MAP: Record<ConfigDomain, string> = {
  picgoMain: "picgo.cfg.json",
  picgoSettings: "picgo.cfg.json",
  siyuanBehavior: "picgo.cfg.json",
  siyuanConnection: "siyuan-cfg",
  externalPicList: "external-picgo-cfg.json",
  pluginValues: "picgo.cfg.json",
  uploaderConfig: "picgo.cfg.json",
  lskyState: "picgo.cfg.json",
  pasteBootstrap: "picgo.cfg.json", // Derived snapshot, reads from picgoMain + siyuanConnection
}

/**
 * Logical key prefix used for browser localStorage fallback.
 */
export const DEFAULT_LOGICAL_KEY_PREFIX = "universal-picgo" as const

/** Logical key for PicGo main config in browser fallback. */
export const MAIN_CONFIG_LOGICAL_KEY = `${DEFAULT_LOGICAL_KEY_PREFIX}/picgo.cfg.json` as const

/** Logical key for external/PicList config in browser fallback. */
export const EXTERNAL_CONFIG_LOGICAL_KEY = `${DEFAULT_LOGICAL_KEY_PREFIX}/external-picgo-cfg.json` as const

/** Logical key for SiYuan connection config in browser fallback. */
export const SIYUAN_CONNECTION_LOGICAL_KEY = "siyuan-cfg" as const

/** Kernel-backed workspace path for PicGo main config. */
export const KERNEL_MAIN_CONFIG_PATH = "/data/storage/syp/picgo/picgo.cfg.json" as const

/** Kernel-backed workspace path for external/PicList config. */
export const KERNEL_EXTERNAL_CONFIG_PATH = "/data/storage/syp/picgo/external-picgo-cfg.json" as const

/** Kernel-backed workspace path for SiYuan connection config. */
export const KERNEL_SIYUAN_CONNECTION_PATH = "/data/storage/syp/siyuan-cfg.json" as const

// ── Default Values ───────────────────────────────────────────────────

/** Default values for PicGo main config. Matches ConfigDb.initialValue exactly. */
export const PICGO_MAIN_DEFAULTS: Partial<IConfig> = {
  picBed: {
    uploader: "smms",
    current: "smms",
  },
  picgoPlugins: {},
  siyuan: {
    waitTimeout: 2,
    retryTimes: 5,
    autoUpload: true,
    replaceLink: true,
    txtImageSwitch: false,
  },
}

/** Default values for external/PicList config. */
export const EXTERNAL_PICGO_DEFAULTS: IExternalPicgoConfig = {
  useBundledPicgo: true,
  picgoType: "Bundled" as any,
  extPicgoApiUrl: "http://127.0.0.1:36677",
  picListApiUrl: "",
  picListApiKey: "",
}

/** Default values for SiYuan connection config. */
export const SIYUAN_CONNECTION_DEFAULTS: SiyuanConfigLike = {
  apiUrl: "http://127.0.0.1:6806",
  password: "",
}

/**
 * Per-domain default factories.
 *
 * Each factory returns a fresh default object to avoid shared-mutation bugs.
 */
export const DOMAIN_DEFAULTS: Record<ConfigDomain, () => any> = {
  picgoMain: () => structuredClone?.(PICGO_MAIN_DEFAULTS) ?? JSON.parse(JSON.stringify(PICGO_MAIN_DEFAULTS)),
  picgoSettings: () => ({}),
  siyuanBehavior: () => structuredClone?.(PICGO_MAIN_DEFAULTS.siyuan) ?? { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
  siyuanConnection: () => structuredClone?.(SIYUAN_CONNECTION_DEFAULTS) ?? { apiUrl: "http://127.0.0.1:6806", password: "" },
  externalPicList: () => structuredClone?.(EXTERNAL_PICGO_DEFAULTS) ?? JSON.parse(JSON.stringify(EXTERNAL_PICGO_DEFAULTS)),
  pluginValues: () => ({}),
  uploaderConfig: () => ({}),
  lskyState: () => ({}),
  pasteBootstrap: () => ({ autoUpload: true, allowPicAndText: false, replaceLink: true }),
}
