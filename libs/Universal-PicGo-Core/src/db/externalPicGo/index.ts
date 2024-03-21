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
import { PicgoTypeEnum } from "../../utils/enums"

class ExternalPicgoConfigDb {
  private readonly ctx: IPicGo
  private readonly db: JSONStore

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    let packagePath: string

    if (hasNodeEnv) {
      const path = win.require("path")
      packagePath = path.join(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    } else {
      packagePath = browserPathJoin(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    }

    this.db = new JSONStore(packagePath)

    // const cfg: IExternalPicgoConfig = {
    //   useBundledPicgo: true,
    //   picgoType: PicgoTypeEnum.Bundled,
    //   extPicgoApiUrl: "http://127.0.0.1:36677",
    // }
    this.safeSet("useBundledPicgo", true)
    this.safeSet("picgoType", PicgoTypeEnum.Bundled)
    this.safeSet("extPicgoApiUrl", "http://127.0.0.1:36677")
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

export default ExternalPicgoConfigDb
