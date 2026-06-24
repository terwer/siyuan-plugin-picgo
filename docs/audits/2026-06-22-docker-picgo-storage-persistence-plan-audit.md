# Docker PicGo 配置持久化方案最终审计

- 审计日期：2026-06-22
- 审计对象：`.hermes/plans/2026-06-22_020000-docker-picgo-storage-persistence.md`
- 需求来源：GitHub issue `terwer/siyuan-plugin-picgo#460`
- 核心需求：Docker/Web 部署思源时，PicGo 图床配置不能只保存在浏览器 `localStorage`，必须持久化到 workspace 的 `data/storage/syp/picgo/picgo.cfg.json`，实现多设备 Web 共享。

## 最终结论

**审计通过，建议进入实现。**

当前方案已经覆盖 issue #460 的核心需求：

- Docker/Web 环境下主配置通过思源 Kernel API 持久化到 workspace。
- 设置页 iframe 与上传入口均能进入同一持久化链路。
- 旧 `localStorage` 配置具备迁移路径。
- Kernel API 不可用或写入失败时不会静默成功。
- 刷新远端配置前会先 flush 本地 pending write，并具备并发写入保护。

## 必须保持的实现约束

### 1. Kernel API 是唯一业务 API 来源

业务层只允许通过 `SiyuanKernelApi` 封装访问思源 Kernel：

```ts
const kernelApi = new SiyuanKernelApi(config)
```

`SiYuanKernelStorageAdapter` 应只依赖 `SiyuanKernelApi` 真实 d.ts 中存在的方法。当前 `zhi-siyuan-api@2.21.0` 暴露的文件相关方法包括：

```ts
isFileExists(path: string, type: "text" | "json"): Promise<boolean>
getFile(path: string, type: "text" | "json"): Promise<any>
saveTextData(path: string, text: string): Promise<SiyuanData>
```

推荐读写语义：

```ts
const exists = await this.api.isFileExists(this.serverPath, "text")
if (!exists) return { status: "missing" }
const text = await this.api.getFile(this.serverPath, "text")

const result = await this.api.saveTextData(this.serverPath, JSON.stringify(data, null, 2))
if (result.code !== 0) throw new Error(result.msg || "save picgo config failed")
```

底层 HTTP endpoint 仍由 `SiyuanKernelApi` 封装，业务层不直接 fetch。

### 2. 只将 PicGo 主配置落到 Kernel 文件

Docker/Web 下仅主配置走 Kernel storage：

```text
universal-picgo/picgo.cfg.json
  -> data/storage/syp/picgo/picgo.cfg.json
```

其他运行时/辅助配置仍保持本地存储：

- `external-picgo-cfg.json`
- `package.json`
- i18n
- 插件运行时文件
- 本地缓存文件

### 3. iframe 设置页必须独立判定 runtime

设置页运行在独立 iframe JS realm，不能依赖 bootstrap 父窗口里的 static singleton。

每个 runtime 都必须独立执行 storage factory 判定：

- Electron/Node：走本地 JSON 文件。
- Docker/Web + `window.top.siyuan` 可用：走 Kernel storage。
- 纯浏览器或不可访问 `window.top.siyuan`：回退 localStorage。

访问 `window.top.siyuan` 必须使用 try/catch，避免跨域异常破坏 fallback。

### 4. `getInstance()` 参数需要先归一化

为了兼容旧调用：

```ts
options?: boolean | SiyuanPicGoInstanceOptions
```

必须先归一化，再访问 `storageAdapterFactory`：

```ts
const normalizedOptions: SiyuanPicGoInstanceOptions =
  typeof options === "boolean" ? { isDev: options } : options ?? {}

const isDev = normalizedOptions.isDev
const paths = resolveSiyuanPicGoPaths(normalizedOptions.paths)

const resolved = normalizedOptions.storageAdapterFactory
  ? { kind: "custom" as const, factory: normalizedOptions.storageAdapterFactory }
  : resolveStorageAdapterFactory(siyuanConfig, this.logger)
```

`instanceKey` 必须至少包含：

```ts
apiUrl: siyuanConfig.apiUrl,
configPath: paths.configPath,
baseDir: paths.baseDir,
pluginBaseDir: paths.pluginBaseDir,
zhiNpmPath: paths.zhiNpmPath,
storageKind: resolved.kind,
```

### 5. 公开 API 返回值需要保持一致

`IPicGo` 应暴露：

```ts
readonly storageMode: "sync" | "async"
reloadConfig(): IConfig
reloadConfigAsync(): Promise<IConfig>
flushConfig(): Promise<void>
```

`reloadConfigAsync()` 在 async/kernel 模式下应先刷新远端配置，再返回最新 `IConfig`。

### 6. 写入失败必须显式暴露

首次默认配置初始化时，async/kernel 模式必须执行：

```ts
await this.db.flush()
```

失败应阻止初始化完成，不允许记录日志后继续成功。

设置页自动保存链路中，`flushConfig()` 失败必须通过 `onAfterWriteError` 提示用户。

### 7. 设置页保存链路应绑定 VueUse `useStorage`

设置页没有统一保存按钮，实际链路是 `v-model` + `useStorage` 自动写入。

因此 flush 应绑定到 `useCommonPicgoStorage()` 的 watcher：

```ts
watch(storage, () => {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      await options.afterWrite!()
    } catch (e: any) {
      options.onAfterWriteError?.(e)
    }
  }, 500)
}, { deep: true, flush: "post" })
```

调用侧应类似：

```ts
useCommonPicgoStorage(picgoDb, {
  serializer: StorageSerializers.object,
  afterWrite: ctx.storageMode === "async" ? () => ctx.flushConfig() : undefined,
  onAfterWriteError: (e) => {
    ElMessage.error("图床配置保存失败：" + e.message)
  },
})
```

### 8. `refreshAsync()` 必须保护本地 pending write

刷新远端配置前必须先 flush 本地待写入：

```ts
await this.flush()
```

随后读取远端数据到临时变量，并用 `writeVersion` 防止并发覆盖：

```ts
const snapshotVersion = this.writeVersion
const remoteData = await this.asyncAdapter.read()

if (this.writeVersion !== snapshotVersion) {
  this.logger.warn("refreshAsync skipped: local writes during remote read")
  return
}

this.data = remoteData || {}
this.hasRead = true
```

## 建议实施方式

建议不要直接一把梭实现。更稳妥的路径是：

1. 将当前计划转成 OpenSpec change。
2. 用 OpenSpec 固化需求、设计、任务与验收场景。
3. 再按阶段实现。

推荐阶段：

1. `universal-picgo-store`：异步 storage adapter、flush、refresh、并发保护。
2. `Universal-PicGo-Core`：公开 API、配置初始化、默认配置 flush。
3. `zhi-siyuan-picgo`：Kernel adapter、runtime factory、instanceKey、幂等 init。
4. bootstrap / 设置页 / 上传链路：接入 `reloadConfigAsync()`、`flushConfig()` 与错误提示。

## 验收清单

实现完成后至少验证：

- Docker/Web 初始化后使用 Kernel adapter。
- 设备 A 保存图床配置后，`data/storage/syp/picgo/picgo.cfg.json` 被写入。
- 设备 B 清空 localStorage 后打开设置页，可以读取设备 A 的配置。
- 设备 A 改配置后，设备 B 上传前通过 `reloadConfigAsync()` 拉取最新配置。
- Kernel API 鉴权失败、网络失败或写入失败时，初始化/保存明确报错，不提示成功。
- Docker 老用户本地有旧 `localStorage` 且 Kernel 文件不存在时，会迁移旧配置。
- Kernel 文件已存在时，以 Kernel 文件为准，不被旧 localStorage 覆盖。
- 设置页连续修改嵌套字段后，debounce flush 能最终落盘。
- `refreshAsync()` 远端读取期间发生本地 `set()` 时，本地写入不会被远端旧数据覆盖。
- Electron/PC 端原有本地文件存储行为不回退。
- 纯浏览器无 Kernel API 时仍可 fallback 到 localStorage。

## 最终建议

**可以进入实现。**

当前计划的架构方向、API 边界、持久化路径、迁移策略、错误处理和并发刷新策略均满足 issue #460 的核心诉求。后续重点是通过 OpenSpec 把这些约束转成可执行任务和验收用例，避免实现阶段遗漏跨层细节。
