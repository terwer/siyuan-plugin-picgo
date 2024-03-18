/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IBrowserLocal, IPicGo } from "../types"
import { IJSON, JSONStore } from "universal-picgo-store"
import _ from "lodash-es"
import { browserPathJoin } from "../utils/browserUtils"

class BrowserI18nDb {
  private readonly ctx: IPicGo
  private readonly db: JSONStore
  private readonly hasRead!: boolean
  private readonly i18nKey = "i18n"

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    const browserI18nForder = browserPathJoin(this.ctx.baseDir, "picgo-i18n-cli")
    this.db = new JSONStore(browserI18nForder)

    if (!this.db.has(this.i18nKey)) {
      try {
        this.db.set(this.i18nKey, [])
      } catch (e: any) {
        this.ctx.log.error(e)
        throw e
      }
    }
  }

  read(flush?: boolean): IBrowserLocal[] {
    const i18n = this.db.read(flush)
    return _.get(i18n, this.i18nKey)
  }

  unset(): boolean {
    this.read(true)
    return this.db.unset(this.i18nKey, [])
  }

  get(key: ""): any {
    throw new Error("get is not supported by BrowserI18nDb")
  }

  set(key: string, value: any): void {
    throw new Error("set is not supported by BrowserI18nDb")
  }

  has(key: string): boolean {
    throw new Error("has is not supported by BrowserI18nDb")
  }
}

export default BrowserI18nDb
