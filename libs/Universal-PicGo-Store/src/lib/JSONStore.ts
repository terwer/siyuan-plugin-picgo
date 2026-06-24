import { IAsyncStorageAdapter, IJSON, ISyncStorageAdapter, StorageAdapter } from "../types"

interface SyncAdapter<T> {
  read(): T
  write(data: T): void
}

class JSONStore {
  private data: IJSON = {}
  private hasRead = false

  private syncAdapter?: ISyncStorageAdapter
  private asyncAdapter?: IAsyncStorageAdapter
  private readyPromise: Promise<void>

  private writeVersion = 0
  private pendingTimer: ReturnType<typeof setTimeout> | null = null
  private writePromise: Promise<void> = Promise.resolve()
  private dirty = false
  lastWriteError: Error | null = null

  private readonly debounceMs = 300

  constructor(dbPath: string, adapter: StorageAdapter) {
    if (!dbPath) {
      throw Error("Please provide valid dbPath")
    }
    if (!adapter) {
      throw Error("Storage adapter is required. Use JSONAdapter, LocalStorageAdapter, or SiYuanKernelStorageAdapter.")
    }

    if ((adapter as IAsyncStorageAdapter).mode === "async") {
      this.asyncAdapter = adapter as IAsyncStorageAdapter
      this.readyPromise = this.loadFromRemote()
    } else {
      this.syncAdapter = adapter as ISyncStorageAdapter
      this.data = this.syncAdapter.read() || {}
      this.hasRead = true
      this.readyPromise = Promise.resolve()
    }
  }

  get isAsync(): boolean {
    return !!this.asyncAdapter
  }

  /** 等待首次远端加载完成（异步适配器专用） */
  async waitReady(): Promise<void> {
    await this.readyPromise
  }

  /** 重新从远端拉取。先 flush 本地 pending write，防止旧远端覆盖本地新配置。 */
  async refreshAsync(): Promise<void> {
    if (!this.asyncAdapter) return
    await this.flush()

    const snapshotVersion = this.writeVersion
    const remoteData = await this.asyncAdapter.read()

    // 刷新期间发生本地写入 → 远端数据过期，不覆盖内存
    if (this.writeVersion !== snapshotVersion) {
      return
    }

    this.data = remoteData || {}
    this.hasRead = true
  }

  /** 等待所有待写入完成，如有错误抛出 */
  async flush(): Promise<void> {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer)
      this.pendingTimer = null
      if (this.dirty) {
        this.dirty = false
        this.writePromise = this.writePromise.then(() => this.doWrite())
      }
    }
    await this.writePromise
    if (this.lastWriteError) {
      const err = this.lastWriteError
      this.lastWriteError = null
      throw err
    }
  }

  // ── 公开 API（全部同步，与旧版兼容） ──

  read(flush = false): IJSON {
    if (flush || !this.hasRead) {
      this.hasRead = true
      if (this.syncAdapter) {
        this.data = this.syncAdapter.read() || {}
      }
      // 异步适配器不在 read() 中读远端——已在构造时 loadFromRemote
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
    this.writeVersion++
    this.scheduleWrite()
  }

  has(key: string): boolean {
    return hasByPath(this.data, key)
  }

  unset(key: string, value: any): boolean {
    const target = key ? getByPath(this.data, key) : this.data
    const removed = unsetByPath(target, value)
    this.scheduleWrite()
    return removed
  }

  // ── 内部 ──

  private async loadFromRemote(): Promise<void> {
    this.data = await this.asyncAdapter!.read()
    this.hasRead = true
  }

  private scheduleWrite(): void {
    if (this.syncAdapter) {
      this.syncAdapter.write(this.data)
      return
    }

    // 异步：真正防抖——每次 set 重置定时器
    this.dirty = true
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer)
    }
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null
      if (this.dirty) {
        this.dirty = false
        this.writePromise = this.writePromise
          .then(() => this.doWrite())
          .catch(() => { /* 错误已记录到 lastWriteError */ })
      }
    }, this.debounceMs)
  }

  private async doWrite(): Promise<void> {
    // 快照：防止 this.data 被后续修改影响
    const snapshot = JSON.parse(JSON.stringify(this.data))
    try {
      await this.asyncAdapter!.write(snapshot)
      this.lastWriteError = null
    } catch (e: any) {
      this.lastWriteError = e
    }
  }
}

// ── 工具函数（从旧版 JSONStore 保留） ──

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
