# PicGo 3.0 unified async config source async flush 修复审计

日期：2026-06-24

## 结论

已修复 `UnifiedConfigFacade` 的 fake/drain 缺口：同一 facade 实例内，`await facade.flush(domains?)` 现在是可等待的 durable barrier。

本次修复保留 300ms debounce 防频繁写入，但 explicit flush 会先接管 pending debounce，并复用同一 per-owner 写入队列；auto-flush 与 explicit flush 不再并发写同一个 owner file。

边界说明：本修复解决的是**同一 facade 实例内**的并发读写/drain 语义，不声明跨窗口、跨进程、跨 facade 的 CAS 强一致；跨进程仍是 owner file last-writer-wins，如需强一致需另起设计。

## 关键修复

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts`
  - 为每个 owner 增加 `dirtyVersion`、`flushedVersion`、`writeQueue`、`currentWriteTask`、`currentWriteVersion`。
  - 所有 mutation/default/migration marker 写入统一走 `markOwnerDirty()`，用单调版本记录 pending mutation。
  - `flush()` 对目标 owner 先 `cancelScheduledFlush(state, ownerFile)`，再走 `flushOwnerFile()`。
  - `scheduleFlush()` 的 timer 回调不再直接 `writeOwnerFile()`，改为复用 `flushOwnerFile()`。
  - `flushOwnerFile()` 会：
    - join 已覆盖目标版本的 in-flight write；
    - 对新目标版本捕获 deep-cloned snapshot；
    - 通过 per-owner `writeQueue` 串行写入；
    - 成功后仅当没有更高 `dirtyVersion` 时清 dirty，避免旧 flush 覆盖/隐藏新 mutation；
    - 失败后保留 dirty，下一次 explicit flush 可重试。
  - `writeOwnerFile()` 对 `set`-only adapter 分支在 set 后额外 await `flush()`（若存在），避免兼容层出现“set 了但未 drain”的假完成。

## 新增覆盖

- `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.spec.ts`
  - `update` 后立即 explicit `flush`，推进 300ms，确认只写一次。
  - auto-flush 已 in-flight 时 explicit `flush` join 同一 write，不重复写。
  - flush 期间发生第二次 update，旧 flush 不会清掉新 dirty；第二次 flush 写入新快照。
  - 写失败后 dirty 保留，下一次 explicit flush 可重试并成功。

- `scripts/picgo-internal-refactor-audit.cjs`
  - 增加 gate：必须存在 `dirtyVersion/writeQueue/currentWriteTask`。
  - `flush()` 必须调用 `cancelScheduledFlush()` 与 `flushOwnerFile()`。
  - `scheduleFlush()` 必须复用 `flushOwnerFile()`，不得直接 `writeOwnerFile()`。
  - `flushOwnerFile()` 必须保留 queue/non-rejecting tail、target version、dirty retry 关键语义。

## 验证结果

全部通过：

```bash
pnpm --filter universal-picgo exec vitest run src/config/UnifiedConfigFacade.spec.ts src/config/SettingsStorePattern.spec.ts
# 2 files / 43 tests passed

pnpm --filter universal-picgo exec vitest run
# 19 files / 196 tests passed

pnpm --filter universal-picgo exec tsc --noEmit
# passed

pnpm --filter zhi-siyuan-picgo exec vitest run
# 6 files / 26 tests passed

pnpm --filter zhi-siyuan-picgo exec tsc --noEmit
# passed

pnpm audit:picgo-refactor
# contract / boundaries / v3-unified-config / bundle ok

openspec validate picgo-3-unified-async-config-source --strict
# valid

openspec validate --all --strict
# 9 passed, 0 failed

pnpm package
# 插件打包完毕，build/siyuan-plugin-picgo-2.1.1.zip generated
```

构建期间仍有既有环境/打包 warning：`LC_ALL C.UTF-8`、Node `DEP0180`、chunk size warning；均非本次 async config 链路错误。

## 归档判断

当前“底层真实 async + facade drainable flush”已满足本轮底线：可作为 `picgo-3-unified-async-config-source` 归档前代码状态。

建议归档前只做一次人工 diff review，确认本轮未引入 scope 外变更；不需要另派新 agent 修复本缺陷。
