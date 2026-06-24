## Context

当前配置链路存在多个活跃来源：PicGo 主配置、external/PicList 配置、浏览器 `localStorage`、`useSiyuanSetting` 的 `siyuan-cfg`、paste/bootstrap 直接读取、migration marker、uploader token cache、PC-local runtime 文件。`docker-picgo-storage-persistence` 已经完成 PicGo 2.x 的局部修复：Docker/Web 只把 PicGo 主配置映射到 workspace。PicGo 3.0 必须 supersede 该局部方案，否则 external/PicList、SiYuan connection、paste、Lsky token 和 plugin values 仍会在多设备 Web 场景读取到不同来源。

PicGo 3.0 的实现方向是：保留现有 owner file 和文件名，建立统一 async 配置访问层。统一的是 ready、读取、更新、flush、reload、migration、mask 和错误处理；物理配置仍按功能 owner file 维护。

## Goals / Non-Goals

**Goals:**
- 明确 PicGo 3.0 supersedes `docker-picgo-storage-persistence` 的 v2 “只同步主配置”边界。
- 沿用现有配置文件名和按功能拆分的 owner file。
- 建立覆盖所有 PicGo/plugin 用户配置的统一 async configuration facade。
- 统一 Kernel/Web/PC 的读取、保存、flush、reload、migration、mask 和失败处理策略。
- 以 PicGo 3.0 breaking change 方式完成配置 API async 化。
- 将旧源数据迁移到对应 owner file，记录 v3 marker、per-domain importedSources、失败和重试状态。
- external/PicList 全量统一：local external PicGo App URL、remote PicList URL/API key 和 route selection 都进入 `external-picgo-cfg.json`。
- SiYuan connection config 全量统一：`apiUrl`、`password`、`cookie` 等进入 `siyuan-cfg` owner file；敏感字段输出时必须 mask。
- 区分“可同步配置值”和“PC-only runtime artifact”；只有第三方 PicGo plugin runtime artifacts 本机化。
- 让设置 UI、headless API、upload dispatch、paste/bootstrap、uploader、plugin shell 使用同一 ready barrier。

**Non-Goals:**
- 兼容旧方法名或旧同步调用方式。
- 让 Web/Docker 执行 PC-only 第三方 PicGo plugin runtime。
- 同步 npm 包、`node_modules`、插件安装 artifact、日志、clipboard 临时文件或构建产物。
- 在本 change 内引入加密存储；本 change 只要求敏感字段 mask 和统一 owner file。

## 与 `docker-picgo-storage-persistence` 的关系

`docker-picgo-storage-persistence` 是已完成的 PicGo 2.x 兼容 change，其约束“Docker/Web 只有主配置进入 Kernel storage，external/PicList 仍本地”只在 v2 范围内成立。`picgo-3-unified-async-config-source` 是 3.0 superseding change：

```text
PicGo 2.x docker-picgo-storage-persistence
  └─ 范围：只覆盖 main config
  └─ 状态：已完成的 compatibility baseline
  └─ v3 用途：migration source 与 regression reference

PicGo 3.0 unified async config source
  └─ 范围：所有 user configuration domains
  └─ 关系：supersedes v2 main-config-only boundary
  └─ 本机化边界：只保留 PC plugin runtime artifacts local
```

因此 3.0 文档和任务不得再要求“必须兼容 v2 只同步主配置”的产品边界；需要兼容的是既有 v2 数据迁移和 2.x 行为回归，而不是保留其同步范围。

## 完整配置域映射

| domain | owner file | logical key | PC/Electron local path | Docker/Web Kernel path | pure browser fallback key | default value | sensitive fields | migration source | metadata owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PicGo main upload config | `picgo.cfg.json` | `universal-picgo/picgo.cfg.json` | SiYuan PC：`<workspace>/data/storage/syp/picgo/picgo.cfg.json`；standalone Electron：`<localPicGoDir>/picgo.cfg.json` | `/data/storage/syp/picgo/picgo.cfg.json` | `universal-picgo/picgo.cfg.json` | `picBed.uploader="smms"`、`picBed.current="smms"`、`picgoPlugins={}`、`siyuan.waitTimeout=2`、`siyuan.retryTimes=5`、`siyuan.autoUpload=true`、`siyuan.replaceLink=true`、`siyuan.txtImageSwitch=false` | `picBed.*` 下的 uploader credentials，存在时还包括 `picBed.proxy` | v2 workspace file、legacy home file、legacy browser key | `picgo.cfg.json:siyuan.picgoMigration.domains.picgoMain` |
| PicGo settings | `picgo.cfg.json` | main config 内的 `settings.*` | 同 PicGo main upload config | 同 PicGo main upload config | 同 PicGo main upload config | 用户设置前该对象可缺省 | `settings.npmProxy` 中嵌入的凭证 | legacy `picgo.cfg.json` settings | `picgo.cfg.json:siyuan.picgoMigration.domains.picgoSettings` |
| SiYuan integration behavior | `picgo.cfg.json` | `siyuan.waitTimeout`、`siyuan.retryTimes`、`siyuan.autoUpload`、`siyuan.replaceLink`、`siyuan.txtImageSwitch` | 同 PicGo main upload config | 同 PicGo main upload config | 同 PicGo main upload config | 使用 PicGo main upload config 行列出的默认值 | 无 | legacy `picgo.cfg.json`、paste/bootstrap localStorage 旧读取值 | `picgo.cfg.json:siyuan.picgoMigration.domains.siyuanBehavior` |
| SiYuan connection config | `siyuan-cfg` / `storage/syp/siyuan-cfg.json` | `siyuan-cfg` | SiYuan PC：`<workspace>/data/storage/syp/siyuan-cfg.json`；standalone browser shell：local storage key | `/data/storage/syp/siyuan-cfg.json` | `siyuan-cfg` | `apiUrl="http://127.0.0.1:6806"`、`password=""`、`cookie` 缺省、optional fields 缺省 | `password`、`cookie` | legacy `storage/syp/siyuan-cfg.json`、browser `siyuan-cfg`、当前 runtime 派生的 `apiUrl` | `picgo.cfg.json:siyuan.picgoMigration.domains.siyuanConnection` |
| external PicGo App and PicList route | `external-picgo-cfg.json` | `universal-picgo/external-picgo-cfg.json` | SiYuan PC：`<workspace>/data/storage/syp/picgo/external-picgo-cfg.json`；standalone Electron：`<pluginBaseDir>/external-picgo-cfg.json` | `/data/storage/syp/picgo/external-picgo-cfg.json` | `universal-picgo/external-picgo-cfg.json` | `useBundledPicgo=true`、`picgoType=Bundled`、`extPicgoApiUrl="http://127.0.0.1:36677"`、`picListApiUrl=""`、`picListApiKey=""` | `picListApiKey` | legacy `external-picgo-cfg.json`、legacy browser/pluginBaseDir key | `picgo.cfg.json:siyuan.picgoMigration.domains.externalPicList` |
| plugin enable/config values | `picgo.cfg.json` | `picgoPlugins.*` 与 plugin config paths | 同 PicGo main upload config | 同 PicGo main upload config | 同 PicGo main upload config | `picgoPlugins={}`，plugin config 用户设置前缺省 | schema/type/name 标记为 token、secret、password、key、cookie 的 plugin 字段 | legacy `picgo.cfg.json` plugin sections | `picgo.cfg.json:siyuan.picgoMigration.domains.pluginValues` |
| uploader config and user credentials | `picgo.cfg.json` | `picBed.<uploader>` | 同 PicGo main upload config | 同 PicGo main upload config | 同 PicGo main upload config | uploader config 用户设置前缺省 | token、secret、password、key、accessKey、secretKey、accessKeySecret、secretAccessKey、cookie | legacy `picgo.cfg.json` uploader sections | `picgo.cfg.json:siyuan.picgoMigration.domains.uploaderConfig` |
| Lsky token state | `picgo.cfg.json` | `uploader.lsky.token` | 同 PicGo main upload config | 同 PicGo main upload config | 同 PicGo main upload config | token 生成或迁移前缺省 | `uploader.lsky.token`、`picBed.lsky.password` | legacy `siyuan_picgo_plugin_lsky_token`、legacy `picBed.lsky` | `picgo.cfg.json:siyuan.picgoMigration.domains.lskyState` |
| paste/bootstrap ready snapshot | derived snapshot，无独立文件 | 由 facade 构造的 `pasteTakeoverSnapshot` | 从 PicGo main 与 SiYuan connection owners 预热 | 从 PicGo main 与 SiYuan connection owners 预热 | 从 local facade fallback owners 预热 | 无独立默认值；facade ready 后使用 owner defaults | 继承来源 domain 的敏感字段，snapshot 日志必须 mask | legacy direct localStorage decision reads | `picgo.cfg.json:siyuan.picgoMigration.domains.pasteBootstrap` |
| PC-only PicGo plugin runtime artifacts | 排除在 user config facade 之外 | `pluginBaseDir`、`zhiNpmPath`、package folders、logs、caches | `<localPicGoDir>`、`<pluginBaseDir>`、`<zhiNpmPath>`、logs/cache dirs | 不同步；Web/Docker 不可用或忽略 | 不同步 | 只解析本机路径 | 无；但日志不得输出 secrets | v2 runtime copy flow only，不做 user config migration | excluded |

## Decisions

### Decision 1: 3.0 supersedes v2 局部同步边界

PicGo 3.0 SHALL 将 `docker-picgo-storage-persistence` 视为已完成的 v2 compatibility baseline 和 migration source。3.0 SHALL NOT 保留“只有 PicGo 主配置进入 Kernel storage”的 v2 规则。3.0 规则是：mapping table 中所有 user configuration domains 都进入 unified facade 和各自 owner file；只有 PC-only plugin runtime artifacts 保持本机化。

### Decision 2: external/PicList 全量统一

local external PicGo App 的 `extPicgoApiUrl` 是用户配置值，remote PicList 的 `picListApiUrl` 和 `picListApiKey` 也是用户配置值。三者与 `useBundledPicgo`、`picgoType` 一起归属 `external-picgo-cfg.json`，在 Kernel-backed runtime 下写入 workspace，并在纯浏览器 fallback 下写入同一 logical key。

本设计不把 local external PicGo App 的 URL 当作 PC-only artifact。若该 URL 指向设备本机服务，例如 loopback 地址，跨设备同步后仍按用户配置生效；没有可用本机服务的设备应在 upload dispatch 阶段显式失败，而不是改读旧本地配置。

### Decision 3: SiYuan connection config 统一但输出必须 mask

`apiUrl`、`password`、`cookie` 和 `SiyuanConfigLike` 中其他连接配置归属 `siyuan-cfg` / `storage/syp/siyuan-cfg.json` owner file。`apiUrl` 不是敏感字段；`password`、`cookie` 是敏感字段。

Mask rules:

1. 持久化 owner file 存储真实值，保证现有连接行为可重放。
2. 日志、错误对象、migration report、diagnostic export、host smoke evidence 和 UI 的只读摘要 MUST NOT 输出真实 `password` 或 `cookie`。
3. mask 输出统一使用 `******`，不保留长度、前缀或后缀，避免泄露 token 形态。
4. mask 只用于展示和诊断，MUST NOT 写回 owner file。

### Decision 4: 统一 async facade 的 owner、lifecycle 和 API

统一 facade 是 PicGo 3.0 的唯一用户配置访问边界。共享 contract 应位于可复用 library 层，Siyuan product lifecycle 通过 `SiyuanPicGo.getInstance(...)` 或等价 factory 创建并持有 facade。每个 runtime instanceKey 只允许一个 ready facade；instanceKey 至少包含 `apiUrl`、owner file path、runtime storage kind、workspace identity 和 path overrides。

Facade lifecycle：

```text
createUnifiedPicGoConfigFacade(options)
  -> 为每个 owner file 解析 storage adapters
  -> 读取所有 owner files
  -> 执行或跳过 v3 migration
  -> 在 owner data 加载后补齐缺失 defaults
  -> 构造 ready snapshot
  -> resolve ReadyUnifiedPicGoConfigFacade
```

必需 TypeScript surface：

```ts
type ConfigDomain =
  | "picgoMain"
  | "picgoSettings"
  | "siyuanBehavior"
  | "siyuanConnection"
  | "externalPicList"
  | "pluginValues"
  | "uploaderConfig"
  | "lskyState"
  | "pasteBootstrap"

interface UnifiedConfigSnapshot {
  picgo: IConfig
  externalPicgo: IExternalPicgoConfig
  siyuanConnection: SiyuanConfigLike
  pasteTakeover: {
    autoUpload: boolean
    allowPicAndText: boolean
    replaceLink: boolean
  }
  migration: UnifiedConfigMigrationState
}

interface ReadyUnifiedPicGoConfigFacade {
  readonly storageMode: "sync" | "async"
  readonly instanceKey: string
  getSnapshot(): UnifiedConfigSnapshot
  getPicGoConfig(): Promise<IConfig>
  getExternalPicGoConfig(): Promise<IExternalPicgoConfig>
  getSiyuanConnectionConfig(): Promise<SiyuanConfigLike>
  getPasteTakeoverSnapshot(): Promise<UnifiedConfigSnapshot["pasteTakeover"]>
  updatePicGoConfig(mutator: (draft: IConfig) => void): Promise<void>
  updateExternalPicGoConfig(mutator: (draft: IExternalPicgoConfig) => void): Promise<void>
  updateSiyuanConnectionConfig(mutator: (draft: SiyuanConfigLike) => void): Promise<void>
  flush(domains?: ConfigDomain[]): Promise<void>
  reload(domains?: ConfigDomain[]): Promise<UnifiedConfigSnapshot>
  getMigrationState(): Promise<UnifiedConfigMigrationState>
  retryMigration(domains?: ConfigDomain[]): Promise<UnifiedConfigMigrationState>
  maskSnapshot(snapshot: UnifiedConfigSnapshot): UnifiedConfigSnapshot
}

declare function createUnifiedPicGoConfigFacade(
  options: UnifiedPicGoConfigFacadeOptions
): Promise<ReadyUnifiedPicGoConfigFacade>
```

Settings UI 的 reactive bridge：

facade 返回纯可序列化数据 snapshot，SHALL NOT 依赖 Vue。settings UI 的响应式绑定属于 `picgo-plugin-app` 包，由 `useBundledPicGoSetting`、`useExternalPicGoSetting`、`useSiyuanSetting` 或其 v3 替代 composable 提供。

桥接模式要求如下：

1. 初始化：`await facade.getPicGoConfig()` 或对应 domain getter 读取 ready 的纯数据 snapshot；composable 将其转换为 `reactive(config)` 或等价 `ref` model，并返回给模板 `v-model` 使用。
2. 修改：通过 `watch(..., { deep: true })` 桥接或显式 `save()` action 调用 `await facade.updatePicGoConfig(mutator)` 或对应 domain update API，然后调度 debounce `flush()`。
3. 归属：Vue `ref` / `reactive`、表单编辑 debounce wiring、校验消息和 UI-specific dirty state 归 `picgo-plugin-app` 所有；facade 本身只负责纯数据 snapshot、domain updates、持久化、reload 和错误语义。

Update 并发语义：

1. `updatePicGoConfig`、`updateExternalPicGoConfig`、`updateSiyuanConnectionConfig` 和等价 domain updates SHALL 立即修改 facade 内存 snapshot，并将相关 domain 标记为 dirty；这些方法 SHALL NOT 要求返回前完成物理写入。
2. 连续 update SHALL 通过内部约 300ms debounce 合并成每个受影响 domain 一次 pending owner-file write。
3. `flush(domains?)` SHALL 等待所选 domains 的全部 pending writes 完成。任一写入失败时，`flush` SHALL 抛出包含 domain 和 owner file 信息的 `ConfigFlushError`。
4. `reload(domains?)` SHALL 先调用 `flush(domains?)`，再重新读取所选 remote/local owner files，合并到内存 snapshot，并返回刷新后的 snapshot。
5. 每次成功的内存 update SHALL 递增 `writeVersion`；`reload` 在用远端数据替换内存前 SHALL 比较远端读取前捕获的 version 与当前 version，避免读取期间产生的新本地写入被远端旧数据覆盖。

生产代码 SHALL NOT 暴露可读取用户配置的 half-ready facade。若内部需要 constructor object，则在 async factory resolve 前只能暴露 lifecycle methods。任何在 factory resolve 前发生的 user-config read SHALL 以 `ConfigNotReadyError` 失败，且 MUST NOT 返回 defaults。

### Decision 5: 当前 `ExternalPicgoConfigDb` 不能原样作为 async backend

当前 `ExternalPicgoConfigDb` constructor 会立即创建 `JSONStore` 并执行 `safeSet(...)` defaults。使用 async backend 时，`JSONStore` 在 `safeSet` 调用 `has(...)` 时尚未加载 remote data，missing check 可能看到空内存对象，并在真正的远端 `external-picgo-cfg.json` 加载前调度默认值写入。这会覆盖真实 external/PicList 用户配置。

因此 3.0 MUST NOT 原样使用当前 `ExternalPicgoConfigDb` 作为 async backend。v3 实现必须替换为 facade-owned backend，或增加显式 `ensureReady()` lifecycle，确保等待 remote owner data 后再合并默认值。默认值合并 MUST 按 domain 进行，并且 MUST NOT 用生成默认值覆盖真实用户值。

同样的 ready-before-default 规则适用于 `ConfigDb`、`useSiyuanSetting` storage、Lsky token state 以及未来任何 owner file backend。

### Decision 6: Paste/bootstrap 使用预热的 ready snapshot

Paste ownership 需要同步阻断宿主事件，但配置来源是 async。接受的时序如下：

```text
plugin bootstrap
  -> create 并 await ready facade
  -> 构造 pasteTakeoverSnapshot
  -> 使用 snapshot 注册 listener

paste event arrives
  -> snapshot 可用时，从 snapshot 判断 takeover 并同步 block host
  -> snapshot 因 facade 失败而不可用或 stale 时，不接管
  -> 记录或提示明确原因，然后让 host default paste 继续
```

paste listener SHALL NOT 在生产决策中读取 `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` 或其他 legacy key。legacy reads 只允许出现在 migration importers 和 tests 中。

### Decision 7: Migration v3 marker 与 per-domain importedSources

Migration marker 继续保存在现有 PicGo main owner file 的 `siyuan.picgoMigration`，但 version 和结构使用 v3 专属格式：

```ts
interface UnifiedConfigMigrationState {
  version: "v3.0-unified-async-config-source"
  status: "not-started" | "running" | "done" | "failed"
  updatedAt?: number
  error?: string
  attempts: number
  domains: Record<ConfigDomain, {
    status: "not-started" | "imported" | "skipped" | "failed"
    importedSources: string[]
    updatedAt?: number
    error?: string
  }>
}
```

规则：

1. migration 按 domain 幂等执行。某个 domain 在 v3 version 下已经是 `status="imported"` 或 `status="skipped"` 时，除非调用 `retryMigration([domain])`，否则 SHALL NOT 重新执行。
2. 失败时记录 `status="failed"`、`error`、`updatedAt`，并保持其他已成功 domain 不变。
3. retry 是显式且 domain-scoped 的；retry MUST NOT 清空已成功 domain 的 importedSources。
4. `importedSources` MUST 记录具体 legacy source 标识，例如 `v2-workspace-picgo.cfg.json`、`legacy-home-picgo.cfg.json`、`browser:universal-picgo/picgo.cfg.json`、`browser:universal-picgo/external-picgo-cfg.json`、`browser:siyuan-cfg`、`workspace:storage/syp/siyuan-cfg.json`、`browser:siyuan_picgo_plugin_lsky_token`。

### Decision 8: 默认配置识别规则

Migration priority 按 domain 计算：

1. v3 owner file 存在且包含真实用户数据时，该 owner file 是权威来源。
2. v3 owner file 缺失或仅包含 generated defaults 时，migration 可以为该 domain 导入 legacy user data。
3. 同一 domain 的多个 legacy source 都包含用户数据时，workspace source 优先于 home file，home file 优先于 browser localStorage；但高优先级来源仅为 generated default 时除外。
4. 权威 owner file 中的 unknown fields 必须保留。

Generated default recognition:

- PicGo main 只有在 root keys 和 values 与 mapping table 中 `ConfigDb.initialValue` defaults 完全匹配，且没有 uploader/plugin/user settings 时，才视为 generated default only。
- external/PicList 只有在匹配 mapping table 中 v3 defaults 且 `picListApiUrl`、`picListApiKey` 为空时，才视为 generated default only。非空 PicList URL 或 API key 是用户数据。当前代码中审计到的任何非空 external generated default，migration 时 MUST 作为 generated default 处理，并且 MUST NOT 继续作为 v3 default。
- SiYuan connection 只有在匹配 `apiUrl="http://127.0.0.1:6806"`、空 password、缺省 cookie 且没有用户编辑过的 optional fields 时，才视为 generated default only。由当前 host 派生的 runtime-origin `apiUrl` 可以用于初始化默认值，但不能单独证明用户编辑过 remote connection。
- Lsky token state 只有在 `uploader.lsky.token` 缺省时才视为 generated default。任何非空 legacy `siyuan_picgo_plugin_lsky_token` 都是用户数据，并导入 `uploader.lsky.token`。

### Decision 9: Kernel-backed backend 使用 `SiyuanKernelApi` wrapper

在 Kernel-backed runtime 中，所有 owner files SHALL 通过 `SiyuanKernelApi` wrapper 读写；该 wrapper 由 ready SiYuan connection config 或 bootstrap 提供的 host config 创建。业务层 SHALL NOT direct `fetch`、拼接 `/api/file/*`，也不得绕过 wrapper 访问 owner file storage。Kernel unavailable/auth/write failures 必须是包含 domain 和 owner file 信息的结构化 config errors。

每个 owner file SHALL 独立经过同一 storage adapter 决策树：

```text
resolveOwnerStorageAdapter(ownerFile)
  L1: hasNodeEnv
      -> JSONAdapter
      -> 当前 owner file 的 PC/Electron 文件系统路径

  L2: SiyuanDevice.siyuanWindow() 存在且暴露 workspaceDir
      -> SiYuanKernelStorageAdapter
      -> iframe / SiYuan browser realm 下的 workspace owner file

  L3: isSiyuanProxyAvailable() 同步 HEAD 探测返回 true
      -> SiYuanKernelStorageAdapter
      -> same-origin direct-open workspace owner file

  L4: 以上皆否
      -> LocalStorageAdapter
      -> 当前 owner file 的 pure browser fallback logical key
```

该决策树按 owner file 独立执行，而不是只针对 `picgo.cfg.json` 全局执行一次。例如 `picgo.cfg.json`、`external-picgo-cfg.json`、`siyuan-cfg` 都各自经过 L1-L4，并解析到当前 runtime 与该 owner file 映射路径/逻辑 key 对应的 storage backend。

### Decision 10: Verification gates 是设计的一部分

实现本规格的代码 change 只有在以下 gate 全部满足后，才可视为完成：

- facade ready、禁止 ready-before-read、per-domain routing、default recognition、migration status/retry、`ExternalPicgoConfigDb` 覆盖防护、Lsky token migration、sensitive mask、Kernel failure handling 都有 unit tests；
- Docker/Web 多设备、SiYuan PC/Electron、pure browser fallback、external/PicList route selection 都有 host smoke；
- grep/audit 证明 production 代码中的 legacy localStorage 读取只出现在 migration/test fixtures 中；
- OpenSpec validation strict mode 通过。

## 当前代码审计发现

当前代码证据：

- `libs/Universal-PicGo-Core/src/db/config/index.ts`：`ConfigDb` 已经通过 `ensureReady()` 为 async main config 延后默认 `safeSet`，但该模式必须扩展为 facade-wide，而不是只覆盖 main-config-only。
- `libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts`：`ExternalPicgoConfigDb` 在 constructor 中执行 `safeSet`，因此没有 ready barrier 时不能安全作为 async backend。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts`：当前 Kernel factory 只把 `SIYUAN_PICGO_MAIN_CONFIG_KEY` 映射到 Kernel，其余 dbPath 发送到 `LocalStorageAdapter`；这是 v2 边界，v3 已 supersede 该边界。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicGoUploadApi.ts`、`libs/Universal-PicGo-Core/src/core/ExternalPicgo.ts`、`libs/Universal-PicGo-Core/src/core/PicListUploader.ts`：upload route decision 会直接实例化并读取 `ExternalPicgoConfigDb`；v3 必须改为读取 ready facade。
- `packages/picgo-plugin-bootstrap/src/index.ts` 与 `packages/picgo-plugin-bootstrap/src/paste/PasteEventAdapter.ts`：paste 当前在 `SiyuanPicGo.getInstance(...)` 之前读取 browser localStorage；v3 必须在 listener 注册前预热 facade snapshot，且不能使用该 localStorage decision path。
- `packages/picgo-plugin-app/src/stores/useSiyuanSetting.ts`：SiYuan connection config 当前使用 `storage/syp/siyuan-cfg.json` / `siyuan-cfg`；v3 必须通过同一 facade 路由该 owner，并在输出中 mask `password`/`cookie`。
- `libs/Universal-PicGo-Core/src/plugins/uploader/lsky/index.ts`：Lsky token 当前使用 `window.localStorage` key `siyuan_picgo_plugin_lsky_token`；v3 final path 是 `picgo.cfg.json:uploader.lsky.token`。

## 风险 / 取舍

- [Risk] Breaking API 改动跨包影响大。→ Mitigation：分阶段更新，每阶段后运行类型检查和受影响测试，删除旧 API 让漏改编译失败。
- [Risk] 多 owner file 需要一致 ready。→ Mitigation：unified facade 聚合所有用户配置文件 ready 状态，任一必需文件初始化失败即显式失败。
- [Risk] 旧源冲突导致 migration 覆盖。→ Mitigation：按配置域定义优先级、默认识别和 importedSources，只有默认生成数据才可被低优先级真实用户数据替换。
- [Risk] paste/bootstrap 需要同步事件语义。→ Mitigation：listener 注册前预热 snapshot；没有 snapshot 时不接管。
- [Risk] 凭证进入 workspace storage。→ Mitigation：这是确认后的用户配置统一边界；持久化真实值，所有展示/诊断输出必须 mask。
- [Risk] local external PicGo App URL 同步到没有本机 PicGo 服务的设备。→ Mitigation：URL 是用户配置，dispatch 失败应显式报错；不要回退旧本地配置。

## Migration Plan / 迁移计划

1. 冻结 mapping table 和 v3 migration marker shape。
2. 定义 `createUnifiedPicGoConfigFacade(...)`、ready facade 类型、配置域 routing、Kernel-backed adapter 和测试 adapter。
3. 实现 per-domain migration service，把旧源导入对应 owner file，写入 v3 marker 和 importedSources。
4. 把 core/headless/UI/bootstrap/upload/uploader/plugin shell 调用方改到 ready facade。
5. 删除旧同步配置 public API、旧 storage fallback 分支和旧运行时 localStorage 用户配置读取。
6. 更新 tests/build/package 到 3.0 契约。
7. 用 grep/audit 验证旧源只出现在 migration service、test fixtures 或明确 cache-only 代码中。
