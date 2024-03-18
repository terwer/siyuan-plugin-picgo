import { LowSync } from "@commonify/lowdb"
import { JSONAdapter } from "./adapters/JSONAdapter"
import _ from "lodash"
import { IJSON } from "../types"
import { hasNodeEnv } from "./utils"
import { LocalStorageAdapter } from "./adapters/LocalStorageAdapter"

class LowWithLodash<T> extends LowSync<T> {
  chain: _.ExpChain<this["data"]> = _.chain(this).get("data")
}

class JSONStore {
  private readonly db: LowWithLodash<IJSON>
  private hasRead = false

  constructor(dbPath: string) {
    if (!dbPath) {
      throw Error("Please provide valid dbPath")
    }
    let adapter
    if (hasNodeEnv) {
      adapter = new JSONAdapter(dbPath)
    } else {
      adapter = new LocalStorageAdapter(dbPath)
    }
    this.db = new LowWithLodash(adapter)
    this.read()
  }

  read(flush = false): IJSON {
    /* istanbul ignore else */
    if (flush || !this.hasRead) {
      this.hasRead = true
      this.db.read()
    }
    return this.db.data as IJSON
  }

  get(key = ""): any {
    return this.db.chain.get(key).value()
  }

  set(key: string, value: any): void {
    this.db.chain.set(key, value).value()
    this.db.write()
  }

  has(key: string): boolean {
    return this.db.chain.has(key).value()
  }

  unset(key: string, value: any): boolean {
    const res = this.db.chain.get(key).unset(value).value()
    this.db.write()
    return res
  }
}

export { JSONStore }
