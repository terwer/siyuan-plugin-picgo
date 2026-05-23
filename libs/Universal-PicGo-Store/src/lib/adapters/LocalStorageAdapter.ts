import { IJSON } from "../../types"

export class LocalStorageAdapter {
  private readonly key: string

  constructor(dbPath: string) {
    this.key = dbPath
  }

  read(): IJSON {
    const data = window.localStorage.getItem(this.key)
    /* istanbul ignore if */
    if (data === null) {
      return {}
    }
    try {
      return JSON.parse(data) as IJSON
    } catch {
      return {}
    }
  }

  write(obj: any): void {
    window.localStorage.setItem(this.key, JSON.stringify(obj))
  }
}
