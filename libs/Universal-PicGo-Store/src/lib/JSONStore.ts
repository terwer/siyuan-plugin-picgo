import { JSONAdapter } from "./adapters/JSONAdapter"
import { IJSON } from "../types"
import { hasNodeEnv } from "./utils"
import { LocalStorageAdapter } from "./adapters/LocalStorageAdapter"

interface SyncAdapter<T> {
  read(): T
  write(data: T): void
}

class JSONStore {
  private data: IJSON = {}
  private hasRead = false
  private readonly adapter: SyncAdapter<IJSON>

  constructor(dbPath: string) {
    if (!dbPath) {
      throw Error("Please provide valid dbPath")
    }
    this.adapter = hasNodeEnv ? new JSONAdapter(dbPath) : new LocalStorageAdapter(dbPath)
    this.read()
  }

  read(flush = false): IJSON {
    /* istanbul ignore else */
    if (flush || !this.hasRead) {
      this.hasRead = true
      this.data = this.adapter.read() || {}
    }
    return this.data
  }

  get(key = ""): any {
    if (!key) {
      return this.data
    }
    return getByPath(this.data, key)
  }

  set(key: string, value: any): void {
    setByPath(this.data, key, value)
    this.adapter.write(this.data)
  }

  has(key: string): boolean {
    return hasByPath(this.data, key)
  }

  unset(key: string, value: any): boolean {
    const target = key ? getByPath(this.data, key) : this.data
    const removed = unsetByPath(target, value)
    this.adapter.write(this.data)
    return removed
  }
}

function splitPath(path: string): string[] {
  return path
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean)
}

function getByPath(obj: any, path: string): any {
  const parts = splitPath(path)
  let current = obj
  for (const part of parts) {
    if (current == null) {
      return undefined
    }
    current = current[part]
  }
  return current
}

function setByPath(obj: any, path: string, value: any): void {
  const parts = splitPath(path)
  if (parts.length === 0) {
    return
  }

  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}

function hasByPath(obj: any, path: string): boolean {
  const parts = splitPath(path)
  let current = obj
  for (const part of parts) {
    if (current == null || !Object.prototype.hasOwnProperty.call(current, part)) {
      return false
    }
    current = current[part]
  }
  return true
}

function unsetByPath(obj: any, path: string): boolean {
  const parts = splitPath(path)
  if (parts.length === 0 || obj == null) {
    return false
  }

  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    current = current?.[parts[i]]
    if (current == null) {
      return false
    }
  }
  const last = parts[parts.length - 1]
  if (!Object.prototype.hasOwnProperty.call(current, last)) {
    return false
  }
  delete current[last]
  return true
}

export { JSONStore }
