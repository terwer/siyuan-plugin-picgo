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

## 2026-06-24 二次修复后最终复审完成
- 用户表示已改完并要求继续审计；本轮基于最新 clean 工作区与提交 `5872136` 复核前次 4 项偏离。
- 复核结果：`retryMigration(domains?)` 已走 `retryV3Migration` domain-scoped；SiYuan PC/Node 三 owner file 已映射到 workspace；v2 legacy copy 已识别 v3 marker 并跳过覆盖；facade `instanceKey` 已包含 storage/workspace/owner identity 且不含敏感字段。
- 验证通过：5 个 build；store/universal/zhi vitest（9/190/21）；`pnpm audit:picgo-refactor`；OpenSpec change/all strict；universal-picgo 与 zhi-siyuan-picgo `tsc --noEmit`。
- 新增审计文档：`docs/audits/2026-06-24-picgo-3-unified-async-config-source-final-reaudit.md`。结论：未发现新的阻断性偏离，可进入归档前人工 diff review。

## 2026-06-24 真机测试日志分析
- 用户完成 PC 与网页可用 SiYuan API 两个核心场景测试，动作仅为点击 popup。
- 两个场景均能显示用户此前 PC 保存的 `static-rs-terwer`，用户确认这代表插件确实读取了真实 Kernel owner file，而不是浏览器 mock/localStorage。
- 共同问题：初始化过程中 `updateConfig -> ctx.removeConfig("siyuan", "proxy") -> updatePicGoConfig -> auto-flush` 触发对 `/data/storage/syp/picgo/picgo.cfg.json` 的 Kernel 写入，随后报 `saveTextData failed: unknown error`。
- 初判根因：`SiYuanKernelStorageAdapter.write()` 将 `SiyuanKernelApi.saveTextData()` 返回值当作完整 `{code}` 判断；但 `zhi-siyuan-api` 的 `saveTextData -> putFile -> siyuanRequestForm` 成功时返回的是 `data`（常见为 null），不是完整 `SiyuanData`，导致成功写也可能被误判失败。
- 决策：问题局部、证据清楚、可通过单测覆盖，适合当前 agent 直接修，不需要另派新 agent。

## 2026-06-24 真机问题修复完成
- 已采纳用户补充：`static-rs-terwer` 是旧 PC 保存值，能出现即证明读取真实 Kernel owner file；本轮不再按“浏览器 mock/localStorage”方向排查。
- 进一步确认触发条件：用户只点击 popup，但真实 workspace `picgo.cfg.json` 中已无 `"proxy"` 字段；`UniversalPicGo.removeConfig("siyuan", "proxy")` 对缺失字段仍会调用 `unifiedConfigFacade.updatePicGoConfig()`，因此每次初始化都会无意义 schedule Kernel 写入。
- 已修复 `UniversalPicGo.removeConfig()`：先对内存 config 执行 `unsetByPath()`，只有实际删除成功才调用 facade/db 写入；缺失 legacy 字段现在是 no-op。
- 已修复 `SiYuanKernelStorageAdapter.write()`：`saveTextData()` throw 会包装为结构化 Kernel write error；只有返回对象明确含数值 `code !== 0` 才视为失败；`null`/无 code 返回不再误判；并增加写后 `getFile()` 读回 JSON verification，避免吞掉真实失败。
- 补测试：`SiYuanKernelStorageAdapter.spec.ts` 覆盖 null 成功、`{code:0}` 成功、显式失败、throw 包装、null 返回但读回不一致；`UniversalPicGo.spec.ts` 覆盖缺失 legacy property 不触发 facade 写入、存在 property 触发一次写入。
- 验证通过：`universal-picgo` vitest 19 files / 192 tests；`zhi-siyuan-picgo` vitest 6 files / 26 tests；`universal-picgo` 与 `zhi-siyuan-picgo` `tsc --noEmit`；`universal-picgo`/`zhi-siyuan-picgo` build；`pnpm audit:picgo-refactor`；OpenSpec change/all strict；`pnpm package`。
- 新增固化文档：`docs/audits/2026-06-24-picgo-3-unified-async-config-source-real-device-popup-fix.md`。

## 2026-06-24 修复后真机日志评估
- 读取用户提供的新日志：`docs/tests/PC_init.txt`、`docs/tests/PC_popup.txt`、`docs/tests/网页_init.txt`、`docs/tests/网页_popup.txt`。
- PC init：启用插件后无点击，走 Node/sync workspace 文件路径，三 owner loaded、v3 migration done、v3 marker skip legacy copy、paste snapshot ready；未出现 Kernel write、auto-flush failed、saveTextData failed 或 ERROR。
- PC popup：弹窗打开后走 browser/Kernel async adapter，main/siyuan-cfg/external 三 owner 均从 `/data/storage/syp/...` 读取成功；未出现 `writing to`、`auto-flush failed`、`saveTextData failed`；说明缺失 `siyuan.proxy` no-op 修复命中。
- 网页 init：网页场景在插件预热阶段即走 Kernel async adapter 读取三 owner，ready 成功；没有 PicGo 配置写入错误。日志中的 font CORS/ERR_FAILED 来自思源字体资源 `siyuan.wiki`，非 PicGo 配置链路。
- 网页 popup：文件内容与 `网页_init.txt` 完全一致（`cmp_exit=0`），没有单独捕获到 popup 打开后的新增日志；只能证明 init 阶段正常，不能用该文件单独评估 popup 行为。
- 决策：当前修复有效，不需要新的 agent。若需要继续收口，建议只补一次“网页 popup 打开后清空 console 再采集”的日志，确认 popup 是否产生新增读写；不是当前阻断。

## 2026-06-24 真 async / fake flush 专项代码审计
- 用户明确要求不要只看核心场景覆盖率，要判断当前代码本身是不是“全部真实全异步链路”，否则作为重大偏离/技术债。
- 审计确认底层是真 async：`SiYuanKernelStorageAdapter` 通过 `await getFile/saveTextData` 和写后 verify 读回；`JSONStore` async adapter 有 `waitReady/refreshAsync/flush` 且 `flush()` 会清理自身 pending timer；`SiyuanPicgoPostApi.initInternal()` await ready facade 和初始 flush 后 attach。
- 同时发现 facade 层 P1 语义缺口：`UnifiedConfigFacade.update*Config()` 只 mutation + `scheduleFlush()`；`flush()` 会 `await writeOwnerFile()`，但不 clear `state.debounceTimers`，也不管理/等待已触发 auto-flush 的 in-flight write。
- 影响：慢 Kernel `write + verify` 超过 300ms 时，显式 `await flush()` 可能与 auto-flush 并发写同一 owner；`flush()` 返回后同一次 mutation 的后台 auto-flush 仍可能继续运行并只 log 错误。
- 验证现状：`pnpm --filter universal-picgo exec vitest run src/config/UnifiedConfigFacade.spec.ts src/config/SettingsStorePattern.spec.ts` 通过 39 tests；`pnpm --filter zhi-siyuan-picgo exec vitest run src/lib/SiYuanKernelStorageAdapter.spec.ts` 通过 5 tests；`pnpm audit:picgo-refactor` 通过，但现有 gate 未覆盖 debounce/flush race。
- 已新增审计文档：`docs/audits/2026-06-24-picgo-3-unified-async-config-source-async-flush-code-audit.md`。
- 决策：不建议归档。需要修复 facade per-owner write pipeline / explicit flush drain debounce + in-flight auto-flush 后再归档。

## 2026-06-24 async flush drain 修复完成
- 已按“全部真实全异步链路并可归档”底线直接修复 `UnifiedConfigFacade` facade 层 fake/drain 缺口。
- 核心实现：每个 owner file 增加 `dirtyVersion`、`flushedVersion`、`writeQueue`、`currentWriteTask`、`currentWriteVersion`；所有 mutation/default/migration marker 统一 `markOwnerDirty()`；explicit `flush()` 先 `cancelScheduledFlush()`，再通过 `flushOwnerFile()` join 或串行写入；debounce auto-flush 也复用同一 pipeline。
- 并发语义：同一 facade 实例内，`await flush(domains?)` 会接管目标 owner 的 pending timer，并等待已触发且覆盖目标版本的 in-flight auto-flush；旧 flush 成功不会清掉期间产生的新 dirty；失败保留 dirty 供下一次 flush retry。
- 补测试：`UnifiedConfigFacade.spec.ts` 新增 fake timers + 慢 async adapter 用例，覆盖 immediate flush cancel debounce、join in-flight auto-flush、flush 中新 mutation 不被隐藏、失败后 retry。
- 补 audit gate：`scripts/picgo-internal-refactor-audit.cjs` 新增 `dirtyVersion/writeQueue/currentWriteTask`、`cancelScheduledFlush`、`flushOwnerFile`、schedule 不得直写 `writeOwnerFile` 等断言。
- 验证通过：`universal-picgo` targeted 43 tests；`universal-picgo` 全量 19 files / 196 tests；`zhi-siyuan-picgo` 全量 6 files / 26 tests；两包 `tsc --noEmit`；`pnpm audit:picgo-refactor`；OpenSpec change/all strict；`pnpm package`。
- 新增审计文档：`docs/audits/2026-06-24-picgo-3-unified-async-config-source-async-flush-fix.md`。结论：同一 facade 实例内 drainable flush 已闭环，可进入归档前人工 diff review。

## 2026-06-24 async flush 修复后收口审计
- 继续执行收口 grep：`UnifiedConfigFacade.ts` 中剩余 `dirty=true/false` 只出现在 `markOwnerDirty()`、`flushOwnerFile()` 成功/失败分支和 `reload()` 清理分支；未发现 schedule timer 直接调用 `writeOwnerFile()` 的旧入口。
- 生产 legacy grep 仅命中审计脚本自身和 `V3MigrationService.ts` 允许的 legacy Lsky migration 分支；无生产主配置 localStorage 决策读、无生产直连 Kernel owner endpoint。
- `git diff --check` 通过；`pnpm audit:picgo-refactor` 再次通过。当前修复审计结论保持：代码可归档，实际 OpenSpec archive 需用户明确确认后执行。

## 2026-06-24 README 3.0 文案更新
- 已将 `README_zh_CN.md` 主标题改为“PicGo 3.0+：配置归一化，同一工作空间内不再割裂”，直达 Docker/PC/网页在同一工作空间内配置不再割裂的核心痛点。
- 已同步更新 `README.md` 英文标题与 3.0 说明，避免继续使用泛化的“Configuration Finally Follows Along”。
- 已将 3.0 路径说明改为 workspace-backed 三类配置文件 + 本机 runtime 文件；2.0 路径并入 `历史路径` / `Historical paths`；`packages/picgo-plugin-app/README.md` 同步为 v3 路径契约。
- 已重写 last-save 边界说明为“关于极端同时编辑”，补足上下文：同一工作空间内多个 PicGo 入口同时改同一项设置才按最后保存为准，不涉及思源多工作空间。
- 已将正向代理说明改为低调、条件化表述，并补齐英文 README 对应说明：思源 API 可用时走思源内置 forward proxy，避免把跨域细节暴露给用户。
- 验证：`git diff --check` 通过；README wording scan 未再命中 `owner file`、`ready-before-use`、`flush`、旧 2.0 主标题等用户面向技术/旧文案。
- 用户将“极端同时编辑”与“多工作空间不受影响”拆成两段，转折更清晰；已同步英文 README 也拆为 About / Note 两段。
- 已按中文 README 的叙事顺序调整英文开头：先说 PicGo 3.0，再提 2.0 作为承接，避免 2.0 喧宾夺主。
