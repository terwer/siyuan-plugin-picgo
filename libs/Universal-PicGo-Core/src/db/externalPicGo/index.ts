/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IExternalPicgoConfig, IPicGo, IPicgoDb } from "../../types"
import { hasNodeEnv, IJSON, JSONStore, JSONAdapter, LocalStorageAdapter, win } from "universal-picgo-store"
import { browserPathJoin } from "../../utils/browserUtils"
import { PicgoTypeEnum } from "../../utils/enums"

class ExternalPicgoConfigDb implements IPicgoDb<IExternalPicgoConfig> {
  private readonly ctx: IPicGo
  private readonly db: JSONStore
  public readonly key: string
  public readonly initialValue = {
    useBundledPicgo: true,
    picgoType: PicgoTypeEnum.Bundled,
    extPicgoApiUrl: "http://127.0.0.1:36677",
    picListApiUrl: "",
    picListApiKey: "",
  }
  private initReady = false
  constructor(ctx: IPicGo) {
    this.ctx = ctx

    if (hasNodeEnv) {
      const path = win.require("path")
      this.key = path.join(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    } else {
      this.key = browserPathJoin(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    }

    const adapter = ctx.storageAdapterFactory?.(this.key)
      ?? (hasNodeEnv ? new JSONAdapter(this.key) : new LocalStorageAdapter(this.key))
    this.db = new JSONStore(this.key, adapter)

    if (this.db.isAsync) {
      // PicGo 3.0: async/Kernel-backed stores must not schedule
      // constructor-time writes. Defaults are only merged in-memory by read()
      // for display and are persisted after waitReady() proves the owner file
      // is actually missing those keys.
    } else {
      this.doSafeSet()
      this.initReady = true
    }
  }

  read(flush?: boolean): IJSON {
    const stored = this.db.read(flush)
    // PicGo 3.0: Merge initialValue defaults on top of stored data.
    // Ensures UI always sees sensible defaults even when JSONStore.loadFromRemote()
    // temporarily wipes this.data before ensureReady() re-applies safeSet.
    return { ...this.initialValue, ...(stored ?? {}) }
  }

  get(key: string): any {
    this.read(true)
    return this.db.get(key)
  }

  set(key: string, value: any): void {
    this.read(true)
    return this.db.set(key, value)
  }

  has(key: string): boolean {
    this.read(true)
    return this.db.has(key)
  }

  unset(key: string, value: any): boolean {
    this.read(true)
    return this.db.unset(key, value)
  }

  saveConfig(config: Partial<IExternalPicgoConfig>): void {
    Object.keys(config).forEach((name: string) => {
      this.set(name, config[name])
    })
  }

  removeConfig(config: IExternalPicgoConfig): void {
    Object.keys(config).forEach((name: string) => {
      this.unset(name, config[name])
    })
  }

  get isAsync(): boolean { return (this.db as any).isAsync }

  /**
   * Wait for async backend to load remote data.
   *
   * PicGo 3.0: Local defaults are seeded immediately in the constructor
   * for UI display. When ensureReady() resolves:
   *   - If remote data exists, it replaces the local defaults.
   *   - If remote data is missing, local defaults are kept and persisted.
   *
   * This prevents the v2 bug where constructor-time safeSet would
   * overwrite real remote user configuration with generated defaults.
   */
  async ensureReady(): Promise<void> {
    if (this.initReady) return
    await this.db.waitReady()

    // After remote data is loaded, re-apply safeSet.
    // On async backends: the remote data has now been loaded into the
    // JSONStore. safeSet's has(key) check will now see the REAL remote
    // data. If a key exists remotely, the local default is NOT applied
    // (it's overridden by the remote value). If a key is missing
    // remotely, the local default is kept.
    //
    // Track whether any defaults were actually written (file was missing
    // keys on remote). Only flush if changes were made to avoid
    // unnecessary write failures on read-only or already-complete files.
    const before = JSON.stringify(this.db.read())
    this.doSafeSet()
    const after = JSON.stringify(this.db.read())
    const changed = before !== after

    this.initReady = true

    if (this.isAsync && changed) {
      await this.db.flush()
    }
  }

  async flush(): Promise<void> { await (this.db as any).flush?.() }

  // ===================================================================================================================
  private doSafeSet() {
    this.safeSet("useBundledPicgo", this.initialValue.useBundledPicgo)
    this.safeSet("picgoType", this.initialValue.picgoType)
    this.safeSet("extPicgoApiUrl", this.initialValue.extPicgoApiUrl)
    this.safeSet("picListApiUrl", this.initialValue.picListApiUrl)
    this.safeSet("picListApiKey", this.initialValue.picListApiKey)
  }

  safeSet(key: string, value: any) {
    if (!this.db.has(key)) {
      try {
        this.db.set(key, value)
      } catch (e: any) {
        this.ctx.log.error(e)
        throw e
      }
    }
  }
}

export default ExternalPicgoConfigDb
