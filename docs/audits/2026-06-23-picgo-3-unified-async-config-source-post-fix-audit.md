# picgo-3-unified-async-config-source 修复后复审

- 复审时间：2026-06-23
- 基线提交：`ea8d067 fix(core): ensure ExternalPicgoConfigDb defaults survive async load overwrite`
- 工作区状态：用户修复以未提交改动形式存在；本复审覆盖这些改动以及新增 `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.spec.ts`。
- 范围：前次审计偏离项、OpenSpec `picgo-3-unified-async-config-source`、核心配置/migration/设置页/审计脚本、grep/build/test/OpenSpec 门禁。
- 结论：**仍有偏离，不建议归档**。前次列出的 v3 migration UI/retry 接线、per-domain recognition、PicList mask、审计脚本和版本说明已基本修复；但复审发现 `retryMigration(domains?)` 实际不是 domain-scoped，且 SiYuan PC/Node 侧 external 与 `siyuan-cfg` owner file 仍未按 v3 全量统一落到 workspace owner file。此外 v2 兼容步骤仍可能在 v3 marker 写入后覆盖默认 workspace 配置。

## 本轮验证结果

| 检查 | 结果 |
| --- | --- |
| `pnpm --filter universal-picgo-store build` | ✅ 通过 |
| `pnpm --filter universal-picgo build` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo build` | ✅ 通过 |
| `pnpm --filter picgo-plugin-app build` | ✅ 通过；仅 `LC_ALL`、Node `DEP0180`、chunk size warning |
| `pnpm --filter picgo-plugin-bootstrap build` | ✅ 通过 |
| `pnpm --filter universal-picgo-store exec vitest run` | ✅ 2 files / 9 tests |
| `pnpm --filter universal-picgo exec vitest run` | ✅ 19 files / 188 tests |
| `pnpm --filter zhi-siyuan-picgo exec vitest run` | ✅ 5 files / 19 tests |
| `pnpm audit:picgo-refactor` | ✅ 通过；`contract` / `boundaries` / `v3-unified-config` / `bundle` 均 ok |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |

## Grep gates

| Gate | 结果 |
| --- | --- |
| production legacy main `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` | ✅ 无命中 |
| legacy Lsky key `siyuan_picgo_plugin_lsky_token` | ✅ 仅 `V3MigrationService.ts` 与 spec 命中 |
| 非 spec 生产路径 direct `ExternalPicgoConfigDb` construction | ✅ 无命中 |
| Kernel owner `/api/file/` direct access | ✅ 无命中 |
| v3 PicList 非空默认 URL | ✅ 无生产默认；`DefaultRecognition.ts` 仅识别旧 `https://example.com/upload` generated default |
| PicList API key log mask | ✅ `PicListUploader` 使用 `MASK_VALUE`，测试覆盖不输出原 key |

## 前次偏离复核

- ✅ **v3 migration state / retry 产品接线**：`SiyuanPicgoPostApi.getConfigMigrationState()` 读取 facade snapshot；`retryConfigMigration(domains?)` 调用 facade retry/flush/reload；设置页展示 failed domains。
- ✅ **共享 owner per-domain recognition**：`DefaultRecognition.ts` 与 `V3MigrationService.ts` 已按 `picgoMain/picgoSettings/siyuanBehavior/pluginValues/uploaderConfig` 分域判断和应用，并补测试。
- ✅ **PicList mask 统一值**：`requestUrl.replace(apiKey, MASK_VALUE)`，`MASK_VALUE="******"`。
- ✅ **`pnpm audit:picgo-refactor` 旧 contract**：脚本已替换为 v3 gate 并通过。
- ✅ **版本定位说明**：源码仍为 `2.1.1`，修复记录说明 `3.0.0` 由发布 GitHub Action 自动 bump；本复审不再把手工版本号作为阻断项，但发布前仍需确认 release workflow 确实会 bump。

## 仍存在的偏离

### P1：`retryMigration(domains?)` 不是实际 domain-scoped

OpenSpec 要求 retry 显式且可按 domain 限定：调用 `retryMigration([domain])` 时，不应重试未指定的 failed domains，也不能清空已成功 domain 的 importedSources。

当前 facade 方法接收 `domains`，但只把指定 failed domain 重置为 `not-started`，随后调用通用 `runV3MigrationInternal()`。而 `runV3MigrationInternal()` 内部调用 `runV3Migration()`，该服务循环所有 `ALL_CONFIG_DOMAINS`，只跳过 `imported/skipped`，**不会跳过未指定的 `failed` domain**。因此只要有两个 failed domain，调用 `retryMigration(["siyuanConnection"])` 仍会顺带重试另一个 failed domain。

证据：

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:46` 已导入 `retryV3Migration as retryMigrationService`，但未使用。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:557-579`：facade retry 重置 `targets` 后调用 `runV3MigrationInternal(state, ...)`。
- `libs/Universal-PicGo-Core/src/config/V3MigrationService.ts:252-260`：`runV3Migration()` 遍历所有 domains，只跳过 `imported/skipped`，对所有 `failed/not-started` 都会执行 `migrateDomain()`。
- `libs/Universal-PicGo-Core/src/config/V3MigrationService.ts:285-321` 已有真正按 `targets` 循环的 `retryV3Migration()`，但当前 facade 没接上。

影响：

- UI 或 headless 调用 `retryConfigMigration([domain])` 时，会改变未指定 failed domain 的状态与 `importedSources`，违背 domain-scoped retry contract。
- 现有 `siyuanPicgoPostApi.spec.ts` 只覆盖单 failed domain，不能防住该回归。

### P1：SiYuan PC/Node 侧 external 与 `siyuan-cfg` owner file 仍未进入 workspace owner file

OpenSpec v3 明确 supersede v2 main-config-only 边界：external/PicList 与 SiYuan connection 也属于可同步 user configuration，在 SiYuan workspace runtime 下应进入对应 workspace owner file。

当前 `resolveStorageAdapterFactory()` 在 `hasNodeEnv` 时直接返回 `(path) => new JSONAdapter(path)`。facade 给 external 和 connection 的 logical keys 分别是 `universal-picgo/external-picgo-cfg.json` 与 `siyuan-cfg`。这会让 SiYuan PC/Node 路径写到相对 logical key，而不是 workspace 的：

- `<workspace>/data/storage/syp/picgo/external-picgo-cfg.json`
- `<workspace>/data/storage/syp/siyuan-cfg.json`

证据：

- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts:134-139`：`hasNodeEnv` 优先，直接 `new JSONAdapter(path)`，不会进入 `createKernelFactory()` 的三 owner mapping。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:426-430`：external/connection logical keys 仍是 `universal-picgo/external-picgo-cfg.json`、`siyuan-cfg`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts:161-164`：三 owner mapping 只存在于 non-Node Kernel factory；Node/SiYuan PC 分支没有等价文件路径映射。

影响：

- SiYuan PC/Node 下只有 main config 因 `configPath` 是 workspace 绝对路径而落到 workspace；external/PicList 与 `siyuan-cfg` 不会按 v3 mapping table 随 workspace 同步。
- 这会重新引入 v2 “只同步主配置”的实际边界，只是 Web/Docker Kernel 分支被修好了。

### P2：v2 兼容 copy 步骤仍可能在 v3 marker 写入后覆盖默认 workspace 配置

`SiyuanPicgoPostApi.initInternal()` 先等待 v3 facade、flush v3 marker，再执行 `runLegacyRuntimeCompatibilityStep()`。该步骤仍调用 v2 `migrateV2WorkspaceConfig()`，并且只用 v2 marker 判断是否跳过。

`isDefaultInitializedConfig()` 允许 `siyuan` 内存在额外字段，因此 `siyuan.picgoMigration.version="v3.0-unified-async-config-source"` 不会阻止它把 workspace 判断为“默认初始化配置”。当 workspace 是默认值 + v3 marker，且 home `picgo.cfg.json` 存在时，v2 helper 会 copy home 文件覆盖 workspace，可能丢失 v3 marker。

证据：

- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:484-490`：v3 facade flush 后执行 legacy compatibility step。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:504-507`、`:535-539`：跳过条件只识别 `getSiyuanPicGoMigrationVersion()`，当前仍是 v2 marker。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:42-69`：`isDefaultInitializedConfig()` 不检查 `siyuan.picgoMigration`，默认值 + v3 marker 仍可能返回 true。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:164-172`：默认 workspace + home 存在时执行 `fs.copyFileSync(homeConfigPath, workspaceConfigPath)`。

影响：

- 默认/空配置场景中，v3 marker 可能被 v2 copy 覆盖，导致下次启动重复 v3 migration。
- 该步骤还保留“external-picgo-cfg.json 继续使用本机”的旧注释语义，容易误导后续维护。

### P2：facade `instanceKey` 不包含完整 storage/workspace identity

OpenSpec design 要求 facade instanceKey 至少包含 `apiUrl`、owner file path、runtime storage kind、workspace identity 和 path overrides，用于避免不同 owner files 共享 stale facade state。

当前 facade 的 `instanceKey` 只有：

```ts
{ apiUrl, configPath }
```

证据：`libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:154-157`。

影响：当前代码没有全局 facade registry，实际 stale 风险被 `SiyuanPicGo` 外层 singleton key 部分缓解；但 public `ReadyUnifiedPicGoConfigFacade.instanceKey` 与 OpenSpec contract 不一致，后续若引入 facade cache 会埋隐患。

## 可直接交给 agent 的修复 prompt

```text
你在 /Volumes/workspace/mydocs/siyuan-plugins/siyuan-plugin-picgo 工作。请继续修复 OpenSpec 变更 picgo-3-unified-async-config-source 的复审偏离。禁止 mock/占位实现；不确定版本发布策略或 SiYuan PC 物理路径时先向用户确认。本次只改真实实现、测试、审计脚本/文档，不要用跳过测试应付。

必须先读取：
- openspec/changes/picgo-3-unified-async-config-source/{proposal.md,design.md,tasks.md}
- openspec/changes/picgo-3-unified-async-config-source/specs/**/spec.md
- docs/audits/2026-06-23-picgo-3-unified-async-config-source-latest-code-audit.md
- docs/audits/2026-06-23-picgo-3-unified-async-config-source-post-fix-audit.md

修复目标：

1) 修复 facade `retryMigration(domains?)` 的 domain-scoped 语义
- `ReadyUnifiedPicGoConfigFacade.retryMigration(domains?)` 必须调用或等价实现 `V3MigrationService.retryV3Migration(options, domains)`，而不是通过 `runV3Migration()` 顺带重试所有 failed domains。
- 指定 domains 时，只重试指定 domain；未指定时只重试当前 failed domains。
- successful/imported/skipped domains 的 `importedSources` 不得被清空或改写。
- retry 后仍要把 ownerFileData 写回 facade state、persist v3 marker、flush/reload 行为保持。
- 补充 core 单测：构造两个 failed domains，调用 `retryMigration(["siyuanConnection"])` 后另一个 failed domain 仍保持 failed/error/importedSources，不触发迁移。
- 补充 zhi 产品桥接测试：`SiyuanPicgoPostApi.retryConfigMigration([domain])` 将 domain 参数原样传给 facade，返回最新 v3 state。

2) 修复 SiYuan PC/Node 侧三 owner file 物理路径映射
- 不要在 `hasNodeEnv` 分支对所有 logical key 直接 `new JSONAdapter(path)`。
- 当存在 SiYuan workspaceDir 时，Node/SiYuan PC 也必须将：
  - `universal-picgo/picgo.cfg.json` / configPath -> `<workspace>/data/storage/syp/picgo/picgo.cfg.json`
  - `universal-picgo/external-picgo-cfg.json` -> `<workspace>/data/storage/syp/picgo/external-picgo-cfg.json`
  - `siyuan-cfg` -> `<workspace>/data/storage/syp/siyuan-cfg.json`
  映射到 JSONAdapter 绝对路径。
- 只有 standalone/no workspace 的 PC-only runtime artifact 或明确非 user-config logical key 才落到 local `baseDir/pluginBaseDir`。
- 保留 Web/Docker Kernel factory 通过 `SiYuanKernelStorageAdapter` 的三 owner mapping。
- 补充 zhi-siyuan-picgo 单测：mock `hasNodeEnv=true`、workspaceDir 存在，捕获 factory 对三个 logical key 生成的 JSONAdapter path，断言 external 与 `siyuan-cfg` 均为 workspace owner file。
- 更新 `scripts/picgo-internal-refactor-audit.cjs`：增加 Node/SiYuan PC 三 owner mapping gate，防止只检查 Kernel branch 字符串。

3) 修复 v2 legacy runtime compatibility step 与 v3 marker 的冲突
- v2 workspace copy helper 只能作为 v3 migration source/旧 runtime artifact 兼容，不得在 v3 facade flush marker 后覆盖 `picgo.cfg.json`。
- 建议：在运行 v3 facade 之前执行必要的 copy-only source preparation，或在 `migrateV2WorkspaceConfig()` 中识别 v3 marker 并跳过 destructive copy；`isDefaultInitializedConfig()` 应把存在 `siyuan.picgoMigration.version="v3.0-unified-async-config-source"` 的 workspace 视为非可覆盖。
- 删除或更新 `updateConfig()` 中“external-picgo-cfg.json 继续使用本机”的旧注释，避免与 v3 contract 冲突。
- 补充 zhi-siyuan-picgo 单测：workspace 为默认值 + v3 marker、home 默认/旧文件存在时，不调用 `copyFileSync` 覆盖 workspace；v3 marker 保留。

4) 完善 facade `instanceKey`
- 将 `createUnifiedPicGoConfigFacade()` 的 `instanceKey` 扩展为包含 apiUrl、configPath、external owner logical/physical key、siyuan owner logical/physical key、storage mode/kind、workspaceDir、baseDir/runtimeDir、pluginBaseDir、zhiNpmPath 等不含敏感值的信息。
- 不要把 password/cookie/picListApiKey/uploader token 写入 instanceKey 或日志。
- 补充单测锁定 instanceKey 包含 storage/workspace identity 且不包含敏感字段。

验证必须全部运行并记录到 docs/audits：
- pnpm --filter universal-picgo-store build
- pnpm --filter universal-picgo build
- pnpm --filter zhi-siyuan-picgo build
- pnpm --filter picgo-plugin-app build
- pnpm --filter picgo-plugin-bootstrap build
- pnpm --filter universal-picgo-store exec vitest run
- pnpm --filter universal-picgo exec vitest run
- pnpm --filter zhi-siyuan-picgo exec vitest run
- pnpm audit:picgo-refactor
- openspec validate picgo-3-unified-async-config-source --strict
- openspec validate --all --strict

最后更新 docs/audits/，说明每个偏离的修复证据、测试证据和剩余风险。
```

---

## 二次修复记录（2026-06-23）

结论：本轮已完成复审剩余 4 项偏离的针对性修复，并补强 `pnpm audit:picgo-refactor` v3 gate。基于本轮验证结果，`picgo-3-unified-async-config-source` 当前不再存在已知阻断性偏离；可进入归档前人工 review。版本号仍保持 `2.1.1`：按用户确认，发布 GitHub Action 会自动 bump 到 3.0，本次不手工改包版本。

### 修复项与代码证据

1. **`retryMigration(domains?)` 改为真正 domain-scoped**
   - `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts`
     - 新增 `retryV3MigrationInternal(...)`，通过 `retryMigrationService(migrationOptions, domains)` 调用 `V3MigrationService.retryV3Migration(options, domains)`。
     - `ReadyUnifiedPicGoConfigFacade.retryMigration(domains?)` 不再调用全量 `runV3MigrationInternal()`，只重试指定 domains；未指定时由 service 只选择当前 failed domains。
     - retry 后写回 owner file data、持久化 v3 marker，并保留 failed/unrelated domains 的状态和错误。
   - `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.spec.ts`
     - 新增两个 failed domains 场景：调用 `retryMigration(["externalPicList"])` 只导入 external，`picgoSettings` 保持 failed/error，且 settings 未被写入。

2. **SiYuan PC/Node 三 owner file 映射到 workspace**
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts`
     - `resolveSiyuanPicGoPaths()` 解析 `configPath`、`externalConfigPath`、`siyuanConnectionConfigPath`、`workspaceDir`。
     - 新增 `getWorkspacePicGoExternalConfigPath()`、`getWorkspaceSiyuanConnectionConfigPath()`、`resolveSiyuanPicGoOwnerFilePath()`。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts`
     - Node 分支改为 `createNodeWorkspaceFactory(paths)`，将三个 logical keys 映射到 workspace 绝对路径后创建 `JSONAdapter`。
     - Kernel/Web 分支保留通过 `SiYuanKernelStorageAdapter` 的三 owner mapping。
   - `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts`
     - runtime fallback 的 Node adapter resolution 也支持三 owner workspace path overrides。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.spec.ts`
     - 覆盖三 owner logical key 到 workspace physical file 的映射。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts`
     - 更新 v2 legacy compatibility 注释/日志，明确 external/siyuan-cfg 已由 v3 facade 进入 workspace；本步骤只保留 main-config copy source/runtime 兼容。

3. **v2 legacy copy 不再覆盖 v3 marker**
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts`
     - 新增 `hasV3MigrationMarker()`。
     - `isDefaultInitializedConfig()` 遇到 `siyuan.picgoMigration.version="v3.0-unified-async-config-source"` 返回 false。
     - `migrateV2WorkspacePicGoConfig()` 若 workspace 已有 v3 marker，直接跳过 copy。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.spec.ts`
     - 覆盖 workspace 默认值 + v3 marker + home config 存在时不调用 `copyFileSync`，workspace marker 保留。

4. **facade `instanceKey` 补齐 storage/workspace/owner identity 且不含敏感值**
   - `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts`
     - `createFacadeInstanceKey(options, ownerFiles)` 包含 `apiUrl`、storage factory、每个 owner 的 logicalKey/storageKind/mode/domains、workspaceDir/homeDir、path overrides（config/external/siyuan/base/runtime/plugin/zhi）。
     - 不包含 `password`、`cookie`、`picListApiKey` 或 uploader token。
   - `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.spec.ts`
     - 覆盖 instanceKey 包含三 owner identity 与 workspace identity，并断言不包含 password/cookie/picListApiKey。
   - `libs/Universal-PicGo-Core/src/config/index.ts`、`libs/Universal-PicGo-Core/src/index.ts`
     - 导出 `UNIFIED_CONFIG_MIGRATION_VERSION`，便于统一使用 v3 marker 常量。

5. **审计脚本 gate 补强**
   - `scripts/picgo-internal-refactor-audit.cjs`
     - 新增 gate：facade retry 必须调用 domain-scoped retry，不能在 retry body 中调用 full migration。
     - 新增 gate：instanceKey 必须含 storage/workspace/owners/logicalKey/storageKind/domains，且不含 sensitive 字段名。
     - 新增 gate：zhi paths/runtime 必须含 Node workspace 三 owner mapping、v3 marker 防覆盖和 explicit external/siyuan path fields。
     - 保留已修正的 v3 gates：legacy localStorage、Lsky key、direct ExternalPicgoConfigDb、Kernel `/api/file/`、PicList `MASK_VALUE` 等。

### 最终验证结果

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter universal-picgo-store build` | ✅ 通过 |
| `pnpm --filter universal-picgo build` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo build` | ✅ 通过 |
| `pnpm --filter picgo-plugin-app build` | ✅ 通过；仅 `LC_ALL`、Node `DEP0180`、chunk size warning |
| `pnpm --filter picgo-plugin-bootstrap build` | ✅ 通过 |
| `pnpm --filter universal-picgo-store exec vitest run` | ✅ 2 files / 9 tests |
| `pnpm --filter universal-picgo exec vitest run` | ✅ 19 files / 190 tests |
| `pnpm --filter zhi-siyuan-picgo exec vitest run` | ✅ 5 files / 21 tests |
| `pnpm audit:picgo-refactor` | ✅ 通过；`contract` / `boundaries` / `v3-unified-config` / `bundle` 均 ok |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |
| `pnpm --filter universal-picgo exec tsc --noEmit` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo exec tsc --noEmit` | ✅ 通过 |

### 剩余风险 / 说明

- 版本号不手工 bump：当前源码仍是 `2.1.1`，按用户确认由发布 GitHub Action 自动 bump 到 3.0。
- `picgo-plugin-app build` 的 chunk size、`LC_ALL` 与 Node `DEP0180` 为既有构建警告，不影响本次配置契约验证。
- 建议归档前做一次人工 diff review，重点看 v3 owner path mapping 与 migration retry 语义是否符合预期发布策略。
