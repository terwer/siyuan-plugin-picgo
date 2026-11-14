# picgo-3-unified-async-config-source 二次修复后最终复审（2026-06-24）

## 结论

- 审计对象：最新提交 `5872136 docs(audit): add comprehensive audit reports for picgo-3-unified-async-config-source`，工作区审计前后均为 clean。
- 结论：**未发现新的阻断性偏离**。前次复审提出的 4 项剩余偏离均已修复，并已通过 build / test / audit / OpenSpec 严格验证。
- 建议：可进入归档前人工 diff review；若人工 review 无异议，可以归档 `picgo-3-unified-async-config-source`。

## 前次偏离复核

### 1. `retryMigration(domains?)` 已改为 domain-scoped

证据：

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:346-353`
  - 新增 `retryV3MigrationInternal(...)`，通过 `retryMigrationService(migrationOptions, domains)` 调用 service 层 domain-scoped retry。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:646-660`
  - `ReadyUnifiedPicGoConfigFacade.retryMigration(domains?)` 调用 `retryV3MigrationInternal(state, options, logger, domains)`，不再调用全量 `runV3MigrationInternal()`。
- `libs/Universal-PicGo-Core/src/config/V3MigrationService.ts:285-321`
  - `retryV3Migration(options, domains?)` 仅遍历 `domains` 或当前 failed domains，不清空 successful/imported/skipped domains。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.spec.ts:430-475`
  - 覆盖两个 failed domains 场景：只 retry `externalPicList` 时，`picgoSettings` 仍保持 failed/error，且 settings 未被写入。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.spec.ts:53-83`
  - 产品桥接 `retryConfigMigration([domain])` 原样调用 `facade.retryMigration(domains)`，并 flush/reload/reloadConfigAsync。

复核结果：✅ 符合 OpenSpec “只通过显式 `retryMigration(domains?)` 路径重试 failed domains，指定 domains 不影响未指定 failed domains”的要求。

### 2. SiYuan PC/Node 三 owner file 已进入 workspace 映射

证据：

- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:40-46`
  - 定义 main / external / siyuan-cfg 三个 logical key 与 Kernel path。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:168-180`
  - Node/PC 路径解析会从 workspaceDir 生成 `configPath`、`externalConfigPath`、`siyuanConnectionConfigPath`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts:139-167`
  - Node 分支使用 `createNodeWorkspaceFactory(paths)`，三 owner logical key 映射为 workspace 绝对路径后创建 `JSONAdapter`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts:171-199`
  - Web/Docker Kernel 分支继续使用 `SiYuanKernelStorageAdapter`，且三 owner key 均映射到 Kernel owner path。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:128-149`
  - core fallback 的 Node adapter resolution 也支持三 owner workspace path overrides。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.spec.ts:46-70`、`:97-118`
  - 覆盖 workspace 三 owner path 解析与 logical key → physical file 映射。

复核结果：✅ 修复了前次 “Node 分支只同步 main config，external 与 `siyuan-cfg` 可能落到相对 logical key” 的偏离。

### 3. v2 legacy copy 不再覆盖 v3 marker

证据：

- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:48-58`
  - `isDefaultInitializedConfig()` 遇到 `siyuan.picgoMigration.version="v3.0-unified-async-config-source"` 返回 false。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:125-136`
  - 新增 `hasV3MigrationMarker()`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts:235-242`
  - `migrateV2WorkspacePicGoConfig()` 在 workspace 已存在 v3 marker 时直接跳过 legacy copy。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.spec.ts:322-331`
  - 覆盖“默认 workspace + v3 marker + home config 存在”场景，不调用 `copyFileSync` 且 workspace marker 保留。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:514-520`
  - 注释已明确 v3 owner files 由 unified facade 映射到 workspace，legacy step 仅保留 v2 main-config source/runtime 兼容。

复核结果：✅ 修复了 v3 facade flush 后被 v2 compatibility copy 覆盖 marker 的风险。

### 4. facade `instanceKey` 已包含 storage/workspace/owner identity，且不含敏感值

证据：

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:488-517`
  - `createFacadeInstanceKey(options, ownerFiles)` 包含 `apiUrl`、storage factory、每个 owner 的 `logicalKey/storageKind/mode/domains`、workspaceDir/homeDir 以及 path overrides。
  - 该函数体不引用 `password`、`cookie`、`picListApiKey`。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.spec.ts:325-356`
  - 单测断言 instanceKey 包含 workspace 与三 owner identity，并断言不包含 password/cookie/picListApiKey。
- `scripts/picgo-internal-refactor-audit.cjs:284-290`
  - 审计脚本 gate 检查 instanceKey identity 字段，并禁止 sensitive 字段名进入 instanceKey body。

复核结果：✅ 符合 OpenSpec “instanceKey 至少包含 apiUrl、owner file path、runtime storage kind、workspace identity 和 path overrides”的要求。

## Forbidden grep gates

| Gate | 结果 |
| --- | --- |
| production legacy main `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` | ✅ 无命中 |
| legacy Lsky key `siyuan_picgo_plugin_lsky_token` | ✅ 仅 `V3MigrationService.ts` migration source 与 spec/test fixture |
| 非 spec 生产路径 direct `ExternalPicgoConfigDb` construction | ✅ 无命中 |
| owner file direct `/api/file/` access | ✅ `libs packages` 生产源码无命中 |
| PicList API key log mask | ✅ `requestUrl.replace(apiKey, MASK_VALUE)`，`MASK_VALUE="******"` |
| Node/Kernel 三 owner mapping | ✅ main / external / siyuan-cfg 均有 workspace/Kernel mapping 与 gate |

## 验证结果（2026-06-24）

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
| `pnpm audit:picgo-refactor` | ✅ `contract` / `boundaries` / `v3-unified-config` / `bundle` 均 ok |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |
| `pnpm --filter universal-picgo exec tsc --noEmit` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo exec tsc --noEmit` | ✅ 通过 |

## 剩余说明

- 版本号仍为 `2.1.1`：沿用前次审计结论，按用户确认由发布 GitHub Action 自动 bump 到 3.0，本次不作为手工阻断项。
- `picgo-plugin-app build` 的 chunk size、`LC_ALL` 与 Node `DEP0180` 仍是既有构建警告，不影响本次配置契约验证。
- 本轮未修改业务代码，仅新增该复审文档并更新规划记录。
