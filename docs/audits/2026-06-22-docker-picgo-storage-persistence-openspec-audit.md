# Docker PicGo 配置持久化 OpenSpec 提案审计

- 审计日期：2026-06-22
- 审计对象：`openspec/changes/docker-picgo-storage-persistence/`
- 对照基准：`docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md`
- 计划来源：`.hermes/plans/2026-06-22_020000-docker-picgo-storage-persistence.md`

## 结论

**审计通过，P0 = 0，P1 = 0。可以进入实现。**

本轮重新审计确认：上次指出的 `readTextFileStrict()` / `saveTextDataStrict()` 事实错误已从 OpenSpec 中清除；`getFile()` / `saveTextData()` 已被正确恢复为通过 `SiyuanKernelApi` 实例调用的真实 d.ts 方法，而不是被误列为禁止项。

## 校验结果

```text
openspec status --change docker-picgo-storage-persistence --json
=> isComplete: true，proposal/design/specs/tasks 均为 done

openspec validate docker-picgo-storage-persistence --strict
=> Change 'docker-picgo-storage-persistence' is valid
```

旧错误方法名检查结果：

```text
readTextFileStrict / saveTextDataStrict / strict 方法 / strict 读 / strict 保存 / strict 文本
=> 0 occurrences
```

## 最后方法名修正复核

### proposal.md

`proposal.md` 已改为真实 API 边界：

```md
Kernel adapter 使用其 d.ts 暴露的 isFileExists / getFile / saveTextData 方法，不直接 fetch、拼接 /api/file/* URL 或调用裸 Kernel HTTP endpoint。
```

这与最终审计一致。

### design.md

`design.md` 已统一为：

```md
SiYuanKernelStorageAdapter 仅依赖 SiyuanKernelApi 真实 d.ts 中存在的文件方法，例如 isFileExists(path, "text")、getFile(path, "text")、saveTextData(path, text)。
```

旧的“strict 方法分类”表述也已改为：

```md
adapter 只通过 SiyuanKernelApi 实例调用 isFileExists/getFile/saveTextData；写入后检查 SiyuanData.code，非 0 显式失败。
```

### tasks.md

`tasks.md` 第 3 阶段已改为：

```md
3.2 基于 SiyuanKernelApi 真实 d.ts 方法实现 Kernel adapter 读写：isFileExists(path, "text")、getFile(path, "text")、saveTextData(path, text)。
3.3 实现 SiYuanKernelStorageAdapter：只持有/使用 SiyuanKernelApi 实例读写 data/storage/syp/picgo/picgo.cfg.json，MUST NOT 直接 fetch、拼接 /api/file/* URL 或调用裸 Kernel HTTP endpoint；写入后检查 SiyuanData.code，非 0 抛错。
```

这已经符合最终审计。

### specs

`specs/docker-picgo-storage-persistence/spec.md` 已明确：

- 读取时通过 `SiyuanKernelApi.isFileExists(path, "text")` 判断存在性；
- 文件存在时通过 `SiyuanKernelApi.getFile(path, "text")` 读取；
- 写入时通过 `SiyuanKernelApi.saveTextData(path, text)`；
- 写入后检查 `SiyuanData.code`，非 0 显式失败；
- 禁止的是直接 `fetch`、拼接 `/api/file/*` URL 或绕过 `SiyuanKernelApi` 实例访问 Kernel HTTP endpoint。

`specs/picgo-product-library-boundary/spec.md` 也已改为允许 adapter 通过 `SiyuanKernelApi` 实例调用 d.ts 暴露的 `isFileExists/getFile/saveTextData` 文件方法。

## 全量对照结果

### 1. Kernel API 唯一业务入口

通过。

OpenSpec 已统一为：业务层持有/使用 `SiyuanKernelApi` 实例；禁止直接 `fetch`、拼接 `/api/file/*` URL 或访问裸 Kernel HTTP endpoint。

### 2. 主配置路径与同步范围

通过。

OpenSpec 明确：

```text
universal-picgo/picgo.cfg.json -> data/storage/syp/picgo/picgo.cfg.json
```

并明确 `external-picgo-cfg.json`、`package.json`、i18n、插件运行时文件和本地缓存不进入 Kernel 主配置文件。

### 3. iframe 设置页独立 runtime 判定

通过。

spec/design/tasks 均覆盖：设置页 iframe 独立解析 storage adapter factory，不依赖 bootstrap 父窗口 singleton；`window.top.siyuan` 探测失败时安全 fallback。

### 4. `getInstance()` 参数归一化与 instanceKey

通过。

tasks/design 覆盖：

- `options?: boolean | SiyuanPicGoInstanceOptions` 先归一化；
- `instanceKey` 至少包含 `apiUrl`、`configPath`、`baseDir`、`pluginBaseDir`、`zhiNpmPath`、`storageKind`。

### 5. IPicGo 公开 API

通过。

OpenSpec 覆盖：

```ts
storageMode: "sync" | "async"
reloadConfigAsync(): Promise<IConfig>
flushConfig(): Promise<void>
```

并要求 `reloadConfigAsync()` 在 async/kernel 模式刷新远端后返回最新配置。

### 6. 写入失败显式暴露

通过。

OpenSpec 覆盖：

- async store 写入失败由后续 `flush()` 抛出；
- 默认配置初始化失败阻止 init 成功；
- 设置页保存失败通过 `onAfterWriteError` 提示。

### 7. 设置页 useStorage 自动保存链路

通过。

OpenSpec 覆盖 deep watch、`flush: "post"`、debounce 调用 `afterWrite()`，调用侧在 async/kernel 模式接入 `ctx.flushConfig()`，失败显示“图床配置保存失败”。

### 8. `refreshAsync()` 并发保护

通过。

OpenSpec 覆盖：

- `refreshAsync()` 先 `flush()`；
- 远端读取到临时数据；
- 读取期间本地发生 `set()` 时，不用远端旧数据覆盖本地新写入。

### 9. localStorage 迁移策略

通过。

OpenSpec 覆盖：

- Kernel 文件 missing 且 localStorage 有合法旧配置时迁移；
- Kernel 文件 exists 时以 Kernel 为准；
- Kernel API unavailable 时显式失败，不静默 fallback。

### 10. 每阶段类型检查/测试与验收确认

通过。

`tasks.md` 已按阶段要求执行类型检查/测试，并在每阶段后对照最终审计验收清单确认。当前列出的命令覆盖：

- `universal-picgo-store`
- `universal-picgo`
- `zhi-siyuan-picgo`
- `picgo-plugin-bootstrap`
- `picgo-plugin-app`
- 全量 `pnpm build` / `pnpm lint` / `openspec validate ... --strict`

## 建议状态

**可以进入实现。**

后续实现时应直接以当前 OpenSpec 为准；如果代码实现中需要调整命令或测试入口，应保持“每阶段类型检查/测试 + 对照最终审计验收清单确认”的原则不变。
