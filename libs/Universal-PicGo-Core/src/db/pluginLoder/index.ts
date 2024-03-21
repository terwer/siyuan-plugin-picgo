/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IConfig, IPicGo } from "../../types"
import { hasNodeEnv, IJSON, JSONStore, win } from "universal-picgo-store"
import { browserPathJoin } from "../../utils/browserUtils"

class PluginLoaderDb {
  private readonly ctx: IPicGo
  private readonly db: JSONStore

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    let packagePath: string

    if (hasNodeEnv) {
      const path = win.require("path")
      packagePath = path.join(this.ctx.pluginBaseDir, "package.json")
    } else {
      packagePath = browserPathJoin(this.ctx.pluginBaseDir, "package.json")
    }

    this.db = new JSONStore(packagePath)

    // const pkg = {
    //    name: "picgo-plugins",
    //    description: "picgo-plugins",
    //    repository: "https://github.com/PicGo/PicGo-Core",
    //    license: "MIT",
    // }
    this.safeSet("name", "picgo-plugins")
    this.safeSet("description", "picgo-plugins")
    this.safeSet("repository", "https://github.com/terwer/siyuan-plugin-picgo/tree/main/libs/Universal-PicGo-Core")
    this.safeSet("license", "MIT")
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

export default PluginLoaderDb
