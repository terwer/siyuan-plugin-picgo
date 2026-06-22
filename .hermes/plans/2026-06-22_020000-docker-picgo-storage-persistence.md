# Docker 环境下 PicGo 配置持久化方案

> GitHub issue: `terwer/siyuan-plugin-picgo#460`

## 目标

Docker/Web 部署思源笔记时，PicGo 图床配置持久化到 `data/storage/syp/picgo/picgo.cfg.json`，实现多设备 Web 共享。

## 架构

```
入口 (bootstrap / publisher / 设置页)
  │  resolveStorageAdapterFactory() 判定环境，创建适配器工厂
  │
  ├─→ SiyuanPicGo.getInstance(config, options)
  │     └─→ SiyuanPicgoPostApi → SiyuanPicGoUploadApi
  │           └─→ UniversalPicGo({ ...paths, storageAdapterFactory })
  │                 └─→ ConfigDb(ctx)              → JSONStore(key, factory(key))
  │                 └─→ ExternalPicgoConfigDb      → JSONStore(key, factory(key))
  │                 └─→ PluginLoaderDb             → JSONStore(key, factory(key))
```

**三种部署模式：**

| 模式 | 判定 | 适配器 | 存储 |
|-----|------|--------|------|
| 桌面 | `hasNodeEnv`（bootstrap）/ `fs.existsSync(workspaceDir)`（publisher） | `JSONAdapter` | 本地 fs |
| Docker / SiYuan Web | kernel API 可用 | `SiYuanKernelStorageAdapter` | `data/storage/syp/picgo/` |
| 纯浏览器 | 以上皆否 | `LocalStorageAdapter` | `localStorage` |

**异步模型：** 「同步内存缓存 + 异步持久化」。上层 API（`get/set/saveConfig/reloadConfig`）保持同步，`JSONStore` 内部对异步适配器做内存缓存 + 防抖写入。异步边界通过 `waitReady()` / `flush()` / `reloadConfigAsync()` 收口。

---

## 1. 接口层

### 1.1 JSONStore

```typescript
// libs/Universal-PicGo-Store/src/lib/JSONStore.ts

export interface IAsyncStorageAdapter {
  readonly mode: "async"
  read(): Promise<IJSON>
  write(data: IJSON): Promise<void>
}

export interface ISyncStorageAdapter {
  read(): IJSON
  write(data: IJSON): void
}

export type StorageAdapter = ISyncStorageAdapter | IAsyncStorageAdapter

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
    if (!dbPath) throw Error("Please provide valid dbPath")
    if (!adapter) throw Error("Storage adapter is required")

    if (adapter.mode === "async") {
      this.asyncAdapter = adapter
      this.readyPromise = this.loadFromRemote()
    } else {
      this.syncAdapter = adapter as ISyncStorageAdapter
      this.data = this.syncAdapter.read() || {}
      this.hasRead = true
      this.readyPromise = Promise.resolve()
    }
  }

  get isAsync(): boolean { return !!this.asyncAdapter }

  async waitReady(): Promise<void> { await this.readyPromise }

  async refreshAsync(): Promise<void> {
    if (!this.asyncAdapter) return
    await this.flush()
    const snapshotVersion = this.writeVersion
    const remoteData = await this.asyncAdapter.read()
    if (this.writeVersion !== snapshotVersion) {
      this.logger.warn("refreshAsync skipped: local writes during remote read")
      return
    }
    this.data = remoteData || {}
    this.hasRead = true
  }

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
      const err = this.lastWriteError; this.lastWriteError = null; throw err
    }
  }

  // ── 同步 API ──

  read(flush = false): IJSON {
    if (flush || !this.hasRead) {
      this.hasRead = true
      if (this.syncAdapter) this.data = this.syncAdapter.read() || {}
    }
    return this.data
  }

  get(key = ""): any { return key ? getByPath(this.data, key) : this.data }

  set(key: string, value: any): void {
    setByPath(this.data, key, value)
    this.writeVersion++
    this.scheduleWrite()
  }

  has(key: string): boolean { return hasByPath(this.data, key) }

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
    if (this.syncAdapter) { this.syncAdapter.write(this.data); return }
    this.dirty = true
    if (this.pendingTimer) clearTimeout(this.pendingTimer)
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null
      if (this.dirty) {
        this.dirty = false
        this.writePromise = this.writePromise
          .then(() => this.doWrite())
          .catch(() => {})
      }
    }, this.debounceMs)
  }

  private async doWrite(): Promise<void> {
    const snapshot = JSON.parse(JSON.stringify(this.data))
    try { await this.asyncAdapter!.write(snapshot); this.lastWriteError = null }
    catch (e: any) { this.lastWriteError = e }
  }
}
```

### 1.2 导出

```typescript
// libs/Universal-PicGo-Store/src/index.ts
export { JSONStore } from "./lib/JSONStore"
export { JSONAdapter } from "./lib/adapters/JSONAdapter"
export { LocalStorageAdapter } from "./lib/adapters/LocalStorageAdapter"
export type { ISyncStorageAdapter, IAsyncStorageAdapter, StorageAdapter } from "./types"
```

---

## 2. SiYuanKernelStorageAdapter

```typescript
// libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.ts

interface KernelFileResult {
  status: "exists" | "missing" | "unavailable"
  text?: string
  reason?: string
}

export class SiYuanKernelStorageAdapter implements IAsyncStorageAdapter {
  readonly mode = "async" as const

  constructor(
    private readonly api: SiyuanKernelApi,
    private readonly serverPath: string,
    private readonly localStorageKey: string,
    private readonly logger: ILogger
  ) {}

  async read(): Promise<IJSON> {
    const exists = await this.api.isFileExists(this.serverPath, "text")
    const remoteText = exists ? await this.api.getFile(this.serverPath, "text") : null

    if (exists && typeof remoteText === "string" && remoteText.trim() !== "") {
      return JSON.parse(remoteText) as IJSON
    }

    const migrated = await this.tryMigrateLocalStorage()
    if (migrated) return migrated
    return {}
  }

  async write(data: IJSON): Promise<void> {
    const result = await this.api.saveTextData(this.serverPath, JSON.stringify(data, null, 2))
    if (result.code !== 0) {
      throw new Error(result.msg || "save picgo config failed")
    }
  }

  private async tryMigrateLocalStorage(): Promise<IJSON | null> {
    if (typeof window === "undefined" || !window.localStorage) return null
    const raw = window.localStorage.getItem(this.localStorageKey)
    if (!raw) return null
    try { JSON.parse(raw) } catch { return null }
    await this.write(JSON.parse(raw))
    return JSON.parse(raw)
  }
}
```

`isFileExists(path, "text")` / `getFile(path, "text")` / `saveTextData(path, text)` 来自当前 `zhi-siyuan-api@2.21.0` 的真实 d.ts。业务层不直接调用底层 HTTP endpoint。

---

## 3. IPicGo 公开 API

```typescript
// libs/Universal-PicGo-Core/src/types/index.d.ts

export interface IPicGo {
  // ... 现有字段

  readonly storageMode: "sync" | "async"
  reloadConfig(): IConfig
  reloadConfigAsync(): Promise<IConfig>
  flushConfig(): Promise<void>
}
```

```typescript
// libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts

class UniversalPicGo implements IPicGo {
  get storageMode(): "sync" | "async" { return this.db.isAsync ? "async" : "sync" }

  reloadConfig(): IConfig {
    this._config = this.db.read(true) as IConfig
    return this._config
  }

  async reloadConfigAsync(): Promise<IConfig> {
    if (this.storageMode === "async") await this.db.refreshAsync()
    return this.reloadConfig()
  }

  async flushConfig(): Promise<void> { await this.db.flush() }
}
```

### 初始化

```typescript
class UniversalPicGo {
  private readyPromise: Promise<void>

  constructor(options: IUniversalPicGoOptions) {
    this.storageAdapterFactory = options.storageAdapterFactory
    this.db = new ConfigDb(this)
    this.readyPromise = this.db.ensureReady()
  }

  async init(): Promise<void> {
    await this.readyPromise
    this._config = this.db.read(true) as IConfig
    this.i18n = new I18nManager(this)
    this._pluginLoader = new PluginLoader(this)
    this.lifecycle = new Lifecycle(this)
  }
}
```

### IUniversalPicGoOptions

```typescript
export interface IUniversalPicGoOptions {
  configPath?: string
  baseDir?: string
  pluginBaseDir?: string
  zhiNpmPath?: string
  isDev?: boolean
  storageAdapterFactory: (dbPath: string) => StorageAdapter
}
```

### ConfigDb

```typescript
class ConfigDb {
  private initReady = false

  async ensureReady(): Promise<void> {
    if (this.initReady) return
    await this.db.waitReady()
    this.safeSet("picBed", this.initialValue.picBed)
    this.safeSet("picgoPlugins", this.initialValue.picgoPlugins)
    this.safeSet("siyuan.waitTimeout", this.initialValue.siyuan.waitTimeout)
    this.safeSet("siyuan.retryTimes", this.initialValue.siyuan.retryTimes)
    this.safeSet("siyuan.autoUpload", this.initialValue.siyuan.autoUpload)
    this.safeSet("siyuan.replaceLink", this.initialValue.siyuan.replaceLink)
    this.safeSet("siyuan.txtImageSwitch", this.initialValue.siyuan.txtImageSwitch)
    this.initReady = true

    if (this.db.isAsync) {
      await this.db.flush()  // 失败直接 throw
    }
  }
}
```

---

## 4. 入口判定与工厂创建

### SiyuanPicGoInstanceOptions

```typescript
interface SiyuanPicGoInstanceOptions {
  isDev?: boolean
  paths?: SiyuanPicGoPathOverrides
  storageAdapterFactory?: StorageAdapterFactory
}
```

### 统一入口

```typescript
// libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts

class SiyuanPicGo {
  static async getInstance(
    siyuanConfig: SiyuanConfigLike,
    options?: boolean | SiyuanPicGoInstanceOptions
  ): Promise<SiyuanPicgoPostApi> {
    const normalizedOptions: SiyuanPicGoInstanceOptions =
      typeof options === "boolean" ? { isDev: options } : options ?? {}
    const isDev = normalizedOptions.isDev
    const paths = resolveSiyuanPicGoPaths(normalizedOptions.paths)

    const factory = normalizedOptions.storageAdapterFactory
      ?? resolveStorageAdapterFactory(siyuanConfig, this.logger)

    const instanceKey = JSON.stringify({
      apiUrl: siyuanConfig.apiUrl,
      configPath: paths.configPath,
      baseDir: paths.baseDir,
      pluginBaseDir: paths.pluginBaseDir,
      zhiNpmPath: paths.zhiNpmPath,
      storageKind: factory.kind,
    })

    if (this.instanceKey !== instanceKey) {
      this.picgoInstance = null
      this.instanceKey = null
    }

    if (!this.picgoInstance) {
      this.picgoInstance = new SiyuanPicgoPostApi(siyuanConfig, isDev, paths, factory)
      this.instanceKey = instanceKey
    }

    await this.picgoInstance.init()
    return this.picgoInstance
  }
}

function resolveStorageAdapterFactory(
  config: SiyuanConfigLike, logger?: ILogger
): { kind: "node-json" | "siyuan-kernel" | "local-storage"; factory: StorageAdapterFactory } {
  if (hasNodeEnv) return { kind: "node-json", factory: (path) => new JSONAdapter(path) }

  const topConfig = getTopSiyuanConfig()
  if (topConfig?.workspaceDir) {
    const kernelApi = new SiyuanKernelApi(config)
    return {
      kind: "siyuan-kernel",
      factory: (dbPath) => dbPath === "universal-picgo/picgo.cfg.json"
        ? new SiYuanKernelStorageAdapter(kernelApi, "data/storage/syp/picgo/picgo.cfg.json", dbPath, logger)
        : new LocalStorageAdapter(dbPath),
    }
  }

  return { kind: "local-storage", factory: (path) => new LocalStorageAdapter(path) }
}

function getTopSiyuanConfig(): { workspaceDir: string } | null {
  try { return (window.top as any)?.siyuan?.config?.system ?? null }
  catch { return null }
}
```

### 显式 Docker factory（bootstrap / publisher 入口）

```typescript
function createStorageAdapterFactory(
  kernelApi: SiyuanKernelApi, logger: ILogger
): (dbPath: string) => StorageAdapter {
  return (dbPath: string) => {
    if (dbPath === "universal-picgo/picgo.cfg.json") {
      return new SiYuanKernelStorageAdapter(
        kernelApi, "data/storage/syp/picgo/picgo.cfg.json",
        "universal-picgo/picgo.cfg.json", logger
      )
    }
    return new LocalStorageAdapter(dbPath)
  }
}
```

---

## 5. 幂等初始化

```typescript
// SiyuanPicgoPostApi
class SiyuanPicgoPostApi {
  private initPromise?: Promise<void>

  async init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.doInit()
    return this.initPromise
  }

  private async doInit(): Promise<void> {
    await this.picgoApi.init()
    await this.ensureConfigInitialized()
  }
}

// SiyuanPicGoUploadApi
class SiyuanPicGoUploadApi {
  private initPromise?: Promise<void>

  async init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.doInit()
    return this.initPromise
  }

  private async doInit(): Promise<void> {
    await this.picgo.init()
    this.externalPicGo = new ExternalPicgo(this.picgo)
    this.picListUploader = new PicListUploader(this.picgo)

    if (this.picgo.storageMode === "async") {
      this.externalPicGo.db.set("useBundledPicgo", true)
      this.externalPicGo.db.set("picgoType", PicgoTypeEnum.Bundled)
    }
  }
}
```

---

## 6. 设置页 flush

设置页通过 `v-model` + `useStorage` 自动写入，flush 绑定到 `useCommonPicgoStorage()`。

```typescript
// packages/picgo-plugin-app/src/stores/common/useCommonPicgoStorage.ts

function useCommonPicgoStorage<T>(
  picgoDb: IPicgoDb<T>,
  options: UseStorageOptions<T> & {
    afterWrite?: () => Promise<void>
    onAfterWriteError?: (e: Error) => void
  } = {}
) {
  // ... 现有逻辑 ...

  if (options.afterWrite) {
    let timer: ReturnType<typeof setTimeout>
    watch(storage, () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        try { await options.afterWrite!() }
        catch (e: any) { options.onAfterWriteError?.(e) }
      }, 500)
    }, { deep: true, flush: "post" })
  }
}
```

**调用：**

```typescript
// useBundledPicGoSetting() / useExternalPicGoSetting()
const ctx = picgoPostApi.ctx()
const storage = useCommonPicgoStorage(picgoDb, {
  serializer: StorageSerializers.object,
  afterWrite: ctx.storageMode === "async" ? () => ctx.flushConfig() : undefined,
  onAfterWriteError: (e) => ElMessage.error("图床配置保存失败：" + e.message),
})
```

---

## 7. 传递链路

```
SiyuanPicGo.getInstance(options.storageAdapterFactory)
  → SiyuanPicgoPostApi(config, isDev, paths, storageAdapterFactory)
    → SiyuanPicGoUploadApi(isDev, paths, storageAdapterFactory)
      → UniversalPicGo({ ...paths, storageAdapterFactory })
        → ConfigDb(ctx)           → JSONStore(key, factory(key))
        → ExternalPicgoConfigDb   → JSONStore(key, factory(key))
        → PluginLoaderDb          → JSONStore(key, factory(key))
```

仅 `picgo.cfg.json` 走 kernel API（`data/storage/syp/picgo/picgo.cfg.json`），`external-picgo-cfg.json` / `package.json` / i18n 走 localStorage。Docker Web 强制 bundled PicGo。

---

## 8. 迁移策略

`SiYuanKernelStorageAdapter.read()` 内嵌迁移逻辑：

| kernel 文件 | localStorage | 行为 |
|------------|-------------|------|
| 已存在 | — | 以 kernel 为准，不迁移 |
| 不存在 | 有数据 | localStorage → kernel 一次性迁移 |
| 不存在 | 无数据 | 返回 `{}`，`safeSet` 写默认配置 |

kernel API 不可用时抛错，不静默回退 localStorage。纯浏览器场景才允许 `LocalStorageAdapter`。

---

## 9. 实施步骤

### 阶段 1：universal-picgo-store

| # | 操作 |
|---|------|
| 1.1 | 定义 `IAsyncStorageAdapter` 接口（`mode: "async"`） |
| 1.2 | `JSONStore` 双模式：同步直接读写 / 异步内存缓存+防抖+错误追踪 |
| 1.3 | `waitReady()` / `refreshAsync()` / `flush()` / `lastWriteError` |
| 1.4 | `unset()` 保留 key 语义 |
| 1.5 | 移除 `hasNodeEnv`，adapter 必传 |
| 1.6 | 导出 `JSONAdapter` / `LocalStorageAdapter` / 类型 |
| 1.7 | 测试 + 构建 |

### 阶段 2：universal-picgo

| # | 操作 |
|---|------|
| 2.1 | `IPicGo` 新增 `storageMode` / `reloadConfigAsync()` / `flushConfig()` |
| 2.2 | `IUniversalPicGoOptions.storageAdapterFactory` 必传 |
| 2.3 | `UniversalPicGo.init()` → `ensureReady()` → `_config` → i18n/plugins |
| 2.4 | `reloadConfigAsync()` 实现 |
| 2.5 | `ConfigDb.ensureReady()` + flush 默认配置 |
| 2.6 | `ExternalPicgoConfigDb` / `PluginLoaderDb` 适配 |
| 2.7 | `HeadlessManager` 透传 + await init |
| 2.8 | 测试 + 构建 |

### 阶段 3：zhi-siyuan-picgo

| # | 操作 |
|---|------|
| 3.1 | 新建 `SiYuanKernelStorageAdapter`（read 内嵌迁移） |
| 3.2 | `SiyuanPicGoInstanceOptions` 新增 `storageAdapterFactory` |
| 3.3 | `resolveStorageAdapterFactory()` 环境判定 + factory 创建 |
| 3.4 | `SiyuanPicGo.getInstance()` 归一化参数 → 判定 → 单例 → await init |
| 3.5 | `SiyuanPicgoPostApi.init()` 幂等 |
| 3.6 | `SiyuanPicGoUploadApi.init()` 幂等 + 强制 bundled（async 模式） |
| 3.7 | 导出 adapter |
| 3.8 | 测试 + 构建 |

### 阶段 4：bootstrap + 设置页 + publisher

| # | 操作 |
|---|------|
| 4.1 | bootstrap 显式传入 factory（可选）；未传则走 `resolveStorageAdapterFactory` |
| 4.2 | `await api.init()` 后暴露 UI |
| 4.3 | 上传链路调用 `reloadConfigAsync()` |
| 4.4 | 设置页 `useCommonPicgoStorage()` 集成 `afterWrite` + `onAfterWriteError` |
| 4.5 | publisher 按相同模式 |
| 4.6 | 全量构建 + 验收 |

---

## 10. 验收标准

| # | 用例 | 预期 |
|---|------|------|
| 1 | Docker Web 初始化 | kernel API adapter，`await init()` 后配置就绪 |
| 2 | 设备 A 保存图床配置 | `data/storage/syp/picgo/picgo.cfg.json` 写入 |
| 3 | 清空设备 B localStorage，打开设置页 | 读到设备 A 配置 |
| 4 | 设备 A 改配置后，设备 B 上传 | `reloadConfigAsync()` 拉最新 |
| 5 | PC 端 | 读写 `[workspace]/data/storage/syp/picgo/picgo.cfg.json` 不变 |
| 6 | 纯浏览器无 kernel API | `LocalStorageAdapter` |
| 7 | Docker Web kernel API 不可用 | 报错，不静默回退 |
| 8 | Docker 老用户：localStorage 有旧配置 + kernel 不存在 | read() 内嵌迁移，safeSet 不覆盖 |
| 9 | kernel 已存在 + localStorage 旧配置 | kernel 为准，不迁移 |
| 10 | Docker Web 上传 | 强制 bundled PicGo |
| 11 | 连续 set 后 | 防抖写入 |
| 12 | 写入失败后 flush | `lastWriteError` 抛出，设置页提示用户 |
| 13 | 多入口并发 init | 幂等 |
| 14 | 首次 Docker 初始化 | 默认配置 flush 落盘 |
| 15 | kernel API 鉴权失败 / 网络失败 | 初始化报错，不写 localStorage、不写默认配置 |
| 16 | `refreshAsync()` 期间本地 `set()` | 本地写入不被远端旧数据覆盖 |
