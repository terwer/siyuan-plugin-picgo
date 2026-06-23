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

## 2026-06-23
- 用户要求在多次提交后的最新代码上，对 `picgo-3-unified-async-config-source` 做全量审计；本轮只做审计与偏离修复 prompt 输出，不直接改业务代码。
- 用户补充要求：审计结果需固化到 `/Volumes/workspace/mydocs/siyuan-plugins/siyuan-plugin-picgo/docs/audits`。
- 已完成最新代码审计并固化到 `docs/audits/2026-06-23-picgo-3-unified-async-config-source-latest-code-audit.md`。
- 验证：5 个 build 命令通过；store/universal/zhi 单测通过（9/183/17）；OpenSpec change/all strict 均通过；核心 grep gates 通过。
- 偏离：v3 migration state/retry 未接入产品 UI/lifecycle；`picgo.cfg.json` 共享 owner 的 migration classification 不是 per-domain；PicList API key log mask 使用 `***` 而非 `******`；`pnpm audit:picgo-refactor` 脚本仍含旧 v2/旧版本断言并失败；版本仍为 `2.1.1` 与 PicGo 3.0 breaking 定位不一致或需明确 out-of-scope。

## 2026-06-23 复审
- 用户表示已修复并要求继续审计；本轮将基于最新代码重新检查前次偏离项、跑验证命令，并更新 `docs/audits/`。

## 2026-06-23 修复后复审完成
- 已基于用户修复后的未提交工作区完成复审，并新建 `docs/audits/2026-06-23-picgo-3-unified-async-config-source-post-fix-audit.md`。
- 前次偏离中 v3 migration UI/retry 接线、per-domain recognition、PicList mask、审计脚本、版本 out-of-scope 说明均已基本修复；`pnpm audit:picgo-refactor` 通过。
- 验证通过：5 个 build、store/universal/zhi vitest（9/188/19）、`pnpm audit:picgo-refactor`、OpenSpec change/all strict。
- 复审仍发现偏离：`retryMigration(domains?)` 实际会顺带重试所有 failed domains；SiYuan PC/Node external 与 `siyuan-cfg` owner 未映射到 workspace 文件；v2 兼容 copy 可能覆盖默认 workspace 的 v3 marker；facade `instanceKey` 缺少 storage/workspace identity。

## 2026-06-23 二次偏离修复完成
- 已按复审剩余偏离继续修复：`retryMigration(domains?)` 改为通过 `retryV3Migration` 的 domain-scoped 语义；指定 domain retry 不再顺带重试其他 failed domain。
- 已修复 SiYuan PC/Node 三 owner file 映射：main / external-picgo-cfg / siyuan-cfg 均解析到 workspace owner file；Node 工厂使用 `createNodeWorkspaceFactory(paths)` 映射 logical key 到绝对路径。
- 已修复 v2 legacy copy 覆盖 v3 marker 风险：`hasV3MigrationMarker()` 与 `isDefaultInitializedConfig()` 共同防止默认 workspace + v3 marker 被 home config 覆盖。
- 已完善 facade `instanceKey`：包含 storage/workspace/owner identity 与 path overrides，不包含 password/cookie/picListApiKey；并导出 `UNIFIED_CONFIG_MIGRATION_VERSION`。
- 已修复 `SiyuanPicGoUploadApi` 构造时未传递 `storageAdapterFactory` 导致 zhi tsc unused 参数问题。
- 已更新 `scripts/picgo-internal-refactor-audit.cjs`，新增 domain-scoped retry、Node workspace 三 owner mapping、v3 marker 防覆盖、instanceKey identity/sensitive gate。
- 已更新 `docs/audits/2026-06-23-picgo-3-unified-async-config-source-post-fix-audit.md`，追加二次修复证据与最终验证记录。
- 验证通过：5 个 build；store/universal/zhi vitest（9/190/21）；`pnpm audit:picgo-refactor`；OpenSpec change/all strict；额外 `universal-picgo` 与 `zhi-siyuan-picgo` tsc --noEmit。
