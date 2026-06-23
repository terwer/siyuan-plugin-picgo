# picgo-3-unified-async-config-source 最新代码审计

- 审计时间：2026-06-23
- 审计对象：最新提交 `ea8d067 fix(core): ensure ExternalPicgoConfigDb defaults survive async load overwrite`
- 审计范围：OpenSpec 变更 `picgo-3-unified-async-config-source`、`libs/Universal-PicGo-*`、`libs/zhi-siyuan-picgo`、`packages/picgo-plugin-*`、现有审计脚本与 grep/build/test 门禁。
- 结论：**未达到“无偏离可归档”状态**。核心构建、单测、OpenSpec validate 与主要 grep gates 通过，但仍存在 v3 migration 产品接线、per-domain migration 语义、敏感 mask 统一值、审计脚本过期、版本定位五类偏离/风险。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| `pnpm --filter universal-picgo-store build` | ✅ 通过 |
| `pnpm --filter universal-picgo build` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo build` | ✅ 通过 |
| `pnpm --filter picgo-plugin-app build` | ✅ 通过（仅 locale / Node deprecation / chunk size warning） |
| `pnpm --filter picgo-plugin-bootstrap build` | ✅ 通过 |
| `pnpm --filter universal-picgo-store exec vitest run` | ✅ 2 files / 9 tests |
| `pnpm --filter universal-picgo exec vitest run` | ✅ 19 files / 183 tests |
| `pnpm --filter zhi-siyuan-picgo exec vitest run` | ✅ 4 files / 17 tests |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |
| `pnpm audit:picgo-refactor` | ❌ 失败；脚本仍包含旧 v2/旧版本断言，需要更新为 v3 gate |

## Grep gates

| Gate | 结果 |
| --- | --- |
| legacy main config `window.localStorage.getItem("universal-picgo/picgo.cfg.json")` | ✅ `libs packages` source 无命中 |
| legacy Lsky token key `siyuan_picgo_plugin_lsky_token` | ✅ 仅 `V3MigrationService.ts` 与 spec 命中 |
| 非 spec 生产路径 direct `ExternalPicgoConfigDb` construction | ✅ 无命中 |
| Kernel owner file direct `/api/file/` | ✅ 无命中 |
| v3 PicList 非空默认 URL | ✅ 无生产默认命中；`DefaultRecognition.ts` 的 `https://example.com/upload` 仅为旧 generated default recognizer |

## 偏离项

### P1：v3 migration state / retry 未接入产品 UI 与 lifecycle

OpenSpec 要求 v3 migration marker 具备 global/per-domain state，并通过明确 `retryMigration(domains?)` 路径重试 failed domain。当前 core facade 已有 v3 API，但 zhi/app 层仍展示和重试旧 v2 marker。

关键证据：

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:553`：v3 `retryMigration(domains?)` 已存在。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoMigrationState.ts:27`：仍定义 `MIGRATION_VERSION = "v2.0"`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:131`：`getConfigMigrationState()` 返回旧 `siyuanPicgoMigrationState` snapshot。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:155-161`：`retryConfigMigration()` 调用旧 `ensureConfigInitialized(true)`，不是 facade `retryMigration()`。
- `packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue:29,90`：设置页读取/重试的也是旧 snapshot。

影响：

- `createUnifiedPicGoConfigFacade()` 内部 v3 migration 如果失败，状态只存在于 facade/owner marker；设置页不会展示真实 v3 failed domains。
- 用户点击“重试初始化”不会重试 v3 failed domains，违反 OpenSpec 的 explicit retry 语义。

### P1：`picgo.cfg.json` 共享 owner 的 migration default recognition 不是 per-domain

`V3MigrationService.migrateDomain()` 当前对 `picgoMain`、`picgoSettings`、`siyuanBehavior`、`pluginValues`、`uploaderConfig` 都把整份 `picgo.cfg.json` 传给 `classifyDomainDefaults()`。`DefaultRecognition.ts` 又对这些 domain 统一调用 `isPicgoMainGeneratedDefault(data)`。

关键证据：

- `libs/Universal-PicGo-Core/src/config/V3MigrationService.ts:333-339`：按 domain 调用 classification，`user-data` 即跳过 legacy import。
- `libs/Universal-PicGo-Core/src/config/DefaultRecognition.ts:181-185`：多个共享 owner domain 统一使用 `isPicgoMainGeneratedDefault(data)`。

影响：

- 若 v3 owner file 只有 `siyuan.autoUpload=false` 这类 behavior 用户数据，但 legacy 中还有 `picgoPlugins.*` 或 uploader config，则 `pluginValues/uploaderConfig` 会被误判为已有 user data，导致缺失域不导入。
- 这与 OpenSpec 的 per-domain conflict priority、default-generated 识别、unknown field 保留要求不一致。

### P2：PicList API key 日志 mask 值不是统一 `******`

关键证据：

- `libs/Universal-PicGo-Core/src/core/PicListUploader.ts:79`：`requestUrl.replace(apiKey, "***")`。
- OpenSpec `design.md` 要求 mask 输出统一使用 `******`。

影响：

- 当前不会输出原始 `picListApiKey`，但 mask 表达不符合统一契约，且没有单测锁定 PicList log mask。

### P2：根审计脚本仍是旧 contract，会产生误导性红灯

`pnpm audit:picgo-refactor` 当前失败，且失败项明显来自旧 v2/旧版本规则：

- `plugin.json version changed: expected 1.12.1, got 2.1.1`
- `bootstrap paste listener must call tryTakeoverWithConfig before async SiyuanPicGo.getInstance`
- `ExternalPicgoConfigDb must store external-picgo-cfg.json under ctx.pluginBaseDir`
- v2 path contract 仍要求部分旧 log 字符串。

影响：

- 当前脚本没有表达 v3 “prewarm ready snapshot before listener registration”“external/PicList workspace owner”“v3 migration state/retry”等核心验收项。
- 继续保留会让 CI/人工审计误判。

### P2 / 发布风险：版本仍为 `2.1.1`

OpenSpec 将该变更定位为 PicGo plugin 3.0 breaking change；当前 `package.json`、各 workspace package、`plugin.json` 仍为 `2.1.1`。

如果版本提升属于本 change，则这是 release contract 偏离；如果版本提升另有发布任务，应在 tasks/audit/release plan 中明确排除，避免以 2.x 形式发布 breaking config API。

## 可直接交给 agent 的修复 prompt

```text
你在 /Volumes/workspace/mydocs/siyuan-plugins/siyuan-plugin-picgo 工作。请修复 OpenSpec 变更 picgo-3-unified-async-config-source 最新审计偏离，禁止引入 mock/占位实现；如果版本发布范围不明确，先向用户确认是否本 change 负责 3.0.0 版本提升。

必须先读取：
- openspec/changes/picgo-3-unified-async-config-source/{proposal.md,design.md,tasks.md}
- openspec/changes/picgo-3-unified-async-config-source/specs/**/spec.md
- docs/audits/2026-06-23-picgo-3-unified-async-config-source-latest-code-audit.md

修复目标：

1) 接通 v3 migration state/retry 到 zhi-siyuan-picgo 与设置页
- 不再让设置页和 SiyuanPicGo.checkConfigMigration 依赖 v2-only `siyuanPicgoMigrationState.ts` 判断 v3 初始化结果。
- `SiyuanPicgoPostApi.getConfigMigrationState()` 应返回 facade `getMigrationState()` 的真实 v3 状态，或提供新的 async API 并同步更新调用方；UI 必须能展示 v3 failed/global/per-domain 错误。
- `SiyuanPicgoPostApi.retryConfigMigration()` 必须调用 `ReadyUnifiedPicGoConfigFacade.retryMigration(domains?)`，随后 flush/reload，并返回最新 v3 state。
- 保留 v2 copy/runtime migration helper 只能作为 legacy data/runtime artifact 兼容步骤，不得伪装成 v3 migration 完成状态。
- 增加/更新 zhi-siyuan-picgo 或 app 层测试：模拟 facade migration failed，设置页/产品 API 能读到 failed；调用 retry 后确实触发 facade.retryMigration，successful domains 不被清空。

2) 修复 V3MigrationService 的 per-domain default recognition
- 不要对所有 `picgo.cfg.json` 共享 domain 使用整份 owner file 的 `isPicgoMainGeneratedDefault()` 结果。
- 为 `picgoMain`、`picgoSettings`、`siyuanBehavior`、`pluginValues`、`uploaderConfig`、`lskyState` 分别提取/判断 domain slice：
  - `picgoMain`：uploader/current 等主选择与主配置。
  - `picgoSettings`：`settings.*`。
  - `siyuanBehavior`：`siyuan.waitTimeout/retryTimes/autoUpload/replaceLink/txtImageSwitch`，忽略 `siyuan.picgoMigration`。
  - `pluginValues`：`picgoPlugins.*` 与 plugin config paths。
  - `uploaderConfig`：`picBed.<uploader>` 用户凭证/配置，不把其他 domain 的用户数据当作本 domain 已存在。
  - `lskyState`：仍只看 `uploader.lsky.token`。
- 应用 legacy data 时只填充目标 domain 缺失/generated-default 部分，保留同 owner file 内其他 domain 的现有 user data 和 unknown fields。
- 增加回归测试：v3 owner 只有 `siyuan.autoUpload=false`，legacy 有 `picgoPlugins.plugin-x=true` 时，migration 应导入 pluginValues 并保留 `autoUpload=false`；v3 owner 有真实 uploader 配置但 legacy 有 settings 时，只导入缺失 settings，不覆盖 uploader。

3) 统一 PicList API key log mask
- 将 `libs/Universal-PicGo-Core/src/core/PicListUploader.ts` 中 `requestUrl.replace(apiKey, "***")` 改为统一 `******`（优先复用 `MASK_VALUE`）。
- 增加单测确保 debug log 不包含原始 `picListApiKey`，且包含 `******`。

4) 更新 `scripts/picgo-internal-refactor-audit.cjs`
- 去掉/改写旧 v2/旧版本断言：`expected 1.12.1`、paste listener 内旧时序、external-picgo 只能 pluginBaseDir、本次 v3 已 supersede 的 main-config-only 边界。
- 增加 v3 gate：legacy main localStorage production read 为 0；Lsky legacy key 只在 migration/test；生产路径无 direct `ExternalPicgoConfigDb` route decision；Kernel owner file 无 `/api/file/` direct access；设置页/产品 API 使用 v3 facade migration state/retry；PicList log mask 为 `******`；v3 owner files 包含 main/external/siyuan-cfg 三路映射。
- 修复后 `pnpm audit:picgo-refactor` 必须通过。

5) 版本定位
- 如果用户确认本 change 包含 3.0 发布准备：统一更新根 `package.json`、workspace package、`plugin.json`、必要 changelog/构建产物版本到 3.0.0。
- 如果用户确认版本提升另有任务：在 OpenSpec tasks 或 docs/audits 中明确“版本 bump out of scope”，并保留发布前阻断说明。

验证必须运行并记录：
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

最后更新 docs/audits/，列出修复点、证据、命令结果和剩余风险。
```


---

## 修复记录（2026-06-23）

结论：本轮已完成审计偏离的针对性修复；`pnpm audit:picgo-refactor` 已更新为 v3 gate 并通过。版本号不在本次手工修复中修改：PicGo 3.0 定位保留在 OpenSpec/文案中，实际 `3.0.0` 版本 bump 由发布 GitHub Action 自动处理，当前仓库内 `2.1.1` 不再作为本 change 的手工阻断项。

### 已修复

1. **v3 migration state / retry 接入产品 UI 与 lifecycle**
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts`
     - `getConfigMigrationState()` 改为读取 ready facade snapshot 中的真实 v3 `migration`。
     - 新增/接通 async `getConfigMigrationStateAsync()`。
     - `retryConfigMigration(domains?)` 改为调用 `ReadyUnifiedPicGoConfigFacade.retryMigration(domains?)`，随后 `flush()` / `reload()` / `ctx.reloadConfigAsync()`，返回最新 v3 state。
     - legacy v2 runtime copy/helper 保留为兼容步骤，不再作为 UI migration state 或 retry 判定来源。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts`
     - lifecycle 失败提示现在汇总 v3 global/per-domain errors。
   - `packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue`
     - 设置页展示 v3 failed domains 与 domain error，并继续通过产品 API 明确 retry。
   - `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.spec.ts`
     - 覆盖产品 API 读取 failed v3 state、retry 调用 facade.retryMigration、successful domain importedSources 不被清空。

2. **`picgo.cfg.json` 共享 owner migration 改为 per-domain 判断与应用**
   - `libs/Universal-PicGo-Core/src/config/DefaultRecognition.ts`
     - `picgoMain`、`picgoSettings`、`siyuanBehavior`、`pluginValues`、`uploaderConfig`、`lskyState` 分域识别 generated-default/user-data。
     - `siyuanBehavior` 只看 `waitTimeout/retryTimes/autoUpload/replaceLink/txtImageSwitch`，忽略 `siyuan.picgoMigration`。
     - `pluginValues`、`uploaderConfig` 不再被其他 shared-owner domain 的用户数据阻断。
   - `libs/Universal-PicGo-Core/src/config/V3MigrationService.ts`
     - legacy data 应用前提取目标 domain slice；只写入目标 domain 缺失/generated-default 部分，保留同 owner file 内其他 domain 的现有用户数据与 unknown fields。
   - `libs/Universal-PicGo-Core/src/config/DefaultRecognition.spec.ts`、`V3MigrationService.spec.ts`
     - 增加回归：v3 owner 仅有 `siyuan.autoUpload=false` 时仍导入 legacy `picgoPlugins.plugin-x=true` 并保留 `autoUpload=false`。
     - 增加回归：v3 owner 有真实 uploader config 时，legacy settings 可导入且不覆盖 uploader token。

3. **PicList API key 日志 mask 统一为 `******`**
   - `libs/Universal-PicGo-Core/src/core/PicListUploader.ts`
     - `requestUrl.replace(apiKey, MASK_VALUE)` 替换旧 `***`。
   - `libs/Universal-PicGo-Core/src/core/PicListUploader.spec.ts`
     - 覆盖 debug log 不包含原始 `picListApiKey`，且包含统一 mask 值 `******`。

4. **`pnpm audit:picgo-refactor` 更新为 v3 gate**
   - `scripts/picgo-internal-refactor-audit.cjs`
     - 移除旧 `expected 1.12.1`、旧 paste listener 时序、external 只能 pluginBaseDir、v2 main-config-only 等过期断言。
     - 新增 v3 gates：legacy main localStorage production read、Lsky legacy key 范围、direct `ExternalPicgoConfigDb` route decision、Kernel `/api/file/` direct access、v3 facade migration state/retry、PicList `MASK_VALUE`、main/external/siyuan-cfg 三 owner mapping。

### 验证结果

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter universal-picgo-store build` | ✅ 通过 |
| `pnpm --filter universal-picgo build` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo build` | ✅ 通过 |
| `pnpm --filter picgo-plugin-app build` | ✅ 通过（仅 locale / Node deprecation / chunk size warning） |
| `pnpm --filter picgo-plugin-bootstrap build` | ✅ 通过 |
| `pnpm --filter universal-picgo-store exec vitest run` | ✅ 2 files / 9 tests |
| `pnpm --filter universal-picgo exec vitest run` | ✅ 19 files / 188 tests |
| `pnpm --filter zhi-siyuan-picgo exec vitest run` | ✅ 5 files / 19 tests |
| `pnpm audit:picgo-refactor` | ✅ 通过；v3-unified-config gate ok |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |

### 剩余风险 / 发布说明

- 当前源码版本仍为 `2.1.1`，这是有意保留：发布时由 GitHub Action 自动 bump 到 3.0 版本；不在本次手工修复中改 package/plugin 版本。
- `picgo-plugin-app build` 仍有既有 chunk size warning 与 Node deprecation warning，不影响本轮 v3 config contract 验收。
