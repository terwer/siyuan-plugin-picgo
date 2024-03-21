/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IExternalPicgoConfig, IPicGo, IPicgoDb } from "../../types"
import { hasNodeEnv, IJSON, JSONStore, win } from "universal-picgo-store"
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
  }

  constructor(ctx: IPicGo) {
    this.ctx = ctx

    if (hasNodeEnv) {
      const path = win.require("path")
      this.key = path.join(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    } else {
      this.key = browserPathJoin(this.ctx.pluginBaseDir, "external-picgo-cfg.json")
    }

    this.db = new JSONStore(this.key)

    this.safeSet("useBundledPicgo", this.initialValue.useBundledPicgo)
    this.safeSet("picgoType", this.initialValue.picgoType)
    this.safeSet("extPicgoApiUrl", this.initialValue.extPicgoApiUrl)
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
