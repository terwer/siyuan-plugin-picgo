# 发现记录：统一 async config source

## 用户目标
实现上一代理产出的修复计划，完成落地与验证。

## 发现
待补充。

## 初步审计
- OpenSpec 要求 async owner file read failure 显式失败，不允许 Kernel unavailable/auth failure 或慢远端读静默 fallback 到 defaults。
- 当前 `SiYuanKernelStorageAdapter.read()` 在 remote `unavailable` 时仍尝试 localStorage migration 并最终 `{}`，这是决定性违约点。
- 当前 `UnifiedConfigFacade.loadAllOwnerFiles()` catch 里通过调用 `adapter.read?.()` 判断 Promise，这可能二次读取并造成 unhandled/副作用，需修复。

## 代码复核补充
- UnifiedConfigFacade.loadAllOwnerFiles() catch 二次调用 dapter.read()；必须改为静态 mode 判断，并对 async read failure 抛结构化 ConfigReadError。
- SiYuanKernelStorageAdapter.read() 当前把 unavailable 和 missing 混同，且会 fallback legacy localStorage / 后台 write {}；需只允许 missing 做 legacy migration 或 {}，unavailable 直接抛。
- ExternalPicgoConfigDb async constructor 仍执行 doSafeSet()，会 schedule JSONStore debounce write，慢远端时可覆盖用户配置；应只在 sync 构造或 async nsureReady() 后补 defaults。
- upload dispatch 当前由 ExternalPicgo 与 PicListUploader 内部各自 DB 决策；需改成从 ready facade 的 xternalPicgo snapshot 决策，并给执行类注入同一 snapshot/provider。

## 实现补充发现
- `UnifiedConfigFacade.spec.ts` 现有 failing adapter 用例只覆盖 flush failure，缺少 factory/reload read failure 断言；后续需要补 `ConfigReadError` 和 read 调用次数为 1。
- `SiyuanKernelStorageAdapter` 的 legacy localStorage migration 仍保留在 adapter missing 分支，符合“missing 可迁移”；生产 forbidden grep 针对的是 paste/lsky 决策读取，后续还要收敛。

## 完成审计发现
- `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` 当前在 `libs/`、`packages/` 生产/测试范围均无命中；paste 生产链路只使用预热 snapshot。
- `siyuan_picgo_plugin_lsky_token` 仅保留在 `V3MigrationService.ts` 与 `V3MigrationService.spec.ts`，符合 migration/test-only 约束。
- `new ExternalPicgoConfigDb|ExternalPicgoConfigDb\(` 在非 spec 生产路径无命中；ExternalPicgo/PicListUploader 依赖 upload API 注入的 ready facade route provider。
- 全量 `universal-picgo` 测试通过 19 files / 183 tests；`SettingsStorePattern` 中原先“async backend 未 ready 仍显示 defaults”的旧预期已改为显式 `ConfigReadError`。
- v3 默认 PicList URL 仍为空；`DefaultRecognition.ts` 的 `https://example.com/upload` 仅用于识别旧 generated default，不作为默认写入。

## 2026-06-23 最新代码审计发现
- 最新提交：`ea8d067 fix(core): ensure ExternalPicgoConfigDb defaults survive async load overwrite`；本轮开始时除 `.planning` 外工作区干净。
- OpenSpec/spec 对 v3 migration 要求 domain-aware state + `retryMigration(domains?)` 明确重试；当前 `SiyuanPicgoPostApi.getConfigMigrationState()` / `retryConfigMigration()` 仍走 `siyuanPicgoMigrationState.ts` 的 v2 marker（`MIGRATION_VERSION = "v2.0"`）和旧 `updateConfig()`，未读取/展示/重试 facade 的 `UnifiedConfigMigrationState`。
- `createUnifiedPicGoConfigFacade().ensureMigration()` 即使 v3 migration failed 也会 resolve ready；如果 UI/headless 不读取 facade migration state，失败会被静默吞掉，只保留到 owner file marker。
- `V3MigrationService.migrateDomain()` 对 `picgoMain`、`picgoSettings`、`siyuanBehavior`、`pluginValues`、`uploaderConfig` 共享整份 `picgo.cfg.json` 做 default classification。若 v3 owner file 已有某一域用户数据但其他域缺失，会把所有共享 owner 的域都判为 `user-data`，跳过 legacy 导入，和 per-domain 迁移/默认识别要求不一致。
- 敏感字段 mask 仍有一处不符合统一 `******`：`PicListUploader` debug log 使用 `requestUrl.replace(apiKey, "***")`，虽未泄露原文，但与 OpenSpec “mask 输出统一使用 `******`”不一致。
- 根脚本 `pnpm audit:picgo-refactor` 当前失败，且失败项包含明显过期的 v2/旧版本断言：`plugin.json version expected 1.12.1`、paste listener 必须在 listener 内 `tryTakeoverWithConfig` 后再 `SiyuanPicGo.getInstance`、v2 path contract 禁止 workspace external owner 等。需要更新为 v3 OpenSpec gate，否则会成为误导性红灯。
- 包与插件版本仍为 `2.1.1`，而 OpenSpec 将本变更定位为 PicGo plugin 3.0 breaking change；若版本提升不属于本 change，应在发布计划明确，否则属于 release contract 偏离。
- 最新 grep gate：legacy main `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` 无命中；legacy Lsky key 仅 migration/spec；非 spec 生产路径无 `ExternalPicgoConfigDb` 构造；无 `/api/file/` 直连。

## 2026-06-23 修复后复审发现
- 前次审计偏离大多已修：产品 API/UI 读取真实 v3 migration state 并调用 facade retry；per-domain default recognition 与 migration apply 已拆分；PicList API key 日志使用 `MASK_VALUE="******"`；`pnpm audit:picgo-refactor` 已改为 v3 gate 并通过。
- 新发现 P1：`UnifiedConfigFacade.retryMigration(domains?)` 未使用已存在的 `retryV3Migration()`，而是调用 `runV3MigrationInternal()`；后者最终遍历所有非 imported/skipped domains，所以指定 domain retry 会顺带重试其他 failed domain，违反 domain-scoped retry。
- 新发现 P1：`resolveStorageAdapterFactory()` 的 Node 分支对所有 owner logical key 直接 `new JSONAdapter(path)`；external=`universal-picgo/external-picgo-cfg.json`、connection=`siyuan-cfg` 未映射到 SiYuan PC workspace owner files，实际仍有 v2 main-only 同步边界风险。
- 新发现 P2：v3 facade flush 后仍执行 v2 `migrateV2WorkspaceConfig()`；默认 workspace + v3 marker 仍会被 `isDefaultInitializedConfig()` 当作可覆盖，home 文件存在时可能丢失 v3 marker。
- 新发现 P2：facade `instanceKey` 只有 apiUrl/configPath，未包含 storage kind/workspace/external/siyuan owner identity，与 OpenSpec instanceKey contract 不一致。

## 2026-06-23 二次修复发现
- `UnifiedConfigFacade.retryMigration(domains?)` 需要调用 `retryV3Migration(options, domains)`；否则 `runV3Migration()` 会遍历所有非 imported/skipped domain，造成指定单 domain retry 顺带重试其他 failed domain。
- SiYuan PC/Node 分支不能直接把 logical key 交给 `JSONAdapter`；external 与 `siyuan-cfg` 必须在 workspaceDir 存在时映射到 `<workspace>/data/storage/syp/picgo/external-picgo-cfg.json` 与 `<workspace>/data/storage/syp/siyuan-cfg.json`。
- v2 main-config copy helper 在 v3 facade flush 之后运行时必须识别 v3 marker；默认值 + `siyuan.picgoMigration.version=v3.0-unified-async-config-source` 不应被视作可覆盖的 generated default。
- `instanceKey` 不应只包含 apiUrl/configPath；需要包含 storage factory、owner logical key、storageKind、mode、domains、workspaceDir/homeDir 和 path overrides，同时不能包含 password/cookie/picListApiKey 等敏感字段。
- `SiyuanPicGoUploadApi` 的 `storageAdapterFactory` 必须传递给 `UniversalPicGo` options，否则 zhi tsc 报 unused parameter，且 runtime 可能未共享同一 storage adapter factory。
