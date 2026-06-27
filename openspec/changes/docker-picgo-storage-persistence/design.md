## Context

本 change 以 `docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md` 为实现约束和验收依据；若其与 `.hermes/plans/2026-06-22_020000-docker-picgo-storage-persistence.md` 存在冲突，以最终审计文件为准。

当前核心问题是 Docker/Web 部署思源时 PicGo 主配置可能只保存在当前浏览器 `localStorage`，导致设备 A 修改图床配置后，设备 B 无法在设置页或上传前读取同一配置。桌面/Electron 已有本地文件路径契约仍需保留，纯浏览器无 Kernel API 时仍需 fallback 到 localStorage。

相关边界：

- 只有 PicGo 主配置 `universal-picgo/picgo.cfg.json` 在 Docker/Web 下映射到 Kernel 文件 `data/storage/syp/picgo/picgo.cfg.json`。
- `external-picgo-cfg.json`、`package.json`、i18n、插件运行时文件和本地缓存仍为设备本地数据。
- 业务层唯一 Kernel API 来源是 `SiyuanKernelApi` 实例；业务代码应通过其真实 d.ts 暴露的 `isFileExists(path, "text")`、`getFile(path, "text")`、`saveTextData(path, text)` 完成文件读写，不得绕过封装直接 `fetch`、拼接 `/api/file/*` URL 或调用裸 Kernel HTTP endpoint。
- 设置页 iframe 是独立 JS realm，不能依赖 bootstrap 父窗口中已经计算好的 static singleton。
- 上层 PicGo API 仍需要保持同步调用形态，同时 async/kernel 模式必须能等待初始化、刷新远端、flush pending write 并显式暴露失败。

## Goals / Non-Goals

**Goals:**

- Docker/Web 下 PicGo 主配置通过 SiYuan Kernel 持久化到 `data/storage/syp/picgo/picgo.cfg.json`，实现多设备 Web 共享。
- 保持桌面/Electron 端本地 JSON 文件行为不回退。
- 纯浏览器或无法访问 `window.top.siyuan` 时继续使用 localStorage fallback。
- 将 async storage 的异步边界收口到 `waitReady()`、`refreshAsync()`、`flush()`、`reloadConfigAsync()` 和 `flushConfig()`。
- Kernel 文件不存在且旧 localStorage 有有效配置时执行一次性迁移；Kernel 文件存在时以 Kernel 为准。
- 设置页自动保存和上传链路使用同一持久化配置来源，并在失败时明确报错。
- 按阶段实施，每阶段完成后执行类型检查/测试，并逐项对照最终审计验收清单确认。

**Non-Goals:**

- 不迁移或同步 `external-picgo-cfg.json`、插件运行时、第三方插件依赖、i18n、本地缓存、日志或 clipboard 临时文件。
- 不改变 PicGo 配置 JSON 的外部兼容结构，除非既有初始化默认值要求写入缺失字段。
- 不引入绕过 `SiyuanKernelApi` 的业务层 Kernel endpoint 调用。
- 不把纯浏览器 localStorage fallback 误当作 Docker/Web Kernel API 不可用时的静默降级；Docker/Web 已判定为 kernel 模式后 Kernel API 不可用必须失败。
- 本提案只生成 OpenSpec artifacts，不实施业务代码。

## Decisions

### Decision 1: storage adapter 采用显式 sync/async 双模式

`universal-picgo-store` 定义同步 adapter 与异步 adapter：同步 adapter 用于本地 JSON 文件和 localStorage，异步 adapter 用于 SiYuan Kernel 文件读写。`JSONStore` 构造时必须接收 adapter，不再依赖内部隐式 Node/browser 探测。

- Rationale: storage capability 由调用层根据 runtime 注入，可以避免 core 层直接探测 Node/Electron/SiYuan/browser，符合 runtime boundary 和 product/library boundary。
- Alternative considered: 在 `JSONStore` 内继续根据 `hasNodeEnv` 或全局对象自动选择。该方案会让 iframe、publisher、bootstrap 的真实 runtime 被静态 singleton 或错误 realm 污染，审计文件明确不接受。

### Decision 2: 上层同步 API 保留，async 模式使用内存缓存 + 明确异步边界

`JSONStore` 在 async/kernel 模式下先异步读取远端并维护内存快照；`get/set/read/reloadConfig()` 等同步 API 仍读写内存。持久化通过 debounce write 写入远端，`flush()` 用于等待并暴露写入错误，`refreshAsync()` 用于上传前拉取远端最新配置。

- Rationale: 现有 PicGo core 和设置页大量依赖同步配置访问，直接把所有调用改成 async 会扩大风险；通过 `waitReady()` / `flush()` / `refreshAsync()` 可以将 async 复杂度集中到少数边界。
- Alternative considered: 将所有配置 API 改为 async。该方案影响面过大，也不是 issue #460 的必要条件。

### Decision 3: `refreshAsync()` 必须先 flush 再读远端，并用 `writeVersion` 保护并发

刷新远端配置前必须先 `flush()` 本地 pending write；随后记录 `writeVersion`，读取远端到临时变量。若远端读取期间本地发生新的 `set()`，则跳过覆盖并记录 warning。

- Rationale: 多设备同步需要上传前读取远端，但不能用远端旧数据覆盖本地用户刚刚在设置页修改的配置。
- Alternative considered: 读取远端后直接覆盖内存。该方案会丢失并发本地写入，不满足最终审计验收项。

### Decision 4: Docker/Web Kernel adapter 只处理 PicGo 主配置

storage factory 对 `dbPath === "universal-picgo/picgo.cfg.json"` 返回 `SiYuanKernelStorageAdapter`；其他 db path 返回 localStorage adapter。Kernel server path 固定为 `data/storage/syp/picgo/picgo.cfg.json`。

- Rationale: issue #460 只要求图床主配置跨设备共享；外部 PicGo API、插件运行时、i18n 和缓存是设备本地或运行时数据，强行同步会破坏路径拆分契约。
- Alternative considered: 将整个 PicGo 数据目录都迁移到 Kernel storage。该方案会同步设备绑定配置和运行时文件，违反最终审计约束。

### Decision 5: Kernel 文件访问统一封装在 `SiyuanKernelApi`

`SiYuanKernelStorageAdapter` 仅依赖 `SiyuanKernelApi` 真实 d.ts 中存在的文件方法，例如 `isFileExists(path, "text")`、`getFile(path, "text")`、`saveTextData(path, text)`。底层 HTTP endpoint 由 `SiyuanKernelApi` 内部处理。

- Rationale: 业务层保持单一 API 来源，避免不同入口自行解释 Kernel 成功/失败语义，也便于鉴权失败、网络失败、文件缺失等场景统一暴露。
- Alternative considered: 在 adapter 中直接 `fetch`、拼接 `/api/file/*` URL 或调用裸 Kernel HTTP endpoint。最终审计明确禁止业务层绕过 `SiyuanKernelApi` 实例。

### Decision 6: runtime factory 每个 JS realm 独立判定

`resolveStorageAdapterFactory()` 在当前 runtime 内独立判断：Electron/Node 走 JSON 文件；Docker/Web 且可安全访问 `window.top.siyuan` 走 Kernel adapter；否则 fallback localStorage。访问 `window.top.siyuan` 必须包裹 try/catch。

- Rationale: 设置页运行在 iframe 中，父窗口 bootstrap 的 static singleton 对当前 realm 不可靠；跨域访问也可能抛异常。
- Alternative considered: bootstrap 初始化一次 storage kind 后全局复用。该方案无法保证设置页 iframe 和 publisher 入口使用同一判定逻辑。

### Decision 7: `getInstance()` 参数先归一化，instance key 纳入 storage kind 与路径

`SiyuanPicGo.getInstance(config, options?: boolean | SiyuanPicGoInstanceOptions)` 必须先把 boolean 旧参数归一化为 `{ isDev }`，再访问 `storageAdapterFactory`、`paths` 等字段。单例 `instanceKey` 至少包含 `apiUrl`、`configPath`、`baseDir`、`pluginBaseDir`、`zhiNpmPath` 和 `storageKind`。

- Rationale: 保持旧调用兼容，并避免不同 storage kind 或路径共用陈旧单例。
- Alternative considered: 直接假定 options 为对象。该方案会破坏旧 boolean 调用。

### Decision 8: 设置页 flush 绑定 `useCommonPicgoStorage()` watcher

设置页没有统一保存按钮，真实保存链路是 `v-model` + VueUse `useStorage`。因此 async/kernel 模式下应在 `useCommonPicgoStorage()` 对 storage deep watch，debounce 后调用 `afterWrite`，由调用侧接入 `ctx.flushConfig()`，失败通过 `onAfterWriteError` 显示错误。

- Rationale: flush 必须绑定真实写入源，否则用户连续编辑嵌套字段时可能只更新内存或 localStorage mirror，不落盘到 Kernel。
- Alternative considered: 仅在某些显式按钮或页面退出时 flush。设置页没有统一保存按钮，不能覆盖全部自动保存路径。

### Decision 9: 初始化和上传入口显式等待 ready/refresh

`UniversalPicGo.init()` 等待 config db ready 后再初始化 i18n、plugin loader、lifecycle；async/kernel 模式首次默认配置初始化必须 `flush()`，失败即阻止 init 成功。上传前通过 `reloadConfigAsync()` 拉取最新远端配置。

- Rationale: Docker/Web 多设备共享要求设置页和上传入口都使用同一远端事实源，并且写入失败不能静默成功。
- Alternative considered: 仅在设置页刷新远端。该方案无法保证设备 B 上传前使用设备 A 最新配置。

## Risks / Trade-offs

- [Risk] async storage 在保持同步 API 时可能让未等待 `init()` 的调用读到空内存。→ Mitigation: 所有公开创建入口必须 await init；`IPicGo` 暴露 `reloadConfigAsync()` / `flushConfig()`，任务中加入 init await 验证。
- [Risk] debounce write 被页面关闭或路由切换打断。→ Mitigation: 设置页 watcher 调用 `flushConfig()`，上传前 `reloadConfigAsync()` 先 flush pending write，关键初始化默认配置也 flush。
- [Risk] Kernel API 错误处理不一致导致误 fallback 或静默成功。→ Mitigation: adapter 只通过 `SiyuanKernelApi` 实例调用 `isFileExists(path, "text")`、`getFile(path, "text")`、`saveTextData(path, text)`；写入后检查 `SiyuanData.code`，非 0 显式失败；adapter 不直接 `fetch`、拼接 `/api/file/*` URL 或访问裸 Kernel HTTP endpoint。
- [Risk] localStorage 迁移覆盖已有 Kernel 配置。→ Mitigation: adapter read 先读 Kernel；仅 Kernel missing 且 localStorage 有合法 JSON 时迁移；Kernel exists 时永不迁移。
- [Risk] iframe 跨域访问 `window.top.siyuan` 抛异常。→ Mitigation: 所有 top window 探测使用 try/catch，异常即 fallback localStorage。
- [Risk] 仅主配置进入 Kernel 可能与用户期望“所有 PicGo 文件同步”不一致。→ Mitigation: proposal/spec 明确 scope，只同步主配置，其他设备本地 artifact 保持本地。

## Migration Plan

1. 在 `universal-picgo-store` 建立 adapter/JSONStore async 能力，不改变上层业务入口。
2. 在 `Universal-PicGo-Core` 接入 storage factory、ready/flush/reload API，并保证默认配置初始化错误显式抛出。
3. 在 `zhi-siyuan-picgo` 增加 `SiYuanKernelStorageAdapter`、runtime factory、options 归一化和幂等 init。
4. 在 bootstrap / 设置页 / 上传链路接入 factory、`reloadConfigAsync()`、`flushConfig()` 和错误提示。
5. 每个阶段完成后执行该阶段相关类型检查/测试，并对照最终审计文件验收清单逐项确认。

Rollback 策略：若 Docker/Web Kernel storage 出现阻断性问题，可在尚未发布前回退该 change；已迁移生成的 `data/storage/syp/picgo/picgo.cfg.json` 是 JSON 主配置副本，不应删除旧 localStorage 数据。实现不得做破坏性清理。

## Open Questions

无待确认问题。本 change 的实现约束和验收依据以 `docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md` 为准。
