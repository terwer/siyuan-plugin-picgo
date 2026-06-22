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

    // sync adapter: safeSet immediately. async: defer to ensureReady() after remote load.
    // This fixes the "overwrite real remote data with generated defaults" bug
    // identified in Decision 5 of the picgo-3-unified-async-config-source design.
    if (!this.db.isAsync) {
      this.doSafeSet()
      this.initReady = true
    }
  }

  read(flush?: boolean): IJSON {
    return this.db.read(flush)
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
   * Wait for async backend to load remote data, then merge defaults.
   *
   * In v2, the constructor would immediately call safeSet() which wrote
   * defaults before remote data loaded — this would overwrite real user
   * configuration on async (Kernel-backed) backends.
   *
   * In v3, safeSet is deferred until after ensureReady() guarantees the
   * remote data is loaded. Defaults are only written if the key is
   * genuinely absent — never overwriting real user values.
   */
  async ensureReady(): Promise<void> {
    if (this.initReady) return
    await this.db.waitReady()
    this.doSafeSet()
    this.initReady = true
    if (this.isAsync) await this.db.flush()
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
