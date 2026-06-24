## 1. universal-picgo-store

- [x] 1.1 阅读并标记最终审计文件 `docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md` 中与 store 层相关的约束：async adapter、flush、refresh、写入错误显式暴露、pending write 并发保护。
- [x] 1.2 定义 `ISyncStorageAdapter`、`IAsyncStorageAdapter`、`StorageAdapter` 与 storage factory 相关类型，异步 adapter MUST 使用 `mode: "async"` 明确标识。
- [x] 1.3 重构 `JSONStore` 构造逻辑，使 adapter 必传；同步 adapter 保持立即 read/write，async adapter 初始化远端读取并提供内存缓存。
- [x] 1.4 实现 `waitReady()`，确保 async adapter 远端读取完成或失败能够被调用方等待和观察。
- [x] 1.5 实现 async 模式 `set()` 后的 debounce 写入、`flush()` 等待 pending write、`lastWriteError` 捕获与抛出，禁止写入失败被日志吞掉后继续成功。
- [x] 1.6 实现 `refreshAsync()`：先 `flush()` 本地 pending write，再读取远端临时数据，并用 `writeVersion` 防止远端旧数据覆盖读取期间发生的本地 `set()`。
- [x] 1.7 保持同步 API 兼容：`read()`、`get()`、`set()`、`has()`、`unset()` 的 key/path 语义不得回退，尤其 `unset()` 保留原有 key 语义。
- [x] 1.8 更新 `libs/Universal-PicGo-Store/src/index.ts` 导出 `JSONStore`、`JSONAdapter`、`LocalStorageAdapter` 和新增 storage adapter 类型。
- [x] 1.9 为 async store 添加单元测试
- [x] 1.10 执行本阶段类型检查/测试：`pnpm --filter universal-picgo-store build`
- [x] 1.11 对照最终审计验收清单逐项确认本阶段覆盖情况，至少记录：写入失败显式暴露、连续 set 防抖落盘、refreshAsync 并发保护；未覆盖项标记为后续阶段待验收。

## 2. Universal-PicGo-Core

- [x] 2.1 阅读并标记最终审计文件中与 core 层相关的约束：`storageMode`、`reloadConfigAsync()`、`flushConfig()`、初始化默认配置 flush、公开 API 返回值一致。
- [x] 2.2 扩展 `IPicGo`：新增只读 `storageMode: "sync" | "async"`、`reloadConfigAsync(): Promise<IConfig>`、`flushConfig(): Promise<void>`。
- [x] 2.3 调整 `IUniversalPicGoOptions`，通过 `storageAdapterFactory` 注入 store 能力，core 不得直接探测 Node、browser、SiYuan 或产品 UI runtime。
- [x] 2.4 调整 `UniversalPicGo` 初始化：构造 config db 后维护 ready promise，`init()` 必须等待 config db ready 后再初始化 `_config`、i18n、plugin loader 与 lifecycle。
- [x] 2.5 实现 `reloadConfig()` 与 `reloadConfigAsync()` 的一致返回语义：sync 模式保持原有读配置；async/kernel 模式先刷新远端再返回最新 `IConfig`。
- [x] 2.6 实现 `flushConfig()`，委托 config db/store flush，并确保调用方能观察写入失败。
- [x] 2.7 调整 `ConfigDb.ensureReady()`：等待 db ready 后补齐默认 section；async/kernel 模式首次默认配置初始化后 MUST `flush()`，失败阻止 init 成功。
- [x] 2.8 适配 `ExternalPicgoConfigDb`、`PluginLoaderDb` 等 store consumers：仅 PicGo 主配置可以在后续 factory 中进入 Kernel storage，辅助配置仍使用 factory 返回的本地存储。
- [x] 2.9 调整 `HeadlessManager` 或等价无界面入口，透传 storage factory、await init，并暴露/使用 async refresh 与 flush 能力。
- [x] 2.10 添加或更新 core 测试：storageMode、reloadConfigAsync、flushConfig、默认配置 flush failure、headless consumer 使用同一配置来源。
- [x] 2.11 执行本阶段类型检查/测试：`pnpm --filter universal-picgo build` 与 `pnpm --filter universal-picgo exec vitest run`。
- [x] 2.12 对照最终审计验收清单逐项确认本阶段覆盖情况，至少记录：公开 API 返回值一致、首次 Docker 初始化默认配置 flush 失败会报错、无界面读取保存语义；未覆盖项标记为后续阶段待验收。

## 3. zhi-siyuan-picgo

- [x] 3.1 阅读并标记最终审计文件中与 `zhi-siyuan-picgo` 相关的约束：Kernel adapter、runtime factory、`getInstance()` 参数归一化、instanceKey、幂等 init、Docker localStorage 迁移。
- [x] 3.2 基于 `SiyuanKernelApi` 真实 d.ts 方法实现 Kernel adapter 读写：`isFileExists(path, "text")`、`getFile(path, "text")`、`saveTextData(path, text)`。
- [x] 3.3 实现 `SiYuanKernelStorageAdapter`：只持有/使用 `SiyuanKernelApi` 实例读写 `data/storage/syp/picgo/picgo.cfg.json`，MUST NOT 直接 `fetch`、拼接 `/api/file/*` URL 或调用裸 Kernel HTTP endpoint；写入后检查 `SiyuanData.code`，非 0 抛错。
- [x] 3.4 实现 Docker/Web 旧 localStorage 迁移：Kernel 文件 missing 且 localStorage 主配置合法时迁移；Kernel exists 时以 Kernel 为准；Kernel API unavailable 时抛错且不静默 fallback。
- [x] 3.5 定义 `SiyuanPicGoInstanceOptions`，支持 `isDev`、`paths`、`storageAdapterFactory`，并保持旧 `options?: boolean` 调用兼容。
- [x] 3.6 调整 `SiyuanPicGo.getInstance()`：先归一化 options，再解析 paths 和 storage factory；`instanceKey` 至少包含 `apiUrl`、`configPath`、`baseDir`、`pluginBaseDir`、`zhiNpmPath`、`storageKind`。
- [x] 3.7 实现 `resolveStorageAdapterFactory()`：Node/Electron 使用 `JSONAdapter`；Docker/Web 且可安全访问 `window.top.siyuan` 使用 Kernel adapter；纯浏览器或 top window 不可访问时 fallback `LocalStorageAdapter`，访问 `window.top.siyuan` MUST try/catch。
- [x] 3.8 确保 factory 仅对 `universal-picgo/picgo.cfg.json` 返回 Kernel adapter；`external-picgo-cfg.json`、`package.json`、i18n、插件运行时文件和本地缓存继续走本地存储。
- [x] 3.9 调整 `SiyuanPicgoPostApi.init()` 与 `SiyuanPicGoUploadApi.init()` 为幂等 init promise；async/kernel 模式下强制 bundled PicGo 所需配置。
- [x] 3.10 导出必要 adapter/factory 类型，保持 public exports 稳定，避免下游需要 deep source import。
- [x] 3.11 添加或更新测试：options boolean 归一化、storageKind 进入 instanceKey、iframe/top 探测 try/catch、localStorage 迁移矩阵、Kernel API unavailable 不 fallback、业务层无直接 `fetch`/裸 `/api/file/*` endpoint 访问。
- [x] 3.12 执行本阶段类型检查/测试：`pnpm --filter zhi-siyuan-picgo build` 与 `pnpm --filter zhi-siyuan-picgo exec vitest run`。
- [x] 3.13 对照最终审计验收清单逐项确认本阶段覆盖情况，至少记录：Docker/Web 初始化使用 Kernel adapter、设备 B 清空 localStorage 可读取 Kernel 配置、旧 localStorage 迁移、Kernel exists 优先、Kernel API 鉴权/网络失败显式报错、业务层唯一 API 来源为 `SiyuanKernelApi`。

## 4. bootstrap / 设置页 / 上传链路

- [x] 4.1 阅读并标记最终审计文件中与入口层相关的约束：bootstrap/publisher factory 接入、设置页 iframe 独立判定、上传前 `reloadConfigAsync()`、设置页 `useStorage` watcher flush 与错误提示。
- [x] 4.2 在 bootstrap 入口接入 storage factory：可显式传入 factory；未传时走 `resolveStorageAdapterFactory()`；UI 暴露前必须 await PicGo API init。
- [x] 4.3 在 publisher 或无界面上传入口按相同模式接入 storage factory，确保外部消费者不需要 hardcode Docker/Web 配置路径。
- [x] 4.4 在上传链路执行上传前调用 `reloadConfigAsync()` 或等价刷新流程，使设备 B 上传前拉取设备 A 已保存的 Kernel 主配置。
- [x] 4.5 调整设置页初始化：iframe runtime 内独立解析 storage factory，不依赖 bootstrap 父窗口 static singleton；`window.top.siyuan` 探测异常必须 fallback 而不是中断页面。
- [x] 4.6 调整 `useCommonPicgoStorage()`：在 `options.afterWrite` 存在时 deep watch storage，`flush: "post"`，debounce 约 500ms 后调用 `afterWrite()`。
- [x] 4.7 在设置页调用侧传入 `afterWrite: ctx.storageMode === "async" ? () => ctx.flushConfig() : undefined`，并通过 `onAfterWriteError` 显示“图床配置保存失败：<message>”。
- [x] 4.8 验证设置页连续修改嵌套字段后 debounce flush 最终写入 Kernel 文件，写入失败时不提示保存成功。
- [x] 4.9 验证 Docker/Web 多设备流程：设备 A 保存后 `data/storage/syp/picgo/picgo.cfg.json` 被写入；设备 B 清空 localStorage 打开设置页可读 A 配置；设备 A 改配置后设备 B 上传前拉取最新配置。
- [x] 4.10 验证非 Docker/Web 回归：Electron/PC 本地文件存储不回退；纯浏览器无 Kernel API 时仍 fallback localStorage。
- [x] 4.11 执行本阶段类型检查/测试：`pnpm --filter picgo-plugin-bootstrap build`、`pnpm --filter picgo-plugin-bootstrap exec vitest run`、`pnpm --filter picgo-plugin-app lint`、`pnpm --filter picgo-plugin-app build`，并按测试现状补充 `pnpm --filter picgo-plugin-app exec vitest run` 或等价非交互测试。
- [x] 4.12 执行全量验证：`pnpm build`、`pnpm lint`、`openspec validate docker-picgo-storage-persistence --strict` 或当前 OpenSpec CLI 支持的等价严格校验。
- [x] 4.13 对照最终审计文件验收清单逐项确认全部项目并记录证据：Kernel adapter、Kernel 文件写入、设备 B 读取、上传前刷新、鉴权/网络/写入失败报错、旧 localStorage 迁移、Kernel exists 优先、debounce flush、refreshAsync 并发保护、Electron/PC 保持本地文件、纯浏览器 fallback。
