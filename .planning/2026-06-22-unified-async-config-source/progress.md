# 进度日志：统一 async config source

## 2026-06-22
- 创建新的活跃规划，保留旧 PR #682 计划文件但将本任务设为当前活跃计划。
## 2026-06-22
- 已读取 OpenSpec apply/status：`picgo-3-unified-async-config-source` 的 tasks 文件虽然显示 55/55 complete，但用户明确要求把该状态视为过期，需要重新审计实现。
- 当前工作区已有未提交改动：`.gitignore`、`ExternalPicgoConfigDb`、`SiYuanKernelStorageAdapter`、审计文档和新增测试。初步 diff 显示 `SiYuanKernelStorageAdapter` 把 unavailable 当 missing 并静默 fallback，和本次目标冲突，需要重做。

## 2026-06-22
- 已重新读取 OpenSpec proposal/design/spec/tasks、当前活跃计划、关键生产文件和测试文件。
- 当前 OpenSpec tasks 虽为全勾选，但代码审计仍确认生产链路未满足：facade 未接入 upload/settings/paste/headless，async 失败 fallback/defaults，ExternalPicgo constructor 仍写 defaults，Lsky/paste 仍有 legacy 读取。

## 2026-06-22
- 已开始重新落地实现：新增 `ConfigReadError`，修复 `UnifiedConfigFacade.loadAllOwnerFiles()` 不再在 catch 中二次调用 `adapter.read()`，async owner-file read/reload failure 直接抛结构化错误且不 merge defaults。
- `SiYuanKernelStorageAdapter` 已区分 missing vs unavailable：unavailable/auth/non-200 直接抛带 owner file/storage kind 的错误；missing 才允许 legacy localStorage migration 或返回 `{}`，并移除后台 `write({})`。
- `ExternalPicgoConfigDb` 已撤销 async constructor-time `doSafeSet()` 写入风险；async defaults 仅内存 merge，`ensureReady()` 后按缺失补齐并 flush，flush failure 不再吞掉。
- 已跑局部回归：`pnpm --filter universal-picgo exec vitest run src/config/UnifiedConfigFacade.spec.ts src/config/ExternalPicgoDefaultSurvival.spec.ts` 通过 22/22。

## 2026-06-22
- 完成本轮落地修复：Lsky 生产路径删除 legacy token localStorage fallback，改写 `uploader.lsky.token` 点路径；paste/bootstrap 改为 listener 注册前预热 facade snapshot；ExternalPicgo/PicListUploader 不再生产路径 new `ExternalPicgoConfigDb` 做路由决策。
- settings 改造：`SiyuanPicGoClient` 不再读取 `useSiyuanSetting` legacy storage；external/PicList 与 SiYuan connection 设置改为 facade-backed，保存后等待 pending update + flush。
- headless API async 化：`getConfig/getCurrentUploader/setCurrentUploader/getUploaderConfig/saveUploaderConfig/upload` 等在读取/写入前等待 ctx/facade ready，并更新 zhi-siyuan wrapper 与测试。
- 补测试：facade async read/reload failure `ConfigReadError`、不二次 read/不写 defaults；migration workspace > home > browser；external default recognition；PicList provider route；headless async 调用。
- 修复 external 默认 `picgoType` 为枚举值 `bundled`，并兼容识别/规范化旧 generated default `Bundled`，避免 bundled route 被误判失败。
- 验证通过：store/universal/zhi/app/bootstrap build；store/universal/zhi vitest；OpenSpec change/all strict validate；grep gates 无生产 legacy localStorage main read、Lsky legacy 仅 migration/test、生产无 direct `ExternalPicgoConfigDb` construction。
- 更新审计文档：`docs/audits/2026-06-22-picgo-3-unified-async-config-source-implementation-audit.md`。
