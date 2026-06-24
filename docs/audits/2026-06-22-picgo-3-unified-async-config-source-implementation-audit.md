# picgo-3-unified-async-config-source 实现审计

- 审计时间：2026-06-22（本地命令执行时间显示为 2026-06-23 01:xx，时区/环境时间差异不影响结果）
- 审计范围：`picgo-3-unified-async-config-source` 当前工作区实现与未提交改动。
- 结论：本轮修复后，核心验收门禁通过；生产路径中的 legacy config decision read 已移除，ready facade 已接入 upload/settings/paste/headless/Lsky 关键链路。

## 本轮关键修复摘要

- `UnifiedConfigFacade`：async owner file read/reload failure 显式抛 `ConfigReadError`，不二次 `adapter.read()`，不写 `{}`，不 merge defaults 继续启动；flush failure 保留 owner/domain/storage kind。
- `SiYuanKernelStorageAdapter`：区分 missing 与 unavailable/auth/write failure；missing 可作为空 owner file，unavailable/auth failure 直接结构化失败。
- `ExternalPicgoConfigDb`：async backend 不再 constructor-time 写 defaults；ready 后再补缺失默认值并 flush。
- `ExternalPicgo` / `PicListUploader`：生产 route decision 不再各自 `new ExternalPicgoConfigDb`，改由 ready facade snapshot/provider 注入。
- `Lsky uploader`：生产代码删除 `siyuan_picgo_plugin_lsky_token` localStorage fallback；新 token 写 `uploader.lsky.token` 点路径并 flush。
- `paste/bootstrap`：listener 注册前预热 `pasteTakeoverSnapshot`；事件到达时只用 snapshot 同步决定是否接管，snapshot 不可用则不接管。
- settings：external/PicList 与 SiYuan connection settings 改为 facade-backed；SiYuan client 不再通过 settings localStorage 引导实例。
- headless：配置读取、当前 uploader、保存 uploader config、upload 等 API async 化并在操作前等待 ctx/facade ready。
- migration/default recognition：补 workspace/home/browser 优先级测试；修复 external/Siyuan/default 误判；默认 PicList URL 保持空，旧 `https://example.com/upload` 仅作为 legacy generated-default recognizer。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter universal-picgo-store build` | ✅ 通过 |
| `pnpm --filter universal-picgo build` | ✅ 通过 |
| `pnpm --filter zhi-siyuan-picgo build` | ✅ 通过 |
| `pnpm --filter picgo-plugin-app build` | ✅ 通过（仅 chunk size / Node deprecation warning） |
| `pnpm --filter picgo-plugin-bootstrap build` | ✅ 通过 |
| `pnpm --filter universal-picgo-store exec vitest run` | ✅ 2 files / 9 tests |
| `pnpm --filter universal-picgo exec vitest run` | ✅ 19 files / 183 tests |
| `pnpm --filter zhi-siyuan-picgo exec vitest run` | ✅ 4 files / 17 tests |
| `openspec validate picgo-3-unified-async-config-source --strict` | ✅ valid |
| `openspec validate --all --strict` | ✅ 9 passed / 0 failed |

## Grep / audit gates

### legacy main config localStorage read

命令：

```powershell
rg 'window\.localStorage\.getItem\("universal-picgo/picgo\.cfg\.json"' libs packages -n -g '!**/node_modules/**'
```

结果：无命中。

### legacy Lsky token key

命令：

```powershell
rg 'siyuan_picgo_plugin_lsky_token' libs packages -n -g '!**/node_modules/**'
```

允许命中清单：

```text
libs/Universal-PicGo-Core/src/config/V3MigrationService.ts
libs/Universal-PicGo-Core/src/config/V3MigrationService.spec.ts
```

结论：只保留 migration/test fixture。

### production direct ExternalPicgoConfigDb construction

命令：

```powershell
rg 'new ExternalPicgoConfigDb|ExternalPicgoConfigDb\(' libs packages -n -g '!**/*.spec.ts' -g '!**/node_modules/**'
```

结果：无命中。

### PicList 非空默认值

命令：

```powershell
rg 'picListApiUrl\s*[:=]\s*["'']https?://' libs packages -n -g '!**/*.spec.ts' -g '!**/node_modules/**' -g '!**/public/libs/**'
```

结果：无生产默认命中。`DefaultRecognition.ts` 中的 `https://example.com/upload` 仅用于识别旧 generated default，不是 v3 默认写入值。

## 注意事项

- 当前包版本仍显示 `2.1.1`。本次修复按 PicGo 3.0 breaking contract 实现配置 API/行为；版本号提升如不在本变更内完成，应在发布任务中显式处理，避免以 2.x 形式发布。
- `openspec/changes/picgo-3-unified-async-config-source/tasks.md` 的全勾选状态仍视为历史状态；本审计以实际构建、测试与 grep 结果为准。
