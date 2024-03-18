import { IJSON } from "../../types"
import { LocalKey, LocalStorage } from "ts-localstorage"

export class LocalStorageAdapter {
  private readonly adapter: typeof LocalStorage
  private readonly key: LocalKey<any>

  constructor(dbPath: string) {
    this.adapter = LocalStorage
    this.key = new LocalKey(dbPath, {})
  }

  read(): IJSON {
    const data = this.adapter.getItem(this.key)
    /* istanbul ignore if */
    if (data === null) {
      return {}
    }
    return data
  }

  write(obj: any): void {
    this.adapter.setItem(this.key, obj)
  }
}
