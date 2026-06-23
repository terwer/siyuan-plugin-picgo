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
