/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IConfig, IPicGo } from "../../types"
import { IJSON, JSONStore } from "universal-picgo-store"

class ConfigDb {
  private readonly ctx: IPicGo
  private readonly db: JSONStore

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    this.db = new JSONStore(this.ctx.configPath)

    this.safeSet("picBed", {
      uploader: "smms",
      current: "smms",
    })
    this.safeSet("picgoPlugins", {})
  }

  read(flush?: boolean): IJSON {
    return this.db.read(flush)
  }

  get(key: ""): any {
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

  saveConfig(config: Partial<IConfig>): void {
    Object.keys(config).forEach((name: string) => {
      this.set(name, config[name])
    })
  }

  removeConfig(config: IConfig): void {
    Object.keys(config).forEach((name: string) => {
      this.unset(name, config[name])
    })
  }

  // ===================================================================================================================
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

export default ConfigDb
