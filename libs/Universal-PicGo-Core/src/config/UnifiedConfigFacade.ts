/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * PicGo 3.0 Unified Async Configuration Facade.
 *
 * Provides the sole production boundary for all PicGo/plugin user
 * configuration access. Routes reads/writes to domain-specific owner
 * files through storage adapters resolved by the L1-L4 decision tree.
 *
 * The facade is never half-ready: the factory Promise only resolves
 * after all owner files are loaded, migration is complete, and defaults
 * are merged.
 *
 * @module UnifiedConfigFacade
 * @since 3.0.0
 */

import type {
  ConfigDomain,
  ReadyUnifiedPicGoConfigFacade,
  UnifiedConfigSnapshot,
  UnifiedConfigMigrationState,
  UnifiedPicGoConfigFacadeOptions,
  PasteTakeoverSnapshot,
  SiyuanConfigLike,
} from "./UnifiedConfigTypes"
import {
  ALL_CONFIG_DOMAINS,
  OWNER_FILE_MAP,
  INITIAL_MIGRATION_STATE,
  MAIN_CONFIG_LOGICAL_KEY,
  EXTERNAL_CONFIG_LOGICAL_KEY,
  SIYUAN_CONNECTION_LOGICAL_KEY,
  UNIFIED_CONFIG_MIGRATION_VERSION,
  ConfigNotReadyError,
  ConfigFlushError,
  ConfigReadError,
  type ConfigFlushFailure,
} from "./UnifiedConfigTypes"
import { maskSnapshot } from "./MaskUtils"
import type { IConfig, IExternalPicgoConfig } from "../types"
import type { StorageAdapter } from "universal-picgo-store"
import { runV3Migration as runMigrationService, retryV3Migration as retryMigrationService } from "./V3MigrationService"

// ── Internal State ───────────────────────────────────────────────────

interface OwnerFileState {
  /** Logical path / key for this owner file. */
  logicalKey: string
  /** Resolved storage adapter. */
  adapter: StorageAdapter
  /** In-memory data loaded from storage. */
  data: Record<string, any>
  /** Whether this owner file has pending (dirty) writes. */
  dirty: boolean
  /** Monotonic version of the latest local mutation for this owner file. */
  dirtyVersion: number
  /** Last mutation version that was durably written for this owner file. */
  flushedVersion: number
  /** Per-owner write queue. Always normalized to a non-rejecting tail. */
  writeQueue: Promise<void>
  /** Raw in-flight write task, kept so explicit flush can join and observe errors. */
  currentWriteTask?: Promise<void>
  /** Mutation version covered by currentWriteTask. */
  currentWriteVersion: number
  /** Domains that map to this owner file. */
  domains: ConfigDomain[]
}

interface FacadeInternalState {
  instanceKey: string
  storageMode: "sync" | "async"
  ownerFiles: Map<string, OwnerFileState>
  migrationState: UnifiedConfigMigrationState
  writeVersion: number
  ready: boolean
  debounceTimers: Map<string, ReturnType<typeof setTimeout>>
}

// ── Adapter Resolution (L1-L4) ───────────────────────────────────────

/**
 * Resolve a storage adapter for a single owner file.
 *
 * Decision tree (L1 → L4):
 *   1. Node environment → JSONAdapter (filesystem)
 *   2. SiYuan window with workspaceDir → SiYuanKernelStorageAdapter
 *   3. SiYuan proxy available → SiYuanKernelStorageAdapter
 *   4. Fallback → LocalStorageAdapter
 *
 * When a custom storageAdapterFactory is provided in options,
 * it is used for ALL owner files, bypassing the decision tree.
 */
function resolveOwnerAdapter(
  ownerFile: string,
  logicalKey: string,
  options: UnifiedPicGoConfigFacadeOptions
): StorageAdapter {
  // Custom factory bypasses the decision tree
  if (options.storageAdapterFactory) {
    return options.storageAdapterFactory(logicalKey)
  }

  // Otherwise resolve by runtime environment (L1-L4 decision tree)
  return resolveByRuntime(ownerFile, logicalKey, options)
}

function resolveByRuntime(
  ownerFile: string,
  logicalKey: string,
  options: UnifiedPicGoConfigFacadeOptions
): StorageAdapter {
  // Lazy imports to avoid circular deps and bundling issues
  try {
    // Check for Node
    if (typeof process !== "undefined" && typeof require !== "undefined") {
      const { JSONAdapter } = require("universal-picgo-store") as any
      return new JSONAdapter(resolveNodeOwnerPath(ownerFile, logicalKey, options))
    }

    // Check for SiYuan window
    if (typeof window !== "undefined" && (window as any)?.siyuan?.config?.system?.workspaceDir) {
      // Will be resolved by the factory layer with proper SiyuanKernelApi
      const { LocalStorageAdapter } = require("universal-picgo-store") as any
      return new LocalStorageAdapter(logicalKey)
    }

    // Check for proxy
    // This is a simplified check — actual proxy detection is done by the factory
    const { LocalStorageAdapter } = require("universal-picgo-store") as any
    return new LocalStorageAdapter(logicalKey)
  } catch {
    // Pure browser fallback
    const { LocalStorageAdapter } = require("universal-picgo-store") as any
    return new LocalStorageAdapter(logicalKey)
  }
}

function resolveNodeOwnerPath(
  ownerFile: string,
  logicalKey: string,
  options: UnifiedPicGoConfigFacadeOptions
): string {
  const pathApi = getNodePathApi()
  const workspaceDir = options.paths?.workspaceDir
  if (ownerFile === "picgo.cfg.json") {
    return options.paths?.configPath
      ?? (pathApi && workspaceDir ? pathApi.join(workspaceDir, "data", "storage", "syp", "picgo", "picgo.cfg.json") : logicalKey)
  }
  if (ownerFile === "external-picgo-cfg.json") {
    return options.paths?.externalConfigPath
      ?? (pathApi && workspaceDir ? pathApi.join(workspaceDir, "data", "storage", "syp", "picgo", "external-picgo-cfg.json") : logicalKey)
  }
  if (ownerFile === "siyuan-cfg") {
    return options.paths?.siyuanConnectionConfigPath
      ?? (pathApi && workspaceDir ? pathApi.join(workspaceDir, "data", "storage", "syp", "siyuan-cfg.json") : logicalKey)
  }
  return logicalKey
}

function getNodePathApi(): any {
  try {
    if (typeof require !== "undefined") return require("path")
  } catch {
    return null
  }
  return null
}

// ── Facade Factory ───────────────────────────────────────────────────

/**
 * Create and initialize the unified async configuration facade.
 *
 * This async factory:
 *   1. Resolves storage adapters for each unique owner file
 *   2. Reads all owner files
 *   3. Checks/executes v3 migration
 *   4. Merges defaults where data is missing
 *   5. Constructs the ready snapshot
 *   6. Returns the ready facade
 *
 * The returned Promise MUST be awaited before any configuration access.
 * Reading user config before resolve throws ConfigNotReadyError.
 *
 * @param options - Runtime options including SiYuan connection config,
 *   paths, and optional storage adapter factory.
 * @returns A Promise resolving to the ready facade.
 */
export async function createUnifiedPicGoConfigFacade(
  options: UnifiedPicGoConfigFacadeOptions
): Promise<ReadyUnifiedPicGoConfigFacade> {
  const logger = options.getLogger?.("unified-config-facade")
    ?? { info: (...args: any[]) => {}, error: (...args: any[]) => {}, warn: (...args: any[]) => {}, debug: (...args: any[]) => {} }

  // Build internal state
  const state: FacadeInternalState = {
    instanceKey: "",
    storageMode: "sync",
    ownerFiles: new Map(),
    migrationState: { ...INITIAL_MIGRATION_STATE },
    writeVersion: 0,
    ready: false,
    debounceTimers: new Map(),
  }

  // Resolve adapters for each unique owner file
  const ownerFileNames = Array.from(new Set(Object.values(OWNER_FILE_MAP)))
  for (const ownerFileName of ownerFileNames) {
    const domains = ALL_CONFIG_DOMAINS.filter((d) => OWNER_FILE_MAP[d] === ownerFileName)
    const logicalKey = getLogicalKeyForOwnerFile(ownerFileName, options)
    const adapter = resolveOwnerAdapter(ownerFileName, logicalKey, options)

    state.ownerFiles.set(ownerFileName, {
      logicalKey,
      adapter,
      data: {},
      dirty: false,
      dirtyVersion: 0,
      flushedVersion: 0,
      writeQueue: Promise.resolve(),
      currentWriteVersion: 0,
      domains,
    })
  }

  state.instanceKey = createFacadeInstanceKey(options, state.ownerFiles)
  logger.info("[UnifiedConfigFacade] initializing, instanceKey:", state.instanceKey)

  // Load all owner files
  await loadAllOwnerFiles(state, logger)

  // Check migration state
  await ensureMigration(state, options, logger)

  // Merge defaults for missing data
  mergeDefaults(state)

  // Construct snapshot and mark ready
  state.ready = true

  logger.info("[UnifiedConfigFacade] ready")

  return buildReadyFacade(state, logger, options)
}

// ── Owner File Loading ───────────────────────────────────────────────

async function loadAllOwnerFiles(
  state: FacadeInternalState,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void }
): Promise<void> {
  for (const [ownerFile, fileState] of state.ownerFiles) {
    if (isAsyncAdapter(fileState.adapter)) {
      state.storageMode = "async"
    }
    try {
      const adapter = fileState.adapter
      if ("read" in adapter && typeof adapter.read === "function") {
        const data = await (adapter as any).read()
        fileState.data = data ?? {}
        logger.debug(`[UnifiedConfigFacade] loaded ${ownerFile}, keys:`, Object.keys(fileState.data))
      } else {
        // Sync adapter — read synchronously
        const store = (adapter as any)
        if (typeof store.read === "function") {
          fileState.data = store.read() ?? {}
        }
      }
    } catch (e: any) {
      const storageKind = getAdapterStorageKind(fileState.adapter)
      if (isAsyncAdapter(fileState.adapter)) {
        // Async owner-file failures are authoritative.  Do NOT call read()
        // again to inspect the return type, do NOT seed generated defaults,
        // and do NOT continue migration against an empty object.
        state.storageMode = "async"
        logger.error(`[UnifiedConfigFacade] failed to load ${ownerFile}:`, e?.message ?? e)
        throw new ConfigReadError({
          domain: fileState.domains[0],
          ownerFile,
          storageKind,
          error: e,
        })
      }
      // On sync/local backends an empty file or parse error can still be
      // treated as missing and initialized by defaults.
      logger.warn(`[UnifiedConfigFacade] sync load failed for ${ownerFile}, treating as missing:`, e?.message ?? e)
      fileState.data = {}
    }
  }
}

// ── Migration ────────────────────────────────────────────────────────

async function ensureMigration(
  state: FacadeInternalState,
  options: UnifiedPicGoConfigFacadeOptions,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void }
): Promise<void> {
  // Read existing migration marker from picgo.cfg.json owner file
  const mainOwner = state.ownerFiles.get("picgo.cfg.json")
  if (mainOwner) {
    const existingMigration = mainOwner.data?.siyuan?.picgoMigration
    if (existingMigration?.version === UNIFIED_CONFIG_MIGRATION_VERSION) {
      state.migrationState = existingMigration as UnifiedConfigMigrationState
      logger.info("[UnifiedConfigFacade] existing v3 migration state found, status:", state.migrationState.status)
      return
    }
  }

  // No existing v3 migration — run it
  logger.info("[UnifiedConfigFacade] running v3 migration...")
  state.migrationState = {
    ...INITIAL_MIGRATION_STATE,
    status: "running",
    updatedAt: Date.now(),
    attempts: 0, // Service will increment within runV3MigrationInternal
  }

  try {
    await runV3MigrationInternal(state, options, logger)
    state.migrationState.updatedAt = Date.now()
    if (state.migrationState.status === "failed") {
      logger.error("[UnifiedConfigFacade] migration failed:", state.migrationState.error)
    } else {
      state.migrationState.status = "done"
      logger.info("[UnifiedConfigFacade] migration complete")
    }
  } catch (e: any) {
    state.migrationState.status = "failed"
    state.migrationState.error = e?.message ?? String(e)
    state.migrationState.updatedAt = Date.now()
    logger.error("[UnifiedConfigFacade] migration failed:", state.migrationState.error)
  }

  // Persist migration marker
  if (mainOwner) {
    mainOwner.data = mainOwner.data ?? {}
    mainOwner.data.siyuan = mainOwner.data.siyuan ?? {}
    mainOwner.data.siyuan.picgoMigration = state.migrationState
    markOwnerDirty(state, mainOwner)
  }
}

async function runV3MigrationInternal(
  state: FacadeInternalState,
  options: UnifiedPicGoConfigFacadeOptions,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void }
): Promise<void> {
  await runMigrationWithService(state, options, logger, runMigrationService)
}

async function retryV3MigrationInternal(
  state: FacadeInternalState,
  options: UnifiedPicGoConfigFacadeOptions,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void },
  domains?: ConfigDomain[]
): Promise<void> {
  await runMigrationWithService(state, options, logger, (migrationOptions) => retryMigrationService(migrationOptions, domains))
}

async function runMigrationWithService(
  state: FacadeInternalState,
  options: UnifiedPicGoConfigFacadeOptions,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void },
  service: (options: Parameters<typeof runMigrationService>[0]) => Promise<UnifiedConfigMigrationState>
): Promise<void> {
  // Build owner file data map from current facade state
  const ownerFileData = new Map<string, Record<string, any>>()
  for (const [name, fileState] of state.ownerFiles) {
    ownerFileData.set(name, { ...(fileState.data ?? {}) })
  }

  const migrationResult = await service({
    ownerFileData,
    existingState: state.migrationState,
    hasNodeEnv: typeof process !== "undefined" && typeof require !== "undefined",
    workspaceDir: options.paths?.workspaceDir,
    homeDir: options.paths?.homeDir ?? options.paths?.baseDir ?? options.paths?.runtimeDir,
    logger: { info: logger.info, warn: logger.warn, error: logger.error },
  })

  // Apply migration results back to owner file data
  state.migrationState = migrationResult
  for (const [name, data] of ownerFileData) {
    const fileState = state.ownerFiles.get(name)
    if (fileState) {
      const before = JSON.stringify(fileState.data ?? {})
      const after = JSON.stringify(data ?? {})
      fileState.data = data
      if (before !== after) {
        markOwnerDirty(state, fileState)
      }
    }
  }
}

// ── Default Merging ──────────────────────────────────────────────────

function mergeDefaults(state: FacadeInternalState): void {
  // Only merge defaults into missing or empty owner files.
  // This follows the ready-before-default rule:
  // 1. Load real data first
  // 2. Only then check if defaults are needed
  // 3. Never overwrite real user data with defaults
  //
  // IMPORTANT: ensureMigration() writes siyuan.picgoMigration into the
  // picgoMain owner before mergeDefaults runs. We must ignore migration
  // metadata when deciding whether to merge defaults.

  const picgoMain = state.ownerFiles.get("picgo.cfg.json")
  if (picgoMain) {
    const hasUserConfig = picgoMain.data?.picBed !== undefined
    const hasPlugins = picgoMain.data?.picgoPlugins !== undefined
    if (!hasUserConfig && !hasPlugins) {
      picgoMain.data = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: {
          waitTimeout: 2,
          retryTimes: 5,
          autoUpload: true,
          replaceLink: true,
          txtImageSwitch: false,
          // Preserve migration metadata if present
          ...(picgoMain.data?.siyuan?.picgoMigration ? { picgoMigration: picgoMain.data.siyuan.picgoMigration } : {}),
        },
      }
      markOwnerDirty(state, picgoMain)
    }
  }

  const external = state.ownerFiles.get("external-picgo-cfg.json")
  if (external && (!external.data || Object.keys(external.data).length === 0)) {
    external.data = {
      useBundledPicgo: true,
      picgoType: "bundled",
      extPicgoApiUrl: "http://127.0.0.1:36677",
      picListApiUrl: "",
      picListApiKey: "",
    }
    markOwnerDirty(state, external)
  } else if (external) {
    const defaults = {
      useBundledPicgo: true,
      picgoType: "bundled",
      extPicgoApiUrl: "http://127.0.0.1:36677",
      picListApiUrl: "",
      picListApiKey: "",
    }
    for (const [key, value] of Object.entries(defaults)) {
      if (typeof external.data[key] === "undefined") {
        external.data[key] = value
        markOwnerDirty(state, external)
      }
    }
    // Older generated defaults used an invalid enum display value. Normalize
    // it after the real owner file has loaded so upload dispatch can compare
    // against PicgoTypeEnum.Bundled without falling back to another source.
    if (external.data.picgoType === "Bundled") {
      external.data.picgoType = "bundled"
      markOwnerDirty(state, external)
    }
  }

  const siyuanConn = state.ownerFiles.get("siyuan-cfg")
  if (siyuanConn && (!siyuanConn.data || Object.keys(siyuanConn.data).length === 0)) {
    siyuanConn.data = {
      apiUrl: "http://127.0.0.1:6806",
      password: "",
    }
    markOwnerDirty(state, siyuanConn)
  }
}

// ── Logical Key Resolution ───────────────────────────────────────────

function getLogicalKeyForOwnerFile(
  ownerFileName: string,
  options: UnifiedPicGoConfigFacadeOptions
): string {
  const configPath = options.paths?.configPath
  if (ownerFileName === "picgo.cfg.json") {
    return configPath ?? MAIN_CONFIG_LOGICAL_KEY
  }
  if (ownerFileName === "external-picgo-cfg.json") {
    return options.paths?.externalConfigPath ?? EXTERNAL_CONFIG_LOGICAL_KEY
  }
  if (ownerFileName === "siyuan-cfg") {
    return options.paths?.siyuanConnectionConfigPath ?? SIYUAN_CONNECTION_LOGICAL_KEY
  }
  return `universal-picgo/${ownerFileName}`
}

function createFacadeInstanceKey(
  options: UnifiedPicGoConfigFacadeOptions,
  ownerFiles: Map<string, OwnerFileState>
): string {
  const ownerIdentity: Record<string, unknown> = {}
  for (const [ownerFile, fileState] of ownerFiles) {
    ownerIdentity[ownerFile] = {
      logicalKey: fileState.logicalKey,
      storageKind: getAdapterStorageKind(fileState.adapter),
      mode: isAsyncAdapter(fileState.adapter) ? "async" : "sync",
      domains: fileState.domains,
    }
  }

  return JSON.stringify({
    apiUrl: options.siyuanConfig?.apiUrl ?? "unknown",
    storage: {
      factory: options.storageAdapterFactory ? "custom" : "runtime",
      owners: ownerIdentity,
    },
    workspace: {
      workspaceDir: options.paths?.workspaceDir ?? "",
      homeDir: options.paths?.homeDir ?? "",
    },
    paths: {
      configPath: options.paths?.configPath ?? "",
      externalConfigPath: options.paths?.externalConfigPath ?? "",
      siyuanConnectionConfigPath: options.paths?.siyuanConnectionConfigPath ?? "",
      baseDir: options.paths?.baseDir ?? "",
      runtimeDir: options.paths?.runtimeDir ?? "",
      pluginBaseDir: options.paths?.pluginBaseDir ?? "",
      zhiNpmPath: options.paths?.zhiNpmPath ?? "",
    },
  })
}

// ── Ready Facade Construction ────────────────────────────────────────

function buildReadyFacade(
  state: FacadeInternalState,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void },
  options: UnifiedPicGoConfigFacadeOptions
): ReadyUnifiedPicGoConfigFacade {
  return {
    storageMode: state.storageMode,
    instanceKey: state.instanceKey,

    getSnapshot(): UnifiedConfigSnapshot {
      return buildSnapshot(state)
    },

    async getPicGoConfig(): Promise<IConfig> {
      const owner = state.ownerFiles.get("picgo.cfg.json")
      return deepClone(owner?.data ?? {}) as IConfig
    },

    async getExternalPicGoConfig(): Promise<IExternalPicgoConfig> {
      const owner = state.ownerFiles.get("external-picgo-cfg.json")
      return deepClone(owner?.data ?? {}) as IExternalPicgoConfig
    },

    async getSiyuanConnectionConfig(): Promise<SiyuanConfigLike> {
      const owner = state.ownerFiles.get("siyuan-cfg")
      return deepClone(owner?.data ?? {}) as SiyuanConfigLike
    },

    async getPasteTakeoverSnapshot(): Promise<PasteTakeoverSnapshot> {
      const snapshot = buildSnapshot(state)
      return snapshot.pasteTakeover
    },

    async updatePicGoConfig(mutator: (draft: IConfig) => void): Promise<void> {
      const owner = state.ownerFiles.get("picgo.cfg.json")
      if (!owner) throw new Error("picgo.cfg.json owner not found")
      mutator(owner.data as IConfig)
      markOwnerDirty(state, owner)
      scheduleFlush(state, "picgo.cfg.json", logger)
    },

    async updateExternalPicGoConfig(mutator: (draft: IExternalPicgoConfig) => void): Promise<void> {
      const owner = state.ownerFiles.get("external-picgo-cfg.json")
      if (!owner) throw new Error("external-picgo-cfg.json owner not found")
      mutator(owner.data as IExternalPicgoConfig)
      markOwnerDirty(state, owner)
      scheduleFlush(state, "external-picgo-cfg.json", logger)
    },

    async updateSiyuanConnectionConfig(mutator: (draft: SiyuanConfigLike) => void): Promise<void> {
      const owner = state.ownerFiles.get("siyuan-cfg")
      if (!owner) throw new Error("siyuan-cfg owner not found")
      mutator(owner.data as SiyuanConfigLike)
      markOwnerDirty(state, owner)
      scheduleFlush(state, "siyuan-cfg", logger)
    },

    async flush(domains?: ConfigDomain[]): Promise<void> {
      const ownersToFlush = resolveOwnersToFlush(state, domains)
      const failures: ConfigFlushFailure[] = []

      for (const [ownerFile, fileState] of ownersToFlush) {
        cancelScheduledFlush(state, ownerFile)
        if (!fileState.dirty && !fileState.currentWriteTask) continue
        try {
          await flushOwnerFile(state, ownerFile, fileState)
          logger.debug(`[UnifiedConfigFacade] flushed ${ownerFile}`)
        } catch (e: any) {
          failures.push({
            domain: fileState.domains[0],
            ownerFile,
            storageKind: getAdapterStorageKind(fileState.adapter),
            error: e?.message ?? String(e),
          })
          logger.error(`[UnifiedConfigFacade] flush failed for ${ownerFile}:`, e?.message ?? e)
        }
      }

      if (failures.length > 0) {
        throw new ConfigFlushError(failures)
      }
    },

    async reload(domains?: ConfigDomain[]): Promise<UnifiedConfigSnapshot> {
      // Flush first to avoid losing local changes
      await buildReadyFacade(state, logger, options).flush(domains)

      // Re-read owner files
      const ownersToReload = resolveOwnersForDomains(state, domains)
      for (const [ownerFile, fileState] of ownersToReload) {
        try {
          const adapter = fileState.adapter
          const newData = await (adapter as any).read()
          if (newData && Object.keys(newData).length > 0) {
            fileState.data = newData
          }
          fileState.dirty = false
          fileState.flushedVersion = fileState.dirtyVersion
        } catch (e: any) {
          logger.error(`[UnifiedConfigFacade] reload failed for ${ownerFile}:`, e?.message ?? e)
          if (isAsyncAdapter(fileState.adapter)) {
            throw new ConfigReadError({
              domain: fileState.domains[0],
              ownerFile,
              storageKind: getAdapterStorageKind(fileState.adapter),
              error: e,
            })
          }
        }
      }

      return buildSnapshot(state)
    },

    async getMigrationState(): Promise<UnifiedConfigMigrationState> {
      return { ...state.migrationState }
    },

    async retryMigration(domains?: ConfigDomain[]): Promise<UnifiedConfigMigrationState> {
      state.migrationState.status = "running"
      try {
        await retryV3MigrationInternal(state, options, logger, domains)
        const retryStatus = state.migrationState.status as UnifiedConfigMigrationState["status"]
        if (retryStatus !== "failed") {
          state.migrationState.status = "done"
        }
      } catch (e: any) {
        state.migrationState.status = "failed"
        state.migrationState.error = e?.message ?? String(e)
      }
      state.migrationState.updatedAt = Date.now()
      persistMigrationMarker(state)
      return { ...state.migrationState }
    },

    maskSnapshot(snapshot: UnifiedConfigSnapshot): UnifiedConfigSnapshot {
      return maskSnapshot(snapshot)
    },
  }
}

function persistMigrationMarker(state: FacadeInternalState): void {
  const mainOwner = state.ownerFiles.get("picgo.cfg.json")
  if (!mainOwner) return
  mainOwner.data = mainOwner.data ?? {}
  mainOwner.data.siyuan = mainOwner.data.siyuan ?? {}
  mainOwner.data.siyuan.picgoMigration = state.migrationState
  markOwnerDirty(state, mainOwner)
}

// ── Snapshot Construction ────────────────────────────────────────────

function buildSnapshot(state: FacadeInternalState): UnifiedConfigSnapshot {
  const picgo = state.ownerFiles.get("picgo.cfg.json")?.data ?? {}
  const externalPicgo = state.ownerFiles.get("external-picgo-cfg.json")?.data ?? {}
  const siyuanConnection = state.ownerFiles.get("siyuan-cfg")?.data ?? {}

  const siyuan = (picgo as any).siyuan ?? {}

  return {
    picgo: picgo as IConfig,
    externalPicgo: externalPicgo as IExternalPicgoConfig,
    siyuanConnection: siyuanConnection as SiyuanConfigLike,
    pasteTakeover: {
      autoUpload: siyuan.autoUpload ?? true,
      allowPicAndText: siyuan.txtImageSwitch ?? false,
      replaceLink: siyuan.replaceLink ?? true,
    },
    migration: state.migrationState,
  }
}

// ── Flush Scheduling ─────────────────────────────────────────────────

const FLUSH_DEBOUNCE_MS = 300

function scheduleFlush(
  state: FacadeInternalState,
  ownerFile: string,
  logger: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void }
): void {
  const existing = state.debounceTimers.get(ownerFile)
  if (existing) {
    clearTimeout(existing)
  }

  const timer = setTimeout(async () => {
    state.debounceTimers.delete(ownerFile)
    const fileState = state.ownerFiles.get(ownerFile)
    if (!fileState || !fileState.dirty) return

    try {
      await flushOwnerFile(state, ownerFile, fileState)
      logger.debug(`[UnifiedConfigFacade] auto-flushed ${ownerFile}`)
    } catch (e: any) {
      logger.error(`[UnifiedConfigFacade] auto-flush failed for ${ownerFile}:`, e?.message ?? e)
    }
  }, FLUSH_DEBOUNCE_MS)

  state.debounceTimers.set(ownerFile, timer)
}

function markOwnerDirty(state: FacadeInternalState, fileState: OwnerFileState): void {
  state.writeVersion++
  fileState.dirty = true
  fileState.dirtyVersion = state.writeVersion
}

function cancelScheduledFlush(state: FacadeInternalState, ownerFile: string): void {
  const timer = state.debounceTimers.get(ownerFile)
  if (!timer) return
  clearTimeout(timer)
  state.debounceTimers.delete(ownerFile)
}

async function flushOwnerFile(
  state: FacadeInternalState,
  ownerFile: string,
  fileState: OwnerFileState
): Promise<void> {
  if (!fileState.dirty) {
    if (fileState.currentWriteTask) {
      await fileState.currentWriteTask
    }
    return
  }

  const targetVersion = fileState.dirtyVersion

  // A scheduled/ongoing write already covers every mutation this flush is
  // responsible for. Join it instead of issuing a duplicate owner-file write.
  if (fileState.currentWriteTask && fileState.currentWriteVersion >= targetVersion) {
    await fileState.currentWriteTask
    return
  }

  // Capture a stable snapshot before entering the async write queue so later
  // in-memory mutations cannot leak into this write or be accidentally marked
  // durable by this task.
  const snapshot = deepClone(fileState.data ?? {})
  const previousTail = fileState.writeQueue.catch(() => undefined)
  const task = previousTail.then(async () => {
    await writeOwnerFile(fileState, snapshot)
  })

  fileState.currentWriteTask = task
  fileState.currentWriteVersion = targetVersion
  // Keep the queue tail non-rejecting so a failed write never breaks future
  // explicit flush retries or later debounced writes.
  fileState.writeQueue = task.catch(() => undefined)

  try {
    await task
    fileState.flushedVersion = Math.max(fileState.flushedVersion, targetVersion)
    if (fileState.dirtyVersion <= targetVersion) {
      fileState.dirty = false
    }
  } catch (e) {
    fileState.dirty = true
    throw e
  } finally {
    if (fileState.currentWriteTask === task) {
      fileState.currentWriteTask = undefined
    }
  }
}

async function writeOwnerFile(fileState: OwnerFileState, data: Record<string, any>): Promise<void> {
  const adapter = fileState.adapter as any
  if (typeof adapter.write === "function") {
    await adapter.write(data)
  } else if (typeof adapter.set === "function") {
    // Sync JSONStore adapter
    for (const [key, value] of Object.entries(data)) {
      await adapter.set(key, value)
    }
    if (typeof adapter.flush === "function") {
      await adapter.flush()
    }
  } else {
    throw new Error(`Adapter for ${fileState.logicalKey} does not support write`)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function resolveOwnersToFlush(
  state: FacadeInternalState,
  domains?: ConfigDomain[]
): Map<string, OwnerFileState> {
  const owners = new Map<string, OwnerFileState>()

  if (!domains || domains.length === 0) {
    // Flush all dirty owners and join in-flight owner writes started by
    // debounce auto-flush. This makes await flush() a drain barrier for this
    // facade instance, not just a best-effort dirty check.
    for (const [name, fileState] of state.ownerFiles) {
      if (fileState.dirty || fileState.currentWriteTask) {
        owners.set(name, fileState)
      }
    }
    return owners
  }

  // Flush only owners mapped to specified domains
  for (const domain of domains) {
    const ownerFile = OWNER_FILE_MAP[domain]
    const fileState = state.ownerFiles.get(ownerFile)
    if (fileState && (fileState.dirty || fileState.currentWriteTask)) {
      owners.set(ownerFile, fileState)
    }
  }
  return owners
}

function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return { ...obj } as T
  }
}

function resolveOwnersForDomains(
  state: FacadeInternalState,
  domains?: ConfigDomain[]
): Map<string, OwnerFileState> {
  const owners = new Map<string, OwnerFileState>()

  if (!domains || domains.length === 0) {
    for (const [name, fileState] of state.ownerFiles) {
      owners.set(name, fileState)
    }
    return owners
  }

  for (const domain of domains) {
    const ownerFile = OWNER_FILE_MAP[domain]
    const fileState = state.ownerFiles.get(ownerFile)
    if (fileState) {
      owners.set(ownerFile, fileState)
    }
  }
  return owners
}

function isAsyncAdapter(adapter: StorageAdapter): boolean {
  return (adapter as any)?.mode === "async"
}

function getAdapterStorageKind(adapter: StorageAdapter): string {
  return (adapter as any)?.storageKind
    ?? (adapter as any)?.kind
    ?? (adapter as any)?.constructor?.name
    ?? (isAsyncAdapter(adapter) ? "async" : "sync")
}
