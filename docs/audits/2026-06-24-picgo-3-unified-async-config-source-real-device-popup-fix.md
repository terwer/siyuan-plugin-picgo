# PicGo 3.0 unified async config source 真机 popup 问题修复审计

日期：2026-06-24

## 结论

已修复用户真机测试中“仅点击 popup 即报 `saveTextData failed: unknown error`”的问题。

本次不属于读取源错误：`static-rs-terwer` 是此前 PC 保存的真实配置值，日志中 main / external / siyuan-cfg 均经 Kernel `/data/storage/syp/...` 读取成功，说明插件确实读到了真实 owner files。

实际问题分两层：

1. `removeConfig("siyuan", "proxy")` 对已不存在的 legacy 字段仍触发 facade 更新，导致 popup 初始化无意义写 `/data/storage/syp/picgo/picgo.cfg.json`。
2. `SiYuanKernelStorageAdapter.write()` 将 `SiyuanKernelApi.saveTextData()` 的运行时返回误认为完整 `{ code, msg, data }`；`zhi-siyuan-api@2.21.0` 成功时返回的是 `data`，常见为 `null`，因此成功写也可能被误报为 `unknown error`。

## 修改点

- `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts`
  - `removeConfig()` 先对当前内存 config 执行 `unsetByPath()`。
  - 只有实际删除成功才调用 `unifiedConfigFacade.updatePicGoConfig()` 或 `db.unset()`。
  - 缺失 `siyuan.proxy` 时不再 schedule auto-flush。

- `libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.ts`
  - `saveTextData()` throw 会包装成结构化 Kernel write error。
  - 只有返回对象明确包含数值 `code !== 0` 才视为失败。
  - `null` / 无 `code` 的成功返回不再误判。
  - 增加写后 `getFile()` 读回 JSON verification，避免吞掉真实写失败。

- 测试新增/更新：
  - `libs/zhi-siyuan-picgo/src/lib/SiYuanKernelStorageAdapter.spec.ts`
  - `libs/Universal-PicGo-Core/src/core/UniversalPicGo.spec.ts`

## 验证

通过：

```bash
pnpm --filter zhi-siyuan-picgo exec vitest run src/lib/SiYuanKernelStorageAdapter.spec.ts
pnpm --filter universal-picgo exec vitest run src/core/UniversalPicGo.spec.ts
pnpm --filter universal-picgo exec vitest run
pnpm --filter zhi-siyuan-picgo exec vitest run
pnpm --filter universal-picgo exec tsc --noEmit
pnpm --filter zhi-siyuan-picgo exec tsc --noEmit
pnpm --filter universal-picgo build
pnpm --filter zhi-siyuan-picgo build
pnpm audit:picgo-refactor
openspec validate picgo-3-unified-async-config-source --strict
openspec validate --all --strict
pnpm package
```

其中：

- `universal-picgo`：19 files / 192 tests 通过。
- `zhi-siyuan-picgo`：6 files / 26 tests 通过。
- `pnpm audit:picgo-refactor`：contract / boundaries / v3-unified-config / bundle 均通过。
- `pnpm package` 已生成最新 `artifacts/siyuan-plugin-picgo/dist` 与 `build/package.zip`。

## 建议真机复测

用最新打包产物重复两个场景：

1. PC 客户端点击 popup。
2. 网页打开但可用 SiYuan API 的 Docker-like 场景点击 popup。

预期：

- 仍能显示 `static-rs-terwer`。
- 若 `siyuan.proxy` 已不存在，仅打开 popup 不应再触发 `picgo.cfg.json` Kernel auto-flush。
- 若未来确有 legacy `siyuan.proxy` 需要清理，写入成功不应再因为 `saveTextData()` 返回 `null` 被误报为 `unknown error`。
