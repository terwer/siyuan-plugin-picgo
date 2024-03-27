/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { StorageLike } from "@vueuse/core"
import { IPicgoDb } from "zhi-siyuan-picgo"
import { JsonUtil } from "zhi-common"
import { toRaw } from "vue"

class PicgoStorage<T> implements StorageLike {
  private readonly db: IPicgoDb<T>

  constructor(picgoDb: IPicgoDb<T>) {
    this.db = picgoDb
  }

  getItem(_key: string): string | null {
    const value = this.db.read()
    return JSON.stringify(value)
  }
  setItem(_key: string, value: string): void {
    const valueObj = JsonUtil.safeParse<T>(toRaw(value), this.db.initialValue)
    this.db.saveConfig(valueObj)
  }
  removeItem(key: string): void {
    this.db.removeConfig(key, this.db.initialValue)
  }
}

export { PicgoStorage }
