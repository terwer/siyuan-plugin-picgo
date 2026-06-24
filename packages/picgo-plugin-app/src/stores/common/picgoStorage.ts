/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { StorageLike } from "@vueuse/core"
import type { IPicgoDb } from "zhi-siyuan-picgo"
import { JsonUtil } from "zhi-common"
import { toRaw } from "vue"

interface PicgoStorageHooks {
  afterWrite?: () => void | Promise<void>
  onWriteError?: (error: unknown) => void
}

class PicgoStorage<T> implements StorageLike {
  private readonly db: IPicgoDb<T>
  private readonly hooks: PicgoStorageHooks

  constructor(picgoDb: IPicgoDb<T>, hooks: PicgoStorageHooks = {}) {
    this.db = picgoDb
    this.hooks = hooks
  }

  getItem(_key: string): string | null {
    const value = this.db.read()
    return JSON.stringify(value)
  }
  setItem(_key: string, value: string): void {
    try {
      const valueObj = JsonUtil.safeParse<T>(toRaw(value), this.db.initialValue)
      this.db.saveConfig(valueObj)
      const afterWriteResult = this.hooks.afterWrite?.()
      if (afterWriteResult instanceof Promise) {
        afterWriteResult.catch((e) => this.hooks.onWriteError?.(e))
      }
    } catch (e) {
      this.hooks.onWriteError?.(e)
      throw e
    }
  }
  removeItem(key: string): void {
    this.db.removeConfig(key, this.db.initialValue)
  }
}

export { PicgoStorage, type PicgoStorageHooks }
