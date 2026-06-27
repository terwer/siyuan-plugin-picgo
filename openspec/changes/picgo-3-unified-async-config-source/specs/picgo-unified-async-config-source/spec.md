## ADDED Requirements

### Requirement: PicGo 3.0 supersedes v2 main-config-only persistence 边界
PicGo 3.0 SHALL 将 `docker-picgo-storage-persistence` 视为已完成的 v2 compatibility baseline 和 migration source，而不是继续作为 3.0 product boundary。

#### Scenario: v3 同步范围覆盖所有 user configuration domains
- **WHEN** PicGo 3.0 运行在 Kernel-backed Docker/Web 或 SiYuan workspace runtime
- **THEN** PicGo main config、external/PicList config、SiYuan connection config、SiYuan integration behavior、plugin enable/config values、uploader config 和 uploader-owned state SHALL 通过 unified async facade 访问
- **AND** 每个 domain SHALL 按 mapping table 持久化到对应 workspace owner file
- **AND** v2 中“只有 `picgo.cfg.json` 进入 Kernel storage”的规则 SHALL NOT 作为 3.0 限制

#### Scenario: 只有 plugin runtime artifacts 保持 device-local
- **WHEN** PicGo 3.0 区分 syncable user configuration 和 runtime artifacts
- **THEN** third-party PicGo plugin packages、npm folders、`pluginBaseDir`、`zhiNpmPath`、logs、caches 和 build output SHALL 保持 PC/Electron-local artifacts
- **AND** plugin enablement 和 plugin configuration values SHALL 仍作为可同步 user configuration

### Requirement: PicGo 3.0 使用统一 async 配置 facade
PicGo 3.0 SHALL 在任何 production code 读取 user configuration 前，通过 async factory 创建 ready `ReadyUnifiedPicGoConfigFacade`。

#### Scenario: 运行时等待统一配置 ready
- **WHEN** settings UI、upload dispatch、paste/bootstrap、headless API、uploader code、plugin shell 或 route decision logic 需要 user configuration
- **THEN** 调用方 SHALL 从 `createUnifiedPicGoConfigFacade(...)` 或已经 await 它的 owner lifecycle 获得 ready facade
- **AND** facade SHALL 返回由对应 owner files 组装的 snapshot

#### Scenario: Ready 前读取用户配置失败
- **WHEN** production code 在 facade factory resolve 前尝试读取 user configuration
- **THEN** 系统 SHALL 以结构化 `ConfigNotReadyError` 失败，或避免注册依赖该配置的行为
- **AND** 系统 SHALL NOT 把 generated defaults 当作 user configuration 返回

#### Scenario: 配置变更通过同一个 facade 持久化
- **WHEN** user configuration 从 settings UI、headless API、plugin shell、paste/bootstrap setup、uploader config code 或 plugin config code 变更
- **THEN** 该变更 SHALL 通过 unified async facade
- **AND** facade SHALL 将 changed domain flush 到其 owner file

### Requirement: 现有 owner file 保持配置归属
PicGo 3.0 SHALL 保持当前 owner file names 和 logical keys，同时通过 facade 路由所有 user configuration access。

#### Scenario: PicGo main owner is picgo.cfg.json
- **WHEN** PicGo 需要 uploader selection、`picBed`、uploader options、`uploader.*`、`picgoPlugins`、`settings.*`、debug/silent flags、SiYuan integration behavior 或 uploader-owned persistent state
- **THEN** 这些值 SHALL 归属现有 `picgo.cfg.json`

#### Scenario: external PicGo 和 PicList owner 是 external-picgo-cfg.json
- **WHEN** PicGo 需要 bundled PicGo、local external PicGo App 或 remote PicList route decisions
- **THEN** `useBundledPicgo`、`picgoType`、`extPicgoApiUrl`、`picListApiUrl` 和 `picListApiKey` SHALL 归属 `external-picgo-cfg.json`
- **AND** local external PicGo App URL SHALL 被视为 syncable user configuration，而不是 PC-only artifact

#### Scenario: SiYuan connection owner is siyuan-cfg
- **WHEN** settings UI 或 runtime 基于 `apiUrl`、`password`、`cookie` 或相关 `SiyuanConfigLike` fields 创建 SiYuan API client
- **THEN** 这些字段 SHALL 归属 `siyuan-cfg` / `storage/syp/siyuan-cfg.json` 语义
- **AND** `password` 和 `cookie` SHALL 在非持久化输出中被 mask

### Requirement: Unified facade public API 是 async-only 且 typed
PicGo 3.0 SHALL 暴露 async configuration APIs，并提供明确的 domain operations 与 migration state。

#### Scenario: Required facade surface exists
- **WHEN** implementers 定义 unified configuration contract
- **THEN** 它 SHALL 包含等价于 `getPicGoConfig`、`getExternalPicGoConfig`、`getSiyuanConnectionConfig`、`getPasteTakeoverSnapshot`、`updatePicGoConfig`、`updateExternalPicGoConfig`、`updateSiyuanConnectionConfig`、`flush`、`reload`、`getMigrationState`、`retryMigration`、`maskSnapshot` 的 async methods
- **AND** 它 SHALL 包含等价于 `picgoMain`、`picgoSettings`、`siyuanBehavior`、`siyuanConnection`、`externalPicList`、`pluginValues`、`uploaderConfig`、`lskyState`、`pasteBootstrap` 的 domain typing

#### Scenario: Old sync config methods are not production contract
- **WHEN** implementation code 在 migration helpers、adapter internals 或 test fixtures 之外仍引用旧 sync config APIs
- **THEN** type checking 或 grep/audit gates SHALL 失败，直到调用方改用 async facade

### Requirement: Async backend MUST 在 ready 后合并 defaults
Owner file backends SHALL 在加载事实来源之后再应用 generated defaults。

#### Scenario: ExternalPicgoConfigDb 不能原样作为 async backend 复用
- **WHEN** 实现 `external-picgo-cfg.json` 的 async backend
- **THEN** 当前 `ExternalPicgoConfigDb` 中 constructor-time `safeSet` 行为 SHALL NOT 原样使用
- **AND** external/PicList defaults SHALL 只在 remote 或 local owner file 已加载并被判定为 missing 或 generated-default-only 后合并

#### Scenario: Defaults 不覆盖 remote user data
- **WHEN** Kernel owner file 已经包含某个 domain 的 user values
- **THEN** facade initialization SHALL 保留这些值
- **AND** generated defaults SHALL NOT 在 ready 阶段 flush 覆盖这些值

### Requirement: Legacy store 只作为 migration input
旧配置位置 SHALL 只由 PicGo 3.0 migration code 或 tests 读取；runtime decisions SHALL 通过 facade 使用 owner files。

#### Scenario: migration imports old main config
- **WHEN** migration 发现 v2 workspace、legacy home 或 browser `picgo.cfg.json` 数据
- **THEN** PicGo main data SHALL 导入现有 `picgo.cfg.json`
- **AND** unknown fields SHALL 保留

#### Scenario: migration imports external/PicList config
- **WHEN** migration 发现 legacy `external-picgo-cfg.json` 或对应 browser/pluginBaseDir logical key
- **THEN** `useBundledPicgo`、`picgoType`、`extPicgoApiUrl`、`picListApiUrl` 和 `picListApiKey` SHALL 导入现有 `external-picgo-cfg.json`

#### Scenario: migration imports SiYuan connection config
- **WHEN** migration 发现 legacy `storage/syp/siyuan-cfg.json` 或 browser `siyuan-cfg`
- **THEN** `apiUrl`、`password`、`cookie` 和相关 `SiyuanConfigLike` fields SHALL 导入 SiYuan connection owner file
- **AND** migration report SHALL mask `password` 和 `cookie`

#### Scenario: migration imports Lsky token state
- **WHEN** migration 发现 legacy `siyuan_picgo_plugin_lsky_token`
- **THEN** token SHALL 导入 `picgo.cfg.json` logical path `uploader.lsky.token`
- **AND** legacy key SHALL NOT 被 production uploader code 在 migration 后读取

### Requirement: Migration v3 state 支持 domain-aware 与 retry
PicGo 3.0 migration SHALL 记录包含 global 与 per-domain status 的 v3 marker。

#### Scenario: v3 marker shape 被持久化
- **WHEN** migration 开始或完成
- **THEN** `picgo.cfg.json` SHALL 包含 `siyuan.picgoMigration.version`，其值为 `v3.0-unified-async-config-source`
- **AND** marker SHALL 包含 global `status`、`attempts`、`updatedAt`、可选 `error`，以及 per-domain `status`、`importedSources`、`updatedAt`、可选 `error`

#### Scenario: Failure 与 retry 必须显式
- **WHEN** 某个 domain migration 失败
- **THEN** 该 failure SHALL 记录到对应 domain，且不清除 successful domains
- **AND** migration SHALL 只通过显式 `retryMigration(domains?)` 路径重试 failed domains

### Requirement: Default-generated owner files 优先级低于真实 legacy data
Migration SHALL 在决定是否导入 legacy sources 前区分 generated defaults 和 user data。

#### Scenario: Missing 或 generated defaults 可以被替换
- **WHEN** v3 owner file 缺失或某个 domain 只包含 generated defaults
- **THEN** migration MAY 从该 domain 最高优先级 legacy source 导入真实 user data

#### Scenario: Existing user data 是 authoritative
- **WHEN** v3 owner file 包含非默认 user values 或 unknown fields
- **THEN** migration SHALL 将其视为 authoritative
- **AND** legacy sources SHALL NOT 覆盖它

### Requirement: Sensitive fields 在 persistence 外必须 mask
Sensitive configuration values SHALL 只存储在其 owner files 中，并在其他位置 mask。

#### Scenario: Masked diagnostics 不泄露 secrets
- **WHEN** logs、errors、migration reports、diagnostics、audits 或 smoke evidence 包含 config snapshots
- **THEN** `password`、`cookie`、`picListApiKey`、`uploader.lsky.token` 和 uploader/plugin token/secret/password/key fields SHALL 渲染为 `******`
- **AND** masked value SHALL NOT 写回 owner file

### Requirement: Kernel-backed 持久化使用 SiyuanKernelApi wrapper
facade 运行在 SiYuan Kernel-backed storage 上时，SHALL 使用 `SiyuanKernelApi` wrapper 读写 owner files。

#### Scenario: Kernel backend 通过 wrapper 写入 owner files
- **WHEN** facade 读取或写入 workspace owner files
- **THEN** 它 SHALL 使用由 ready connection config 或 bootstrap host config 创建的 `SiyuanKernelApi` wrapper
- **AND** 业务层 SHALL NOT direct `fetch`、拼接 `/api/file/*`，或绕过 wrapper 访问 owner file storage

#### Scenario: Kernel backend failure 必须显式
- **WHEN** Kernel-backed read、write 或 authorization 失败
- **THEN** facade SHALL 暴露包含 domain 和 owner file 的 structured failure
- **AND** UI/headless callers SHALL 展示或返回该 failure，而不是静默 fallback 到 stale localStorage

### Requirement: 非用户 caches 明确排除
非 user configuration 的 runtime caches 和 artifacts SHALL 保持在 facade 之外。

#### Scenario: UI 或 runtime artifacts 保持 cache-only
- **WHEN** code 存储 generated UI state、i18n data、logs、package metadata、node_modules state、clipboard temp files 或 build output
- **THEN** 这些值 MAY 使用 cache 或 local artifact storage
- **AND** 它们 SHALL NOT 被视为 user configuration domains
