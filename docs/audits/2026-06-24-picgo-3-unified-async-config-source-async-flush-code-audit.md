# PicGo 3.0 unified async config source 真 async / flush 代码审计

日期：2026-06-24

## 结论

**不能按“全部真实全异步链路”归档。**

本轮代码审计确认：底层 Kernel adapter、`JSONStore`、facade 初始化读与显式 `writeOwnerFile()` 都是真实 async；不是读取 browser mock/localStorage 的假异步。

但当前 facade 层仍存在 **P1 async flush 语义缺口**：`update*Config()` 会调度 300ms auto-flush，而 `flush()` 不取消/接管该 debounce timer，也不等待 timer 已经触发的同 owner auto-flush。慢 Kernel 写入时，显式 `await flush()` 可能与 auto-flush 并发写同一个 owner file；`flush()` 返回后仍可能有同一次更新派生的后台写入继续运行并在稍后报错。

因此当前状态不是“fake read”，但也不是完整 durable/drainable async flush。应视为重大技术债，修完再归档。

## 已确认是真 async 的部分

- `libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.ts:22-24`
  - `mode = "async"`，`storageKind = "siyuan-kernel"`。
- `libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.ts:33-63`
  - `read()` 必须 `await readKernelFile()`；`unavailable` 直接结构化失败；只有真实 missing 才允许 legacy migration 或 `{}`。
- `libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.ts:66-86`
  - `write()` 必须 `await saveTextData()`，且 `await verifyWrite()` 写后读回 JSON 验证。
- `libs/Universal-PicGo-Store/src/lib/JSONStore.ts:32-35`
  - async adapter 构造后立即启动 `loadFromRemote()`。
- `libs/Universal-PicGo-Store/src/lib/JSONStore.ts:47-58`
  - `waitReady()` / `refreshAsync()` 都 await 远端。
- `libs/Universal-PicGo-Store/src/lib/JSONStore.ts:69-85`
  - `flush()` 会清掉自身 pending timer，并 await `writePromise`，失败会抛出。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:489-495`
  - 产品初始化会 await ready facade，并 await 初始 `configFacade.flush()` 后再 attach 到 PicGo ctx。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts:360-366`
  - 真实上传前会 `await this.ctx().reloadConfigAsync()`，避免长生命周期实例使用旧配置。

## 偏离：facade flush 不是完整 drain

证据：

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:559-583`
  - `updatePicGoConfig()` / `updateExternalPicGoConfig()` / `updateSiyuanConnectionConfig()` 只修改内存、置 `dirty = true`，然后 `scheduleFlush(...)`；它们的 `Promise<void>` 不表示持久化完成。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:586-610`
  - `flush()` 只遍历 dirty owners 并 `await writeOwnerFile(fileState)`；没有清理 `state.debounceTimers`，也没有等待已触发的 auto-flush promise。
- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts:704-728`
  - `scheduleFlush()` 的 timer 到期后，如果 `dirty` 仍为 true，会独立 `await writeOwnerFile(fileState)`，失败只 log `auto-flush failed`，不向显式 `flush()` 调用方传播。

可复现场景（代码路径推导）：

1. 调用 `updatePicGoConfig()`，owner dirty，并设置 300ms debounce timer。
2. 调用方立刻 `await facade.flush(["picgoMain"])`。
3. 如果 Kernel `write + verify` 超过 300ms，timer 会在显式 flush 尚未完成时触发。
4. timer 看到 `fileState.dirty === true`，启动第二次同 owner `writeOwnerFile()`。
5. 显式 flush 只等待自己启动的那次 write；后台 auto-flush 仍可能继续，且错误只进入日志。

这意味着 `flush()` 没有真正 drain 同一次 mutation 派生的所有写入任务，不满足“全部真实全异步链路”收口标准。

## 生产调用链补充观察

- 设置页主配置、external/PicList、SiYuan connection 都有显式 flush 入口：
  - `packages/picgo-plugin-app/src/stores/useBundledPicGoSetting.ts:35-36`
  - `packages/picgo-plugin-app/src/stores/useExternalPicGoSetting.ts:36-38`
  - `packages/picgo-plugin-app/src/stores/useSiyuanSetting.ts:33-35`
- 但 `packages/picgo-plugin-app/src/stores/common/picgoStorage.ts:33-40` 中 `StorageLike.setItem()` 只能 fire-and-forget `afterWrite` Promise；错误会回调显示，但 UI 调用栈不能 await 保存完成。
- `UniversalPicGo.saveConfig()` / `removeConfig()` 仍是同步兼容 API：
  - `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts:203-217`
  - `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts:220-235`
  - facade-backed 时它们只 fire-and-forget `updatePicGoConfig()`；持久化必须由调用方再 `await ctx.flushConfig()`。

这些设计可接受为兼容层，但必须通过 facade flush 的真正 drain 语义兜底；当前 P1 缺口未修前，不应归档。

## 本轮验证

通过但未覆盖上述 race：

```bash
pnpm --filter universal-picgo exec vitest run src/config/UnifiedConfigFacade.spec.ts src/config/SettingsStorePattern.spec.ts
pnpm --filter zhi-siyuan-picgo exec vitest run src/lib/SiYuanKernelStorageAdapter.spec.ts
pnpm audit:picgo-refactor
```

结果：

- `UnifiedConfigFacade.spec.ts` + `SettingsStorePattern.spec.ts`：39 tests passed。
- `SiYuanKernelStorageAdapter.spec.ts`：5 tests passed。
- `pnpm audit:picgo-refactor`：contract / boundaries / v3-unified-config / bundle 均 ok。

说明现有测试/审计 gate 证明了基础 async 读写与显式 flush 路径，但还缺少“显式 flush 必须取消/等待 debounce auto-flush”的并发语义用例。

## 修复 prompt（交给 agent）

```text
你是修复 agent。目标：修复 picgo-3-unified-async-config-source 的 facade flush 并发语义，使其成为真正 drainable/durable async flush；修复前不得归档。

背景：
- Kernel adapter / JSONStore 本身已是真 async。
- 问题集中在 libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts：
  update*Config() 会 schedule 300ms auto-flush；
  flush() 当前不取消 debounce timer，也不等待 timer 已触发的同 owner auto-flush。
- 慢 Kernel write 时，await flush() 可能与 auto-flush 并发写同 owner，且 flush 返回后后台 auto-flush 仍可能报错。

必须完成：
1. 为 UnifiedConfigFacade 增加 per-owner 写入任务管理：
   - 记录 debounce timer；
   - 记录 in-flight write promise；
   - 保证同一 owner 的 write 串行化。
2. 修改 flush(domains?)：
   - 对待 flush 的 owner 先 clearTimeout 并从 debounceTimers 删除；
   - 将当前 dirty 状态纳入本次 flush；
   - await 该 owner 所有已在运行或本次启动的写入；
   - flush resolve 后，不允许同一次 mutation 派生的 auto-flush 再写一次；
   - 写失败必须聚合为 ConfigFlushError，并且不能只 log。
3. 修改 scheduleFlush()：
   - timer 触发后必须复用同一 per-owner enqueue/write pipeline；
   - auto-flush 与 explicit flush 不能并发写同一 owner。
4. 明确 update*Config() 语义：
   - 它是 in-memory mutation + scheduled persistence，不代表 durable；
   - 所有需要 durable 的产品路径必须 await flush()/ctx.flushConfig()。
   - 如需要，新增 save*Config()/updateAndFlush*Config()，但不要破坏旧同步 API。
5. 补测试：
   - 使用 fake timers + 慢 async adapter：update 后立即 flush，推进 300ms，write 只能发生一次；
   - auto-flush 已经 in-flight 时调用 flush，flush 必须等待该 in-flight write；
   - auto-flush/flush 失败必须能被显式 flush 捕获或不会在 flush resolve 后才报错；
   - 生产 settings/headless 路径仍能保存并读回。
6. 更新 scripts/picgo-internal-refactor-audit.cjs，加 gate 防止 flush 不清理 debounceTimers / 不管理 in-flight write 回归。
7. 运行并记录：
   pnpm --filter universal-picgo exec vitest run src/config/UnifiedConfigFacade.spec.ts src/config/SettingsStorePattern.spec.ts
   pnpm --filter universal-picgo exec vitest run
   pnpm --filter zhi-siyuan-picgo exec vitest run
   pnpm audit:picgo-refactor
   openspec validate picgo-3-unified-async-config-source --strict
   openspec validate --all --strict
   pnpm package

约束：
- 不允许 mock 掉 Kernel 真实 async 语义来掩盖问题。
- 不要回退到 legacy localStorage 读写决策。
- 不要改变三 owner file mapping、v3 migration state、mask 规则。
- 修复后新增 docs/audits 记录，说明为什么 flush 已经真正 drain。
```
