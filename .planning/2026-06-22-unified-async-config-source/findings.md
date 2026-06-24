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

## 2026-06-24 二次修复后最终复审发现
- 最新提交 `5872136` 已包含二次修复与审计文档，工作区审计前后 clean。
- 前次 4 项阻断/偏离均已关闭：domain-scoped retry、Node workspace 三 owner mapping、v3 marker 防覆盖、instanceKey identity/sensitive gate。
- Forbidden grep gates 继续通过：无 production legacy main localStorage read；Lsky legacy key 仅 migration/test；生产路径无 direct `ExternalPicgoConfigDb` route decision；生产 owner file 无 direct `/api/file/`；PicList log 使用 `MASK_VALUE`。
- 剩余非阻断说明：版本仍为 `2.1.1`，按前次用户确认由发布 GitHub Action 自动 bump 到 3.0；构建警告为既有 `LC_ALL`、Node `DEP0180` 与 chunk size warning。

## 2026-06-24 真机测试发现
- PC 主进程插件启动阶段使用 Node JSONAdapter 读写 workspace 绝对路径正常，`picgo.cfg.json` auto-flush 成功。
- 点击 popup 后进入前端/Kernel adapter 路径，main/external/siyuan-cfg 三 owner 均从 Kernel `/data/storage/syp/...` 读成功；`static-rs-terwer` 进一步证明读取的是真实 Kernel 文件。
- 唯一功能性错误是初始化副作用触发的 `picgo.cfg.json` Kernel auto-flush 报错，堆栈来自 `removeConfig("siyuan", "proxy")`。
- `zhi-siyuan-api@2.21.0` 的 `saveTextData()` 成功返回值不是完整 `SiyuanData`；当前 adapter 以 `result?.code !== 0` 判断成功，存在返回形态误判。

## 2026-06-24 真机 popup 修复发现
- 用户确认 `static-rs-terwer` 是此前 PC 保存的真实值；因此“读到真实 Kernel owner file”是正确行为，本轮问题不在读取源选择。
- 真实 workspace `/Volumes/workspace/mydocs/SiYuanWorkspace/test/data/storage/syp/picgo/picgo.cfg.json` 当前不含 `"proxy"` 字段；点击 popup 后仍写 `/data/storage/syp/picgo/picgo.cfg.json`，说明触发点是 legacy cleanup no-op 写入，而不是用户显式保存。
- `UniversalPicGo.removeConfig()` 原逻辑无论字段是否存在都会进入 `unifiedConfigFacade.updatePicGoConfig()`，造成 popup 初始化时的无效 auto-flush；修复为实际 `unsetByPath()` 成功才写入。
- `SiYuanKernelStorageAdapter.write()` 原逻辑把 `saveTextData()` 的运行时返回当完整 `{code}` 判断；但 `zhi-siyuan-api` wrapper 成功返回 `data`，常见 `null`，所以会把成功误报为 `unknown error`。
- 为兼顾“不要吞掉真实 Kernel 写失败”，新的写入策略是：明确 `{code:number}` 且非 0 立即结构化失败；throw 结构化包装；其余返回形态必须通过写后读回 JSON verification 才算成功。

## 2026-06-24 修复后日志评估发现
- `PC_init.txt`：0 个 PicGo ERROR/failed，0 次 Kernel write；Node/sync owner mapping 显示 workspace 绝对路径，符合 PC 插件启用阶段预期。
- `PC_popup.txt`：0 个 PicGo ERROR/failed，0 次 Kernel write，4 条 Kernel read（main owner 有并发/重复读取，随后 siyuan-cfg 与 external 各读一次），无 `auto-flush failed`，符合 popup 只读初始化预期。
- `网页_init.txt`：0 次 Kernel write，Kernel read 三 owner 成功；grep 到的 error 主要是思源字体 CORS/`net::ERR_FAILED 200 (OK)`，与 PicGo 配置 owner file 无关。
- `网页_popup.txt` 与 `网页_init.txt` 完全一致，说明当前提供的网页 popup 文件未包含 popup 打开后的新增日志；不能作为 popup 增量行为证据，但至少未出现此前 auto-flush/write 错误。
- `zhi is not supported in browser` 属于浏览器 runtime 下跳过 zhi npm/plugin runtime 的既有 warning，当前路径同时显示 `third-party PicGo plugins are ignored outside Electron runtime`，不影响 unified config 读取。

## 2026-06-24 真 async / fake flush 专项审计发现
- 当前代码不是“假读取”：Kernel adapter 的 `read()` 必须 await `getFile()`，`write()` 必须 await `saveTextData()` 且写后 await `getFile()` verify；真实不可用会结构化失败，不会回退 browser mock/localStorage。
- `JSONStore` 自身的 async flush 语义较完整：`flush()` 会 clear pending timer，并 await write promise；这一层不是 fake flush。
- `UnifiedConfigFacade` 的 ready factory 和初始 flush 是真实 await：`createUnifiedPicGoConfigFacade()` 完成 owner read/migration/default merge 后 resolve；`SiyuanPicgoPostApi.initInternal()` await facade、await `facade.flush()`、再 attach facade。
- 重大偏离在 facade 的显式 flush 与 auto-flush 协调：`update*Config()` 调 `scheduleFlush()` 后，`flush()` 不 clear `state.debounceTimers`，也没有 per-owner in-flight write promise；慢 Kernel 写入时 timer 可与 explicit flush 并发写同一 owner，且 auto-flush 错误只 log。
- 所以当前结论是“底层真 async，但 facade flush 尚未 drain 所有派生写任务”；不能作为“全部真实全异步链路”归档。
- 修复方向：per-owner 写队列/锁；explicit flush 先取消 debounce timer，再把 dirty 状态纳入本次写并 await 同 owner in-flight；scheduleFlush 复用同一 pipeline；补 fake timer 慢 adapter 用例与审计 gate。

## 2026-06-24 async flush drain 修复发现
- debounce 防频繁写本身不是问题；问题是 explicit `flush()` 必须能接管/等待该 debounce 派生的同 owner write。修复后 `scheduleFlush()` 与 `flush()` 共用 `flushOwnerFile()`，不再有两个独立写入口竞争同一 owner file。
- `dirtyVersion` 是判断旧写入能否清 dirty 的关键：如果写入期间发生新 mutation，旧任务完成只更新 `flushedVersion`，不会把 `dirty=false`，从而避免“藏数据”。
- `currentWriteTask/currentWriteVersion` 让 explicit flush 可以 join 已经 in-flight 且覆盖目标版本的 auto-flush，避免重复写；如果当前 write 版本落后，则通过 `writeQueue` 追加新版 snapshot。
- `writeQueue` 必须保持 non-rejecting tail；失败时 raw task 仍向 explicit flush 传播错误，但队列尾部 catch 掉拒绝，后续 retry 不会被断链。
- 当前修复范围是同一 facade 实例内的 durable/drainable barrier；跨窗口/跨进程/跨 facade 强一致 CAS 未在本 change 内实现，也不应在归档文档中夸大。

## 2026-06-24 async flush 收口审计发现
- 修复后 grep 证明旧 race 入口已消失：`scheduleFlush()` 不再直接 `writeOwnerFile()`，所有自动/显式写入都进入 `flushOwnerFile()`。
- 允许存在的 `dirty=false` 只在 reload 或目标版本成功 durably written 后发生；允许存在的 `dirty=true` 只在标脏或写失败重试保留状态时发生。
- 当前剩余边界不是本 change 缺陷：跨 facade/跨进程强一致仍未实现，但已在审计文档中明确不承诺；同一 facade 实例内已具备 drainable flush。

## 2026-06-24 README 3.0 文案收口发现
- README 3.0 的核心痛点应直达“配置归一化”：同一工作空间内，PC、可访问 SiYuan API 的网页端、Docker 部署读取同一套真实 workspace-backed 配置，而不是继续强调泛泛的“配置也跟上了”。
- 2.0 路径拆分已从主说明移动到历史路径；3.0 主路径明确 main/external/siyuan-cfg 三类用户可感知配置进入工作空间，runtime 仍留在 `~/.universal-picgo/`。
- 跨窗口/跨进程/跨 facade CAS 边界不应写成思源“多工作空间”限制；思源多工作空间天然隔离。README 仅轻量说明：同一工作空间内多个入口同时改同一项 PicGo 设置时按最后保存为准，日常基本遇不到。
