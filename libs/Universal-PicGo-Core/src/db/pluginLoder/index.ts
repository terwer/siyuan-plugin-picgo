/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicgoDb } from "../../types"
import { hasNodeEnv, IJSON, JSONStore, win } from "universal-picgo-store"
import { browserPathJoin } from "../../utils/browserUtils"

class PluginLoaderDb implements IPicgoDb<any> {
  private readonly ctx: IPicGo
  private readonly db: JSONStore
  public readonly key: string
  public readonly initialValue = {
    name: "picgo-plugins",
    description: "picgo-plugins",
    repository: "https://github.com/terwer/siyuan-plugin-picgo/tree/main/libs/Universal-PicGo-Core",
    license: "MIT",
  }

  constructor(ctx: IPicGo) {
    this.ctx = ctx

    if (hasNodeEnv) {
      const path = win.require("path")
      this.key = path.join(this.ctx.pluginBaseDir, "package.json")
    } else {
      this.key = browserPathJoin(this.ctx.pluginBaseDir, "package.json")
    }

    this.db = new JSONStore(this.key)

    // 初始化
    this.saveConfig(this.initialValue)
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

  saveConfig(config: Partial<any>): void {
    Object.keys(config).forEach((name: string) => {
      this.set(name, config[name])
    })
  }

  removeConfig(config: any): void {
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

export default PluginLoaderDb
